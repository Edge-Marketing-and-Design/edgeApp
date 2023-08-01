pnpm run generate
firebase functions:config:set openai.api_key="SOME_API_KEY"
firebase functions:config:get
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore