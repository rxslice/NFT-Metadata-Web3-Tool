#!/bin/bash

# Print message to the user
echo "Setting up NFT Metadata Xpress..."

# Step 1: Clone the repository
echo "Cloning the repository..."
git clone <https://github.com/rxslice/NFT-Metadata-Web3-Tool.git> NFT-Metadata-Web3-Tool
cd NFT-Metadata-Web3-Tool || exit

# Step 2: Install dependencies
echo "Installing dependencies..."
npm install

# Step 3: Start the development server
echo "Starting the development server..."
npm run dev

# Notify the user
echo "Setup complete! Open your browser and navigate to http://localhost:3000"
