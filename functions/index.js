require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev' })

exports.stripe = require('./stripe')
// exports.cms = require('./cms')

const formBuilder = require('./form-builder')
exports.formBuilderCreateForm = formBuilder.formBuilderCreateForm
exports.formBuilderUpdateForm = formBuilder.formBuilderUpdateForm
exports.formBuilderCreateFormVersion = formBuilder.formBuilderCreateFormVersion
exports.formBuilderSubmitForm = formBuilder.formBuilderSubmitForm
exports.formBuilderSubmitFormAuth = formBuilder.formBuilderSubmitFormAuth
exports.formBuilderProcessIntegrationJob = formBuilder.formBuilderProcessIntegrationJob

// START @edge/firebase functions
exports.edgeFirebase = require('./edgeFirebase')
// END @edge/firebase functions
