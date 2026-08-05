// server.js
const express = require('express');
const session = require('express-session');
const msal = require('@azure/msal-node');
const axios = require('axios');
const path = require('path');

const {
  msalConfig,
  scopes,
  REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI,
  GRAPH_ME_ENDPOINT,
} = require('./authConfig');
const { recommend, allTitles } = require('./seriesData');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Basic sanity check on required env vars ---
['CLIENT_ID', 'TENANT_ID', 'CLIENT_SECRET'].forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️  Missing environment variable: ${key}. See .env.example`);
  }
});

// --- MSAL confidential client (server-side app) ---
const msalClient = new msal.ConfidentialClientApplication(msalConfig);

// --- Session middleware (stores tokens per browser session) ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Home page ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// --- Step 1: kick off sign-in, redirect to Microsoft's login page ---
app.get('/signin', async (req, res) => {
  const authCodeUrlParameters = {
    scopes,
    redirectUri: REDIRECT_URI,
  };

  try {
    const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
    res.redirect(authUrl);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error starting sign-in flow.');
  }
});

// --- Step 2: Microsoft redirects back here with an auth code ---
app.get('/redirect', async (req, res) => {
  const tokenRequest = {
    code: req.query.code,
    scopes,
    redirectUri: REDIRECT_URI,
  };

  try {
    const response = await msalClient.acquireTokenByCode(tokenRequest);
    req.session.account = response.account;
    req.session.accessToken = response.accessToken;
    req.session.claims = response.idTokenClaims;
    console.log('ID token claims:', response.idTokenClaims);
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error completing sign-in.');
  }
});

// --- Step 3: use the access token to call Microsoft Graph ---
app.get('/profile', async (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/signin');
  }

  try {
    const graphResponse = await axios.get(GRAPH_ME_ENDPOINT, {
      headers: { Authorization: `Bearer ${req.session.accessToken}` },
    });

    const user = graphResponse.data;
    res.send(`
      <html>
        <head>
          <title>Profile</title>
          <link rel="stylesheet" href="/style.css" />
        </head>
        <body>
          <div class="card">
            <h1>Signed in ✅</h1>
            <p><strong>Name:</strong> ${user.displayName || 'N/A'}</p>
            <p><strong>Email:</strong> ${user.mail || user.userPrincipalName || 'N/A'}</p>
            <p><strong>Job title:</strong> ${user.jobTitle || 'N/A'}</p>
            <p><strong>Office:</strong> ${user.officeLocation || 'N/A'}</p>
            <hr/>
            <p>This data came live from <code>GET /me</code> on Microsoft Graph,
            using the access token issued after you signed in through Microsoft Entra ID.</p>
            <p><a class="btn" href="/quiz">🎬 What should I watch next?</a></p>
            <a href="/signout">Sign out</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error.response ? error.response.data : error);
    res.status(500).send('Error calling Microsoft Graph.');
  }
});

// --- Quiz page: ask for favorite series ---
app.get('/quiz', (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/signin');
  }

  const options = allTitles()
    .map((t) => `<option value="${t}">${t}</option>`)
    .join('');

  res.send(`
    <html>
      <head>
        <title>Quiz</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <div class="card">
          <h1>What's your favorite series?</h1>
          <form method="POST" action="/recommend">
            <select name="title" required>
              <option value="" disabled selected>Pick one...</option>
              ${options}
            </select>
            <button class="btn" type="submit">Get a recommendation</button>
          </form>
          <p><a href="/profile">Back to profile</a></p>
        </div>
      </body>
    </html>
  `);
});

// --- Process the quiz answer ---
app.post('/recommend', (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/signin');
  }

  const { title } = req.body;
  const result = recommend(title);

  if (!result) {
    return res.status(400).send('Unknown title. <a href="/quiz">Try again</a>');
  }

  res.send(`
    <html>
      <head>
        <title>Your recommendation</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <div class="card">
          <h1>Since you like ${title}...</h1>
          <h2>🍿 Try: ${result.match}</h2>
          <p>Shared vibe: <strong>${result.sharedGenres.join(', ') || 'general tone match'}</strong></p>
          <p><a class="btn" href="/quiz">Try another title</a></p>
          <p><a href="/profile">Back to profile</a></p>
        </div>
      </body>
    </html>
  `);
});

// --- Sign out: clear local session, then sign out of Entra too ---
app.get('/signout', (req, res) => {
  req.session.destroy(() => {
    const logoutUri = `${msalConfig.auth.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
      POST_LOGOUT_REDIRECT_URI
    )}`;
    res.redirect(logoutUri);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
