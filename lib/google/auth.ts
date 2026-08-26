import { google } from "googleapis";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Faltan las variables de entorno de Google OAuth."
    );
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

export function getGoogleAuthUrl() {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",

    /*
     * Importante:
     *
     * Fuerza a Google a mostrar consentimiento
     * y permite obtener un refresh token nuevo.
     */
    prompt: "consent",

    scope: [
      "https://www.googleapis.com/auth/calendar",
    ],
  });
}

export async function getGoogleTokens(code: string) {
  const oauth2Client = getOAuth2Client();

  const { tokens } =
    await oauth2Client.getToken(code);

  return tokens;
}

export function getAuthenticatedGoogleClient(
  refreshToken: string
) {
  if (!refreshToken) {
    throw new Error(
      "GOOGLE_REFRESH_TOKEN_MISSING"
    );
  }

  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.calendar({
    version: "v3",
    auth: oauth2Client,
  });
}