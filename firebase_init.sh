# Prompt for the Firebase configuration values
echo "Please enter your Firebase project ID:"
read project_id
echo "Please enter your Firebase API key:"
read api_key
echo "Please enter your Firebase Auth domain:"
read auth_domain
echo "Please enter your Firebase storage bucket:"
read storage_bucket
echo "Please enter your Firebase messaging sender ID:"
read messaging_sender_id
echo "Please enter your Firebase app ID:"
read app_id
echo "Please enter your Firebase measurement ID:"
read measurement_id

# Check if project_id is empty
if [ -z "$project_id" ]; then
  echo "Error: Firebase project ID cannot be empty."
  exit 1
fi

# Check if firebase is installed
if ! command -v firebase &> /dev/null; then
  echo "Firebase CLI could not be found. Please install it and try again."
  exit 1
fi

# Check if firebase.json exists and make a backup
if [ -f ./firebase.json ]; then
  cp ./firebase.json ./firebase.json.temp
fi

# Check if firestore.rules exists and make a backup
if [ -f ./firestore.rules ]; then
  cp ./firestore.rules ./firestore.rules.temp
fi

# Initialize Firebase
firebase use --add $project_id --alias default
firebase init firestore functions hosting storage emulators --project default

# Restore firebase.json from backup
if [ -f ./firebase.json.temp ]; then
  mv ./firebase.json.temp ./firebase.json
fi

# Restore firestore.rules from backup
if [ -f ./firestore.rules.temp ]; then
  mv ./firestore.rules.temp ./firestore.rules
fi

# Create the .env file
echo "VITE_FIREBASE_API_KEY=$api_key" > .env
echo "VITE_FIREBASE_AUTH_DOMAIN=$auth_domain" >> .env
echo "VITE_FIREBASE_PROJECT_ID=$project_id" >> .env
echo "VITE_FIREBASE_STORAGE_BUCKET=$storage_bucket" >> .env
echo "VITE_FIREBASE_MESSAGING_SENDER_ID=$messaging_sender_id" >> .env
echo "VITE_FIREBASE_APP_ID=$app_id" >> .env
echo "VITE_FIREBASE_MEASUREMENT_ID=$measurement_id" >> .env
echo "VITE_FIREBASE_EMULATOR_AUTH=" >> .env
echo "VITE_FIREBASE_EMULATOR_FIRESTORE=" >> .env
echo "VITE_FIREBASE_EMULATOR_FUNCTIONS=" >> .env
echo "VITE_FIREBASE_EMULATOR_STORAGE=" >> .env
echo "REGISTRATION_CODE=organization-registration-template" >> .env
echo "DEVELOPMENT_MODE=false" >> .env

# Create the .env.dev file
echo "VITE_FIREBASE_API_KEY=$api_key" > .env.dev
echo "VITE_FIREBASE_AUTH_DOMAIN=$auth_domain" >> .env.dev
echo "VITE_FIREBASE_PROJECT_ID=$project_id" >> .env.dev
echo "VITE_FIREBASE_STORAGE_BUCKET=$storage_bucket" >> .env.dev
echo "VITE_FIREBASE_MESSAGING_SENDER_ID=$messaging_sender_id" >> .env.dev
echo "VITE_FIREBASE_APP_ID=$app_id" >> .env.dev
echo "VITE_FIREBASE_MEASUREMENT_ID=$measurement_id" >> .env.dev
echo "VITE_FIREBASE_EMULATOR_AUTH=9099" >> .env.dev
echo "VITE_FIREBASE_EMULATOR_FIRESTORE=8080" >> .env.dev
echo "VITE_FIREBASE_EMULATOR_FUNCTIONS=5001" >> .env.dev
echo "VITE_FIREBASE_EMULATOR_STORAGE=9199" >> .env.dev
echo "REGISTRATION_CODE=organization-registration-template" >> .env.dev
echo "DEVELOPMENT_MODE=true" >> .env.dev
