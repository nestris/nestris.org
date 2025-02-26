#!/bin/bash

# Define source and destination directory pairs
DIRS=(
  "shared/ client/src/app/shared"
  "shared/ server/shared"
  "shared/ ocr-library/shared"
  "client/src/app/ocr ocr-library/ocr"
)

# Loop through each pair
for DIR_PAIR in "${DIRS[@]}"; do
  SRC_DIR=$(echo $DIR_PAIR | awk '{print $1}')
  DEST_DIR=$(echo $DIR_PAIR | awk '{print $2}')
  
  # Ensure the destination directory is writable and remove if it exists
  chmod -R u+w "$DEST_DIR" 2>/dev/null
  rm -rf "$DEST_DIR"
  
  # Copy source directory to destination and check for success
  cp -rf "$SRC_DIR" "$DEST_DIR"
  if [ $? -eq 0 ]; then
    echo "Successfully copied $SRC_DIR to $DEST_DIR"
  else
    echo "Failed to copy $SRC_DIR to $DEST_DIR"
    exit 1
  fi
done

echo "Directory copied to both destinations successfully!"
