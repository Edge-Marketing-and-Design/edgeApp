pnpm run generate
export NODE_ENV=production
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore