#!/bin/bash

ports=(9099 4000 5001 8080 5025 9199)
for port in "${ports[@]}"; do
  pid=$(lsof -ti :$port)
  if [ ! -z "$pid" ]; then
    process_name=$(ps -p $pid -o comm=)
    echo $process_name
    echo "Stopping Firebase emulator on port $port with PID $pid"
    kill -9 $pid
  fi
done
DIR="./firebase_data"
if [ ! -d "$DIR" ]; then
 cp -r ./firebase_data_emulator_seed ./firebase_data
fi
firebase emulators:start --import ./firebase_data --export-on-exit