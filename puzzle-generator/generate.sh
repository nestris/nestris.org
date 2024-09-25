#!/bin/bash

# Check if the user provided the number of instances as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <num_instances>"
  exit 1
fi

# Set the number of instances based on the input argument
NUM_INSTANCES=$1

# Echo how many instances will run
echo "Running $NUM_INSTANCES instances..."

# Record the start time
start_time=$(date +%s)

# Start the specified number of instances
for ((i=1; i<=NUM_INSTANCES; i++)); do
  npm start -- --mode=generate --db=prod &
done

# Wait for all background jobs to finish
wait

# Record the end time
end_time=$(date +%s)

# Calculate the time difference
time_spent=$((end_time - start_time))

echo "All $NUM_INSTANCES instances completed."
echo "Time spent: $time_spent seconds"
