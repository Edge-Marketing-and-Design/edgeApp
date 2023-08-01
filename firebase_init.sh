# Prompt for the project ID
echo "Please enter your Firebase project ID:"
read project_id

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