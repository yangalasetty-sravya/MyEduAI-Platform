// Use 'import' instead of 'require' because "type": "module" is in your package.json
import { config } from 'dotenv';
import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';
import path from 'path';

// This line loads your .env file
config();

console.log('--- Firestore Connection Test (ESM Mode) ---');

// 1. Get the current directory path
const CWD = process.cwd();
console.log(`Current Working Directory: ${CWD}`);

// 2. Read the path from the loaded .env file
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
console.log(`Path from .env: ${credentialsPath}`);

// Check if the credentialsPath variable was loaded
if (!credentialsPath) {
  console.error('\nERROR: GOOGLE_APPLICATION_CREDENTIALS is not defined in your .env file or it was not loaded.');
} else {
  // 3. Create the absolute path to the credentials file
  const absolutePath = path.resolve(CWD, credentialsPath);
  console.log(`Resolved Absolute Path: ${absolutePath}`);

  // 4. Check if the file actually exists at that path
  if (fs.existsSync(absolutePath)) {
    console.log('\nSUCCESS: Credentials file found at the specified path.');
  } else {
    console.error('\nERROR: Credentials file NOT FOUND at the path above. Check your path in the .env file.');
  }
}

// 5. Now, let's try to connect to Firestore
async function testConnection() {
  try {
    console.log('\nAttempting to initialize Firestore...');
    
    // The Firestore library will automatically use the environment variable
    const db = new Firestore();
    
    console.log('Firestore initialized. Attempting to read data...');
    
    // Try to list the collections. This is a simple read operation.
    const collections = await db.listCollections();
    
    console.log('\n✅ ✅ ✅ SUCCESS! Successfully connected to Firestore and listed collections.');
    console.log('Your collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.id}`);
    });

  } catch (error) {
    console.error('\n❌ ❌ ❌ FAILED! An error occurred during the Firestore connection test.');
    console.error('THE ERROR IS:', error.message); // Log just the message for clarity
    // For full details, you can log the whole object: console.error(error);
  }
}

testConnection();