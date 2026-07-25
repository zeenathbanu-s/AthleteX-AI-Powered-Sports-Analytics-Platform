// Firebase Environment Validation Script
// Run with: node scripts/validate-firebase.js

const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Configuration Validator\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('   Create it in the root directory with your Firebase config.');
  process.exit(1);
}

// Read environment file
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

const requiredVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const foundVars = {};
let hasPlaceholders = false;

// Parse environment variables
lines.forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      foundVars[key.trim()] = value.trim();
    }
  }
});

console.log('Checking required Firebase environment variables:\n');

// Check each required variable
requiredVars.forEach(varName => {
  const value = foundVars[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: Missing`);
  } else if (value.includes('demo') || value.includes('your-') || value.includes('replace')) {
    console.log(`⚠️  ${varName}: Contains placeholder value`);
    hasPlaceholders = true;
  } else if (value.length < 10) {
    console.log(`⚠️  ${varName}: Value seems too short`);
    hasPlaceholders = true;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasPlaceholders) {
  console.log('❌ Configuration incomplete!');
  console.log('\nNext steps:');
  console.log('1. Go to https://console.firebase.google.com');
  console.log('2. Select your athletex-bf7b9 project');
  console.log('3. Add a Web app and copy the config values');
  console.log('4. Update your .env.local file with real values');
  console.log('5. Run this script again to verify');
} else {
  console.log('✅ Firebase configuration looks good!');
  console.log('\nYou can now:');
  console.log('1. Restart your dev server: npm start');
  console.log('2. Test authentication in your browser');
  console.log('3. Enable auth methods in Firebase Console');
}

console.log('\nFor detailed setup instructions, see: FIREBASE_SETUP_GUIDE.md');
