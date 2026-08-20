// Sanitized version of the original browser experiment.
// Paste a short-lived token at runtime; never commit a real token.
async function getFitbitProfile(accessToken) {
  const response = await fetch("https://api.fitbit.com/1/user/-/profile.json", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Fitbit API returned ${response.status}`);
  }

  return response.json();
}
