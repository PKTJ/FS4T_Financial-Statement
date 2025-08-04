const express = require('express');
const { google } = require('googleapis');
const open = require('open');
const db = require('../db/db');

// Test network connectivity on startup
async function testNetworkConnectivity() {
  try {
    console.log('Testing network connectivity to Google APIs...');
    const https = require('https');
    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        console.log('✓ Network connectivity to Google APIs: OK');
        resolve(true);
      });
      
      req.on('timeout', () => {
        console.log('✗ Network connectivity test: TIMEOUT');
        reject(new Error('Network timeout'));
      });
      
      req.on('error', (err) => {
        console.log('✗ Network connectivity test failed:', err.message);
        reject(err);
      });
      
      req.end();
    });
  } catch (error) {
    console.log('Network connectivity test error:', error.message);
  }
}

// Run connectivity test
testNetworkConnectivity().catch(console.error);

console.log('Initializing OAuth2 client with:');
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Configure timeout for OAuth requests
oauth2Client.on('tokens', (tokens) => {
  console.log('New tokens received');
});

// Set global request timeout
const { GoogleAuth } = require('google-auth-library');
GoogleAuth.prototype._originalRequest = GoogleAuth.prototype.request;
GoogleAuth.prototype.request = function(opts) {
  opts.timeout = opts.timeout || 30000; // 30 second timeout
  return this._originalRequest(opts);
};

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function startOAuthServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.get('/auth', (req, res) => {
    const { discord_user_id } = req.query;
    console.log('Generating auth URL for Discord user:', discord_user_id);
    console.log('OAuth2 Client Config:', {
      clientId: process.env.GOOGLE_CLIENT_ID,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    });
    
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: discord_user_id,
    });
    
    console.log('Generated auth URL:', url);
    res.redirect(url);
  });

  app.get('/api/auth/callback/google', async (req, res) => {
    try {
      const { code, state, error } = req.query;
      
      if (error) {
        console.error('OAuth error:', error);
        return res.status(400).send(`OAuth error: ${error}`);
      }
      
      if (!code) {
        console.error('No authorization code received');
        return res.status(400).send('No authorization code received');
      }
      
      console.log('Received authorization code, exchanging for tokens...');
      console.log('Using OAuth2 client with config:', {
        clientId: process.env.GOOGLE_CLIENT_ID,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
      });
      
      // Retry logic for token exchange
      let tokens;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Token exchange attempt ${attempts}/${maxAttempts}`);
          
          const result = await oauth2Client.getToken(code);
          tokens = result.tokens;
          console.log('Tokens received successfully');
          break;
          
        } catch (tokenError) {
          console.error(`Token exchange attempt ${attempts} failed:`, {
            message: tokenError.message,
            code: tokenError.code,
            status: tokenError.status,
            errno: tokenError.errno,
            type: tokenError.type
          });
          
          if (attempts === maxAttempts) {
            throw tokenError;
          }
          
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, attempts) * 1000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      console.log('Tokens received, saving to database...');
      await db.saveUserToken(state, tokens);
      
      console.log('Tokens saved successfully');
      res.send('Autentikasi berhasil! Kamu bisa kembali ke Discord.');
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.status(500).send(`Authentication failed: ${err.message}`);
    }
  });

  app.listen(port, () => {
    console.log(`OAuth server berjalan di http://localhost:${port}`);
  });
}

module.exports = { startOAuthServer, oauth2Client };
