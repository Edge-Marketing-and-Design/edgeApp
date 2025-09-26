require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev' })

exports.stripe = require('./stripe')
// exports.cms = require('./cms')

// START @edge/firebase functions
exports.edgeFirebase = require('./edgeFirebase')
// END @edge/firebase functions
