#!/bin/bash

# Fix Dependencies Script
# This script updates the package-lock.json to match package.json

echo "Updating package-lock.json..."

# Remove old lock file
rm -f package-lock.json

# Install dependencies to create new lock file
npm install

echo "Dependencies updated successfully!"
echo "You can now deploy to Railway."
