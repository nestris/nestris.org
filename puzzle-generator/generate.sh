#!/bin/bash

# Number of processes to run
NUM_INSTANCES=15

# Number of times each process will run the command
NUM_RUNS=30

# Check if a database parameter is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <database>"
    exit 1
fi

# Store the database parameter
DB=$1

# Function to handle SIGINT (Ctrl+C)
cleanup() {
  echo "Caught interrupt signal. Cleaning up..."
  kill -- -$$  # Kills all child processes of this script
  exit 1
}

# Trap SIGINT and call cleanup
trap cleanup SIGINT

# Echo how many instances will run
echo "Running $NUM_INSTANCES instances, each will run $NUM_RUNS times..."
echo "Using database: $DB"

# Record the start time
start_time=$(date +%s)

# Function to run the command multiple times with a random delay
run_instance() {
  for ((run=1; run<=NUM_RUNS; run++)); do
    npm start -- --mode=generate --db=$DB
    # Wait for a random amount of time (between 3 and 5 seconds)
    sleep $((RANDOM % 3 + 3))
  done
}

# Start the specified number of instances in parallel
for ((i=1; i<=NUM_INSTANCES; i++)); do
  run_instance &
done

# Wait for all background jobs to finish
wait

# Record the end time
end_time=$(date +%s)

# Calculate the time difference
time_spent=$((end_time - start_time))

echo "All $NUM_INSTANCES instances completed."
echo "Time spent: $time_spent seconds"