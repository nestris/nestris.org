#!/bin/bash

# Define source and destination directories
SRC_DIR="shared/"
DEST_DIR1="client/src/app/shared"
DEST_DIR2="server/shared"

# Ensure the destination directories are writable
chmod -R u+w "$DEST_DIR1" 2>/dev/null
chmod -R u+w "$DEST_DIR2" 2>/dev/null

# Delete the destination directories if they exist
rm -rf "$DEST_DIR1"
rm -rf "$DEST_DIR2"

# Copy source directory to first destination
cp -rf "$SRC_DIR" "$DEST_DIR1"

# Check if the first copy was successful
if [ $? -eq 0 ]; then
  echo "Successfully copied to $DEST_DIR1"
else
  echo "Failed to copy to $DEST_DIR1"
  exit 1
fi

# Copy source directory to second destination
cp -rf "$SRC_DIR" "$DEST_DIR2"

# Check if the second copy was successful
if [ $? -eq 0 ]; then
  echo "Successfully copied to $DEST_DIR2"
else
  echo "Failed to copy to $DEST_DIR2"
  exit 1
fi

# # Make the destination directories read-only
# chmod -R a-w "$DEST_DIR1"
# if [ $? -eq 0 ]; then
#   echo "Successfully made $DEST_DIR1 read-only"
# else
#   echo "Failed to make $DEST_DIR1 read-only"
#   exit 1
# fi

# chmod -R a-w "$DEST_DIR2"
# if [ $? -eq 0 ]; then
#   echo "Successfully made $DEST_DIR2 read-only"
# else
#   echo "Failed to make $DEST_DIR2 read-only"
#   exit 1
# fi

echo "Directory copied to both destinations successfully!"
