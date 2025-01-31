#!/bin/bash

# Cleanup old firebase-export* folders
echo "Cleaning up old firebase-export* folders..."
rm -rf ./firebase-export*

# Kill any processes using the emulator ports
ports=(9099 4000 5001 8080 5025 9199 8085)
for port in "${ports[@]}"; do
  pid=$(lsof -ti :$port)
  if [ ! -z "$pid" ]; then
    process_name=$(ps -p $pid -o comm=)
    echo $process_name
    echo "Stopping Firebase emulator on port $port with PID $pid"
    kill -9 $pid
  fi
done

# Ensure firebase_data directory exists
DIR="./firebase_data"
if [ ! -d "$DIR" ]; then
 cp -r ./firebase_data_emulator_seed ./firebase_data
fi

# Start Firebase emulators
export NODE_ENV=development
firebase emulators:start --import ./firebase_data --export-on-exit
