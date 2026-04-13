// One-time script to get Google OAuth refresh tokens for Siep
// Run with: npx tsx oauth-setup.ts

import { google } from 'googleapis';
import * as readline from 'readline';

const CLIENT_ID = '286318350317-tb58dc4udm4om7fi2vjoqa063kpk1rua.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

const oauth2 = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:3000/oauth/callback'
);

const url = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ],
});

console.log('\n🔑 Open this URL in your browser:\n');
console.log(url);
console.log('\nAfter granting access, you\'ll be redirected to a localhost URL.');
console.log('Copy the "code" parameter from the URL and paste it below.\n');
console.log('The URL will look like: http://localhost:3000/oauth/callback?code=XXXXX&scope=...');
console.log('Copy everything between "code=" and "&scope"\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2.getToken(decodeURIComponent(code));
    console.log('\n✅ Success! Here\'s your refresh token:\n');
    console.log(tokens.refresh_token);
    console.log('\n👆 Copy this and set it as GOOGLE_PERSONAL_REFRESH_TOKEN in your .env file\n');
  } catch (error) {
    console.error('\n❌ Error getting token:', error);
  }
  rl.close();
});
