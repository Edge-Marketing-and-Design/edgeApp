const stripe = require('stripe')(process.env.STRIPE_API_KEY)
const { onCall, HttpsError, logger, getFirestore, functions, admin, twilio, db, onRequest } = require('./config.js')

exports.redirectToBilling = onCall(async (request) => {
  const data = request.data
  const auth = request.auth

  if (data.uid !== auth.uid) {
    throw new HttpsError('failed-precondition', 'The function must be called by the user who is to be redirected.')
  }

  const userDoc = await db.collection('staged-users').doc(data.uid).get()
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'No user found for the provided ID.')
  }

  const collectionPaths = userDoc.data().collectionPaths
  if (!collectionPaths || collectionPaths.length === 0) {
    throw new HttpsError('not-found', 'No collection paths found for the user.')
  }

  const orgDoc = await db.doc(collectionPaths[0].replace('-', '/')).get()
  if (!orgDoc.exists) {
    throw new HttpsError('not-found', 'No organization found for the user.')
  }

  const stripeCustomerId = orgDoc.data().stripeCustomerId
  if (!stripeCustomerId) {
    throw new HttpsError('not-found', 'No Stripe customer ID found for the organization.')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: process.env.STRIPE_RETURN_URL,
  })
  return { url: session.url }
})

exports.webhook = onRequest(async (request, response) => {
  let event

  try {
    event = stripe.webhooks.constructEvent(request.rawBody, request.headers['stripe-signature'], process.env.STRIPE_SECRET)
  }
  catch (err) {
    await db.collection('stripe').add({
      message: err.message,
      name: err.name,
      stack: err.stack,
    })
    response.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  const session = event.data.object
  const client_reference_id = session.client_reference_id

  let docRef
  if (client_reference_id) {
    // Check if client_reference_id exists
    docRef = db.collection('organizations').doc(client_reference_id)
  }
  else if (session.customer) {
    // If client_reference_id doesn't exist, check if session.customer exists
    const orgsSnapshot = await db.collection('organizations').where('stripeCustomerId', '==', session.customer).get()
    if (!orgsSnapshot.empty) {
      docRef = orgsSnapshot.docs[0].ref
    }
  }

  if (docRef) {
    const doc = await docRef.get()
    if (doc.exists) {
      // Record any event related to the client_reference_id
      const date = new Date()
      const formattedDate = `${date.getFullYear()}${(`0${date.getMonth() + 1}`).slice(-2)}${(`0${date.getDate()}`).slice(-2)}${(`0${date.getHours()}`).slice(-2)}${(`0${date.getMinutes()}`).slice(-2)}${(`0${date.getSeconds()}`).slice(-2)}${(`00${date.getMilliseconds()}`).slice(-3)}`
      const docId = `${event.type}-${formattedDate}`
      await docRef.collection('stripe').doc(docId).set({ session, event })

      // Handle subscription events

      if (session.customer) {
        await docRef.update({ stripeCustomerId: session.customer })
      }
      if (session?.lines?.data[0]?.plan?.product) {
        await docRef.update({ stripeProductId: session.lines.data[0].plan.product })
      }
      if (session?.lines?.data[0]?.price?.id) {
        await docRef.update({ stripePriceId: session.lines.data[0].price.id })
      }

      if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
        await docRef.update({ stripeSubscription: session.status })
      }
      response.json({ received: true })
      return
    }
  }

  // If no matching organization, store to a root collection called 'stripe'
  await db.collection('stripe').add(session)
  response.json({ received: true })
})
