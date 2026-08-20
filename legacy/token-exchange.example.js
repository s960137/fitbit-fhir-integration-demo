// Server-side teaching example. Values must come from protected configuration.
const axios = require("axios");

async function exchangeAuthorizationCode({
  clientId,
  clientSecret,
  redirectUri,
  authorizationCode
}) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: authorizationCode,
    grant_type: "authorization_code"
  });

  const response = await axios.post("https://api.fitbit.com/oauth2/token", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token
  };
}

module.exports = { exchangeAuthorizationCode };
