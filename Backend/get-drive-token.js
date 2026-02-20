/**
 * One-time script to get a Google Drive OAuth2 refresh token.
 *
 * Steps:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create an OAuth 2.0 Client ID (type: Web application)
 * 3. Add "http://localhost:5000/callback" as an Authorized redirect URI
 * 4. Copy the Client ID and Client Secret into your .env
 * 5. Run: node get-drive-token.js
 * 6. Open the URL it prints, authorize, paste the code back
 * 7. Copy the refresh_token into your .env as GOOGLE_DRIVE_REFRESH_TOKEN
 */

import "dotenv/config";
import { google } from "googleapis";
import readline from "readline";

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET in .env first");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost:5000/callback"
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("\n1. Open this URL in your browser:\n");
console.log(authUrl);
console.log("\n2. Authorize with your Google account");
console.log("3. You'll be redirected to localhost:5000/callback?code=XXXX");
console.log("   (The page will fail to load — that's fine)");
console.log("4. Copy the 'code' parameter from the URL and paste it below:\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Paste the authorization code: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n--- Your tokens ---\n");
    console.log("GOOGLE_DRIVE_REFRESH_TOKEN=" + tokens.refresh_token);
    console.log("\nAdd this to your .env file. You only need to do this once.\n");
  } catch (err) {
    console.error("Failed to get token:", err.message);
  }
});
