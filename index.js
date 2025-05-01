const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express()


const clientId = process.env.SM_OAUTH2_CLIENT_ID;
const clientSecret = process.env.SM_OAUTH2_CLIENT_SECRET;
const redirectUri = process.env.SM_OAUTH2_REDIRECT_URI;
const scope = process.env.SM_OAUTH2_SCOPE;
const port = process.env.PORT || 5555;


app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.get('/', (_req, res) => {
    res.render('index');
})

app.get('/connect-with-sm', (_req, res) => {
    const authUrl = new URL(process.env.STICKERMULE_OAUTH2_AUTH_URL);
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

    res.redirect(authUrl.toString())
})


app.get('/connect-with-sm-prompt', (req, res) => {
    const authUrl = new URL(process.env.STICKERMULE_OAUTH2_AUTH_URL);
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

    res.redirect(authUrl.toString())
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})