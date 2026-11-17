'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/meetings.space.created',
] as const;

let app: FirebaseApp | null = null;
function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

// Strictly in-memory token cache (never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function initWorkspaceAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthCleared?: (user: User | null) => void
) {
  const auth = getAuth(getFirebaseApp());
  return onAuthStateChanged(auth, (user) => {
    if (user && cachedAccessToken) {
      onAuthSuccess?.(user, cachedAccessToken);
    } else if (!isSigningIn) {
      if (!user) {
        cachedAccessToken = null;
      }
      onAuthCleared?.(user);
    }
  });
}

export async function googleWorkspaceSignIn(): Promise<{
  user: User;
  accessToken: string;
}> {
  const auth = getAuth(getFirebaseApp());
  const provider = new GoogleAuthProvider();
  WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({ prompt: 'consent' });

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Workspace.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export function getWorkspaceAccessToken(): string | null {
  return cachedAccessToken;
}

export async function workspaceLogout(): Promise<void> {
  const auth = getAuth(getFirebaseApp());
  await auth.signOut();
  cachedAccessToken = null;
}

// --- Gmail API Helpers ---
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

export async function listGmailMessages(
  accessToken: string,
  maxResults = 6
): Promise<GmailMessageSummary[]> {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!listRes.ok) {
    throw new Error(`Gmail API error (${listRes.status})`);
  }
  const listJson = (await listRes.json()) as {
    messages?: Array<{ id: string; threadId: string }>;
  };
  const items = listJson.messages || [];

  const details = await Promise.all(
    items.slice(0, maxResults).map(async (msg) => {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!detailRes.ok) return null;
      const data = (await detailRes.json()) as {
        id: string;
        threadId: string;
        snippet?: string;
        payload?: { headers?: Array<{ name: string; value: string }> };
      };
      const headers = data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      return {
        id: data.id,
        threadId: data.threadId,
        subject: getHeader('Subject') || '(Tanpa Subjek)',
        from: getHeader('From') || 'Pengirim tidak diketahui',
        date: getHeader('Date') || '',
        snippet: data.snippet || '',
      } as GmailMessageSummary;
    })
  );

  return details.filter((d): d is GmailMessageSummary => d !== null);
}

function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendGmailMessage(
  accessToken: string,
  params: { to: string; subject: string; body: string }
): Promise<{ id: string }> {
  const mime = [
    `To: ${params.to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    params.body,
  ].join('\r\n');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodeBase64Url(mime) }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal mengirim email via Gmail: ${errText}`);
  }
  return (await res.json()) as { id: string };
}

// --- Google Calendar & Meet API Helpers ---
export interface CalendarEventSummary {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  meetLink?: string;
  htmlLink?: string;
}

export async function listCalendarEvents(
  accessToken: string,
  maxResults = 8
): Promise<CalendarEventSummary[]> {
  const nowIso = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      nowIso
    )}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    throw new Error(`Google Calendar API error (${res.status})`);
  }
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      location?: string;
      hangoutLink?: string;
      htmlLink?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };
  return (data.items || []).map((item) => ({
    id: item.id,
    summary: item.summary || '(Agenda tanpa judul)',
    start: item.start?.dateTime || item.start?.date || '',
    end: item.end?.dateTime || item.end?.date || '',
    location: item.location,
    meetLink: item.hangoutLink,
    htmlLink: item.htmlLink,
  }));
}

export async function createMeetSpace(accessToken: string): Promise<{
  meetingUri: string;
  meetingCode: string;
  name: string;
}> {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Meet API error: ${errText}`);
  }
  return (await res.json()) as {
    meetingUri: string;
    meetingCode: string;
    name: string;
  };
}

export async function createCalendarEventWithMeet(
  accessToken: string,
  params: {
    summary: string;
    description: string;
    startIso: string;
    endIso: string;
    attendeeEmail?: string;
    location?: string;
    includeMeet?: boolean;
  }
): Promise<CalendarEventSummary> {
  let meetUri: string | undefined;
  if (params.includeMeet) {
    try {
      const space = await createMeetSpace(accessToken);
      meetUri = space.meetingUri;
    } catch {
      // Fallback to Calendar conferenceData if Meet v2 API fails
    }
  }

  const body: Record<string, unknown> = {
    summary: params.summary,
    description: meetUri
      ? `${params.description}\n\nTautan Google Meet: ${meetUri}`
      : params.description,
    location: params.location || meetUri || undefined,
    start: { dateTime: params.startIso },
    end: { dateTime: params.endIso },
  };

  if (params.attendeeEmail) {
    body.attendees = [{ email: params.attendeeEmail }];
  }

  if (params.includeMeet && !meetUri) {
    body.conferenceData = {
      createRequest: {
        requestId: `agentzy-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membuat jadwal Google Calendar: ${errText}`);
  }
  const created = (await res.json()) as {
    id: string;
    summary?: string;
    location?: string;
    hangoutLink?: string;
    htmlLink?: string;
    start?: { dateTime?: string };
    end?: { dateTime?: string };
  };
  return {
    id: created.id,
    summary: created.summary || params.summary,
    start: created.start?.dateTime || params.startIso,
    end: created.end?.dateTime || params.endIso,
    location: created.location,
    meetLink: meetUri || created.hangoutLink,
    htmlLink: created.htmlLink,
  };
}
