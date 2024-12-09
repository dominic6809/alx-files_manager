/* eslint-disable no-unused-vars */
import fs from 'fs';
import readline from 'readline';
import { promisify } from 'util';
import mimeMessage from 'mime-message';
import { gmail_v1 as gmailV1, google } from 'googleapis';

// Define the required OAuth2 scopes for sending emails
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
// Path to store the user's OAuth2 token
const TOKEN_PATH = 'token.json';
// Promisified versions of fs.readFile and fs.writeFile for async file handling
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

/**
 * Get a new OAuth2 token after prompting the user for authorization.
 * This function is invoked when there is no stored token.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get the token for.
 * @param {function} callback The callback to call with the authorized OAuth2 client.
 */
async function getNewToken(oAuth2Client, callback) {
  // Generate an authentication URL to get the user to authorize access
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  
  // Create an interface to read user input from the command line
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  // Ask the user to enter the code from the authorization URL
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    // Get the token using the code
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('Error retrieving access token', err);
        return;
      }
      // Store the token for future use and invoke the callback with the authorized client
      oAuth2Client.setCredentials(token);
      writeFileAsync(TOKEN_PATH, JSON.stringify(token))
        .then(() => {
          console.log('Token stored to', TOKEN_PATH);
          callback(oAuth2Client);
        })
        .catch((writeErr) => console.error(writeErr));
    });
  });
}

/**
 * Create an OAuth2 client and execute the callback with the authorized client.
 * It first checks for a previously stored token.
 * @param {Object} credentials The OAuth2 credentials (client ID and secret).
 * @param {function} callback The callback to call with the authorized OAuth2 client.
 */
async function authorize(credentials, callback) {
  const clientSecret = credentials.web.client_secret;
  const clientId = credentials.web.client_id;
  const redirectURIs = credentials.web.redirect_uris;
  
  // Create OAuth2 client with the credentials
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectURIs[0],
  );
  console.log('Client authorization beginning');
  
  // Try to read the stored token and authorize the client
  await readFileAsync(TOKEN_PATH)
    .then((token) => {
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    }).catch(async () => getNewToken(oAuth2Client, callback));  // If no token, get a new one
  console.log('Client authorization done');
}

/**
 * Sends an email using the Gmail API.
 * @param {google.auth.OAuth2} auth The authorized OAuth2 client.
 * @param {gmailV1.Schema$Message} mail The message to send.
 */
function sendMailService(auth, mail) {
  const gmail = google.gmail({ version: 'v1', auth });

  // Send the email using the Gmail API
  gmail.users.messages.send({
    userId: 'me',
    requestBody: mail,
  }, (err, _res) => {
    if (err) {
      console.log(`The API returned an error: ${err.message || err.toString()}`);
      return;
    }
    console.log('Message sent successfully');
  });
}

/**
 * Mailer class encapsulating all email-related functions.
 */
export default class Mailer {
  /**
   * Checks if the user is authorized by attempting to load and authorize using stored credentials.
   */
  static checkAuth() {
    readFileAsync('credentials.json')
      .then(async (content) => {
        await authorize(JSON.parse(content), (auth) => {
          if (auth) {
            console.log('Auth check was successful');
          }
        });
      })
      .catch((err) => {
        console.log('Error loading client secret file:', err);
      });
  }

  /**
   * Builds an email message in MIME format, ready for sending.
   * @param {string} dest The recipient's email address.
   * @param {string} subject The subject of the email.
   * @param {string} message The body of the email.
   * @returns {object} The email message in MIME format.
   */
  static buildMessage(dest, subject, message) {
    const senderEmail = process.env.GMAIL_SENDER;  // Get sender's email from environment variables
    const msgData = {
      type: 'text/html',
      encoding: 'UTF-8',
      from: senderEmail,
      to: [dest],
      cc: [],
      bcc: [],
      replyTo: [],
      date: new Date(),
      subject,
      body: message,
    };

    if (!senderEmail) {
      throw new Error(`Invalid sender: ${senderEmail}`);
    }

    // Validate and create the MIME message
    if (mimeMessage.validMimeMessage(msgData)) {
      const mimeMsg = mimeMessage.createMimeMessage(msgData);
      return { raw: mimeMsg.toBase64SafeString() };
    }
    throw new Error('Invalid MIME message');
  }

  /**
   * Sends an email by first authorizing the client and then using the Gmail API to send the email.
   * @param {object} mail The email message in MIME format.
   */
  static sendMail(mail) {
    readFileAsync('credentials.json')
      .then(async (content) => {
        await authorize(
          JSON.parse(content),
          (auth) => sendMailService(auth, mail),
        );
      })
      .catch((err) => {
        console.log('Error loading client secret file:', err);
      });
  }
}
