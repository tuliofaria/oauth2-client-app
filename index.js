const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();

const clientId = process.env.SM_OAUTH2_CLIENT_ID;
const clientSecret = process.env.SM_OAUTH2_CLIENT_SECRET;
const redirectUri = process.env.SM_OAUTH2_REDIRECT_URI;
const scope = process.env.SM_OAUTH2_SCOPE;
const port = process.env.PORT || 5555;
const oauthTokenUrl = process.env.SM_OAUTH2_TOKEN_URL;
const protectedResourceUrl = process.env.SM_OAUTH2_PROTECTED_RESOURCE_URL;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(cookieParser())

app.get("/", (_req, res) => {
  res.render("index");
});

app.get("/connect-with-sm", (_req, res) => {
  const authUrl = new URL(process.env.SM_OAUTH2_AUTH_URL);
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", scope);
  authUrl.searchParams.append(
    "state",
    Buffer.from(
      JSON.stringify({
        someString: "this-is-the-state",
      })
    ).toString("base64")
  );

  res.redirect(authUrl.toString());
});

app.get("/connect-with-sm-prompt", (req, res) => {
  const authUrl = new URL(process.env.SM_OAUTH2_AUTH_URL);
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", scope);
  authUrl.searchParams.append("prompt", "none");
  authUrl.searchParams.append(
    "state",
    Buffer.from(
      JSON.stringify({
        someString: "this-is-the-state",
      })
    ).toString("base64")
  );

  res.redirect(authUrl.toString());
});

app.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;
  if (error) {
    return res
      .render('error', {
        error: error,
        error_description: error_description,
        state: Buffer.from(state, 'base64').toString('utf-8'),
      })
  }
  if (!code) {
    return res.status(400).send("No code provided");
  }

  // Exchange the authorization code for an access token
  const tokenResponse = await fetch(`${oauthTokenUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenResponse.status !== 200) {
    throw new Error(tokenData.error_description || "Error obtaining token");
  }

  // setting access_token and refresh_token as cookies
  // so we can use for more requests
  res.cookie("access_token", tokenData.access_token, {
    httpOnly: true,
    maxAge: 60 * 60 * 1000, // 1 hour
  });
  res.cookie("refresh_token", tokenData.refresh_token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
  });

  return res.render('success', {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    scope: tokenData.scope,
    state: Buffer.from(state, 'base64').toString('utf-8'),
  })

});

app.get('/protected-request', async (req, res) => {
  const accessToken = req.cookies.access_token;
  if (!accessToken) {
    return res.status(401).send('Unauthorized');
  }

  const response = await fetch(protectedResourceUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status !== 200) {
    return res.status(response.status).send('Error fetching protected resource');
  }

  const data = await response.json();
  return res.status(200).json(data);
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
