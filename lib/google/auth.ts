import { google } from "googleapis";

export function getGoogleCalendarClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    ),
    scopes: [
      "https://www.googleapis.com/auth/calendar",
    ],
  });

  return google.calendar({
    version: "v3",
    auth,
  });
}