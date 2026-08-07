export interface CalendarEventInput {
  calendarId: string;

  title: string;

  description?: string | null;

  start: Date;

  end: Date;
}