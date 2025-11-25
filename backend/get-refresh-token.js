/**
 * Google Ads API - Refresh Token Generator
 *
 * This script helps you generate a refresh token for the Google Ads API.
 * You only need to run this once to get your refresh token.
 *
 * Instructions:
 * 1. Install googleapis: npm install googleapis
 * 2. Replace CLIENT_ID and CLIENT_SECRET below with your values
 * 3. Run: node get-refresh-token.js
 * 4. Follow the prompts
 * 5. Save the refresh token to your .env file
 */

const readline = require('readline');
const { google } = require('googleapis');

// ⚠️ REPLACE THESE WITH YOUR VALUES FROM GOOGLE CLOUD CONSOLE
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE';

// OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob' // This is for desktop/CLI apps
);

// Request offline access to Google Ads
const scopes = ['https://www.googleapis.com/auth/adwords'];

// Generate the authentication URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // This is important - it gives us a refresh token
  scope: scopes,
  prompt: 'consent', // Forces consent screen to show again
});

console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
console.log('║         Google Ads API - Refresh Token Generator                      ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

console.log('📋 STEP 1: Visit this URL in your browser:\n');
console.log(authUrl);
console.log('\n📋 STEP 2: Sign in with the Google account that has access to Google Ads');
console.log('📋 STEP 3: Click "Allow" to grant permissions');
console.log('📋 STEP 4: Copy the authorization code that appears\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('🔑 Paste the authorization code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║                            ✅ SUCCESS!                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

    console.log('Your refresh token is:\n');
    console.log('\x1b[32m%s\x1b[0m', tokens.refresh_token);

    console.log('\n⚠️  IMPORTANT: Save this token to your backend/.env file:\n');
    console.log('\x1b[33m%s\x1b[0m', 'GOOGLE_ADS_REFRESH_TOKEN=' + tokens.refresh_token);

    console.log('\n📝 Full .env configuration:\n');
    console.log('GOOGLE_ADS_CLIENT_ID=' + CLIENT_ID);
    console.log('GOOGLE_ADS_CLIENT_SECRET=' + CLIENT_SECRET);
    console.log('GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_DEVELOPER_TOKEN_FROM_GOOGLE_ADS');
    console.log('GOOGLE_ADS_CUSTOMER_ID=YOUR_CUSTOMER_ID_WITHOUT_DASHES');
    console.log('GOOGLE_ADS_REFRESH_TOKEN=' + tokens.refresh_token);

    console.log('\n✅ You won\'t need to run this script again!\n');
  } catch (error) {
    console.error('\n❌ Error getting tokens:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Make sure you copied the full authorization code');
    console.error('- Ensure your CLIENT_ID and CLIENT_SECRET are correct');
    console.error('- Try generating a new authorization code and run this script again\n');
  }
  rl.close();
});
