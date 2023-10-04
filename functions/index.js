// TODO: INSTALL CODE CLONES edgeFirebase and vuetify-framework puts them dirs and change plugins to go them... remove from package.json we will update manually when we need to
// TODO: DELETE THE .git folder when done and git init again

// Stripe Functions
// const { redirectToStripeBilling, stripeWebhook } = require('./stripe')
// exports.redirectToStripeBilling = redirectToStripeBilling
// exports.stripeWebhook = stripeWebhook

// TODO:  PUT THESE IN A GROUP... BUT THEN NEED TO CHANGE edgeFirebase.js to use the group name
// Edge Functions
const {
  sendVerificationCode,
  verifyPhoneNumber,
  initFirestore,
  currentUserRegister,
  removeNonRegisteredUser,
  createUser,
  updateUser,
  deleteUser,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  createCollection,
  updateCollection,
  deleteCollection,
  createDocument,
  updateDocument,
  deleteDocument,
  createField,
  updateField,
  deleteField,
  createStagedUser,
  updateStagedUser,
  deleteStagedUser,
} = require('./edgeFirebase')

exports.sendVerificationCode = sendVerificationCode
exports.verifyPhoneNumber = verifyPhoneNumber
exports.initFirestore = initFirestore
exports.currentUserRegister = currentUserRegister
exports.removeNonRegisteredUser = removeNonRegisteredUser
exports.createUser = createUser
exports.updateUser = updateUser
exports.deleteUser = deleteUser
exports.createOrganization = createOrganization
exports.updateOrganization = updateOrganization
exports.deleteOrganization = deleteOrganization
exports.createCollection = createCollection
exports.updateCollection = updateCollection
exports.deleteCollection = deleteCollection
exports.createDocument = createDocument
exports.updateDocument = updateDocument
exports.deleteDocument = deleteDocument
exports.createField = createField
exports.updateField = updateField
exports.deleteField = deleteField
exports.createStagedUser = createStagedUser
exports.updateStagedUser = updateStagedUser
exports.deleteStagedUser = deleteStagedUser

// Example of grouped functions
// Export both functions from metrics.js in the "metrics" group:
//  - metrics-usageStats
//  - metrics-nightlyReport
// exports.metrics = require('./metrics');
// When deployed, functions will be prefixed with the name of their group, so in this example the functions would be named metrics-usageStats and metrics-nightlyReport.
