'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  initWorkspaceAuth,
  googleWorkspaceSignIn,
  workspaceLogout,
  getWorkspaceAccessToken,
  sendGmailMessage,
  createCalendarEventWithMeet,
  listGmailMessages,
  listCalendarEvents,
  createMeetSpace,
  type GmailMessageSummary,
  type CalendarEventSummary,
} from '@/lib/google-workspace';
import { X, Mail, Calendar, Video, CheckCircle2, AlertCircle, Send } from 'lucide-react';

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  contextLabel?: string;
}

interface MeetingDraft {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  attendeeEmail?: string;
  location?: string;
  includeMeet: boolean;
}

interface WorkspaceContextValue {
  user: User | null;
  accessToken: string | null;
  isConnected: boolean;
  isSigningIn: boolean;
  authError: string | null;
  connectWorkspace: () => Promise<boolean>;
  disconnectWorkspace: () => Promise<void>;
  openSendEmailModal: (draft: EmailDraft) => void;
  openScheduleMeetingModal: (draft: MeetingDraft) => void;
  fetchInbox: () => Promise<GmailMessageSummary[]>;
  fetchCalendar: () => Promise<CalendarEventSummary[]>;
  instantMeetRoom: () => Promise<{ meetingUri: string; meetingCode: string }>;
  lastActionNotice: string | null;
  clearNotice: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return ctx;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastActionNotice, setLastActionNotice] = useState<string | null>(null);

  const [emailModal, setEmailModal] = useState<EmailDraft | null>(null);
  const [meetingModal, setMeetingModal] = useState<MeetingDraft | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
      },
      (authUser) => {
        setUser(authUser);
        setAccessToken(getWorkspaceAccessToken());
      }
    );
    return () => unsub();
  }, []);

  const connectWorkspace = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await googleWorkspaceSignIn();
      setUser(res.user);
      setAccessToken(res.accessToken);
      setLastActionNotice(
        `Terhubung ke Google Workspace sebagai ${res.user.email || res.user.displayName}`
      );
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menghubungkan akun Google.';
      setAuthError(msg);
      return false;
    } finally {
      setIsSigningIn(false);
    }
  };

  const disconnectWorkspace = async () => {
    await workspaceLogout();
    setUser(null);
    setAccessToken(null);
    setLastActionNotice('Sesi Google Workspace telah diputuskan.');
  };

  const handleConfirmSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModal) return;
    setActionError(null);
    setSubmittingAction(true);

    try {
      let token = accessToken;
      if (!token) {
        const res = await googleWorkspaceSignIn();
        setUser(res.user);
        setAccessToken(res.accessToken);
        token = res.accessToken;
      }
      await sendGmailMessage(token, {
        to: emailModal.to,
        subject: emailModal.subject,
        body: emailModal.body,
      });
      setLastActionNotice(`Email berhasil dikirim ke ${emailModal.to} via Gmail.`);
      setEmailModal(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal mengirim email via Gmail.'
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingModal) return;
    setActionError(null);
    setSubmittingAction(true);

    try {
      let token = accessToken;
      if (!token) {
        const res = await googleWorkspaceSignIn();
        setUser(res.user);
        setAccessToken(res.accessToken);
        token = res.accessToken;
      }
      const created = await createCalendarEventWithMeet(token, meetingModal);
      setLastActionNotice(
        created.meetLink
          ? `Agenda "${created.summary}" tersimpan di Google Calendar dengan tautan Google Meet: ${created.meetLink}`
          : `Agenda "${created.summary}" berhasil dijadwalkan di Google Calendar.`
      );
      setMeetingModal(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal membuat agenda Google Calendar.'
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const fetchInbox = async () => {
    if (!accessToken) throw new Error('Silakan Masuk dengan Google terlebih dahulu.');
    return listGmailMessages(accessToken);
  };

  const fetchCalendar = async () => {
    if (!accessToken) throw new Error('Silakan Masuk dengan Google terlebih dahulu.');
    return listCalendarEvents(accessToken);
  };

  const instantMeetRoom = async () => {
    let token = accessToken;
    if (!token) {
      const res = await googleWorkspaceSignIn();
      setUser(res.user);
      setAccessToken(res.accessToken);
      token = res.accessToken;
    }
    return createMeetSpace(token);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        accessToken,
        isConnected: Boolean(accessToken),
        isSigningIn,
        authError,
        connectWorkspace,
        disconnectWorkspace,
        openSendEmailModal: (draft) => {
          setActionError(null);
          setEmailModal(draft);
        },
        openScheduleMeetingModal: (draft) => {
          setActionError(null);
          setMeetingModal(draft);
        },
        fetchInbox,
        fetchCalendar,
        instantMeetRoom,
        lastActionNotice,
        clearNotice: () => setLastActionNotice(null),
      }}
    >
      {children}

      {/* Global Toast Notice */}
      {lastActionNotice && (
        <div className="fixed right-4 top-4 z-50 flex max-w-md items-start gap-2.5 rounded-[12px] border border-[#247A55]/30 bg-white p-3.5 text-xs text-[#172B3A] shadow-lg">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#247A55]" />
          <p className="flex-1 leading-relaxed">{lastActionNotice}</p>
          <button
            type="button"
            onClick={() => setLastActionNotice(null)}
            className="rounded p-1 text-[#526675] hover:bg-[#EAF2F6]"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal for Sending Gmail (Mandatory confirmation before mutating external action) */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmSendEmail}
            className="w-full max-w-lg rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B3A]">
                    Konfirmasi Pengiriman Email (Gmail)
                  </h3>
                  <p className="text-xs text-[#526675]">
                    {emailModal.contextLabel || 'Email akan dikirim melalui akun Google Anda setelah dikonfirmasi.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailModal(null)}
                className="rounded-lg p-1.5 text-[#526675] hover:bg-[#EAF2F6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Penerima (Kepada)
                </label>
                <input
                  type="email"
                  required
                  value={emailModal.to}
                  onChange={(e) =>
                    setEmailModal({ ...emailModal, to: e.target.value })
                  }
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Subjek Email
                </label>
                <input
                  type="text"
                  required
                  value={emailModal.subject}
                  onChange={(e) =>
                    setEmailModal({ ...emailModal, subject: e.target.value })
                  }
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Isi Pesan
                </label>
                <textarea
                  rows={4}
                  required
                  value={emailModal.body}
                  onChange={(e) =>
                    setEmailModal({ ...emailModal, body: e.target.value })
                  }
                  className="w-full rounded-[10px] border border-[#B8C9D3] p-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
            </div>

            {actionError && (
              <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-red-50 px-3 py-2 text-xs text-[#B23A48]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEmailModal(null)}
                className="rounded-[10px] border border-[#B8C9D3] bg-white px-4 py-2 text-sm font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingAction}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#0284C7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369A1] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                <span>
                  {submittingAction
                    ? 'Mengirim...'
                    : accessToken
                      ? 'Konfirmasi & Kirim Email'
                      : 'Masuk Google & Kirim'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal for Google Calendar + Google Meet */}
      {meetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmScheduleMeeting}
            className="w-full max-w-lg rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B3A]">
                    Konfirmasi Jadwal Google Calendar & Meet
                  </h3>
                  <p className="text-xs text-[#526675]">
                    Agenda akan ditambahkan ke Google Calendar Anda setelah dikonfirmasi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMeetingModal(null)}
                className="rounded-lg p-1.5 text-[#526675] hover:bg-[#EAF2F6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Judul Agenda
                </label>
                <input
                  type="text"
                  required
                  value={meetingModal.summary}
                  onChange={(e) =>
                    setMeetingModal({ ...meetingModal, summary: e.target.value })
                  }
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                    Waktu Mulai
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingModal.startIso.slice(0, 16)}
                    onChange={(e) =>
                      setMeetingModal({
                        ...meetingModal,
                        startIso: new Date(e.target.value).toISOString(),
                      })
                    }
                    className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                    Waktu Selesai
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingModal.endIso.slice(0, 16)}
                    onChange={(e) =>
                      setMeetingModal({
                        ...meetingModal,
                        endIso: new Date(e.target.value).toISOString(),
                      })
                    }
                    className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Email Peserta (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="peserta@perusahaan.co.id"
                  value={meetingModal.attendeeEmail || ''}
                  onChange={(e) =>
                    setMeetingModal({
                      ...meetingModal,
                      attendeeEmail: e.target.value,
                    })
                  }
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Catatan / Deskripsi
                </label>
                <textarea
                  rows={3}
                  value={meetingModal.description}
                  onChange={(e) =>
                    setMeetingModal({
                      ...meetingModal,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-[10px] border border-[#B8C9D3] p-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
                <input
                  type="checkbox"
                  checked={meetingModal.includeMeet}
                  onChange={(e) =>
                    setMeetingModal({
                      ...meetingModal,
                      includeMeet: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded accent-[#0284C7]"
                />
                <Video className="h-4 w-4 text-[#0284C7]" />
                <span className="text-xs font-semibold text-[#172B3A]">
                  Sertakan tautan video rapat Google Meet otomatis
                </span>
              </label>
            </div>

            {actionError && (
              <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-red-50 px-3 py-2 text-xs text-[#B23A48]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMeetingModal(null)}
                className="rounded-[10px] border border-[#B8C9D3] bg-white px-4 py-2 text-sm font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingAction}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#0284C7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369A1] disabled:opacity-60"
              >
                <Calendar className="h-4 w-4" />
                <span>
                  {submittingAction
                    ? 'Menjadwalkan...'
                    : accessToken
                      ? 'Konfirmasi & Simpan Agenda'
                      : 'Masuk Google & Simpan'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}
