'use client';

import React, { useState } from 'react';
import {
  Video,
  Palette,
  Image as ImageIcon,
  FileText,
  Send,
  Copy,
  Download,
  Mail,
  Sparkles,
  Check,
  Bot,
  User,
  Play,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import type {
  ContentArtifactItem,
  ContentArtifactKind,
  ContentChatMessage,
} from '../../lib/ai-workforce-types';
import { buildArtifactDownloadContent } from '../../services/ai-workforce-service';

const ARTIFACT_KINDS: Array<{
  id: ContentArtifactKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  channelDefault: string;
  samplePrompt: string;
}> = [
  {
    id: 'video',
    label: 'Video',
    icon: Video,
    channelDefault: 'Instagram Reels · TikTok · WhatsApp Status',
    samplePrompt:
      'Buatkan naskah dan storyboard video Reels/TikTok 30 detik untuk promo pasang internet fiber 100 Mbps gratis instalasi di area perumahan baru.',
  },
  {
    id: 'design',
    label: 'Design',
    icon: Palette,
    channelDefault: 'Instagram Feed · WhatsApp Broadcast · Flyer',
    samplePrompt:
      'Buatkan desain flyer promo paket internet rumah tanpa FUP mulai Rp279rb/bulan untuk disebarkan Staff Sales & Affiliate di grup warga.',
  },
  {
    id: 'image',
    label: 'Gambar',
    icon: ImageIcon,
    channelDefault: 'Meta Ads · Instagram Story · Banner Area',
    samplePrompt:
      'Buat konsep gambar iklan modern keluarga WFH menikmati koneksi internet cepat tanpa buffering dengan teks overlay penawaran.',
  },
  {
    id: 'document',
    label: 'Dokumen',
    icon: FileText,
    channelDefault: 'Email Penawaran (Gmail) · Proposal PDF B2B',
    samplePrompt:
      'Susun dokumen proposal penawaran resmi Internet Bisnis 100 Mbps Dedicated + Managed WiFi untuk calon pelanggan kantor/ruko.',
  },
];

export function ContentStudioView({
  artifacts,
  selectedArtifact,
  chatMessages,
  isGenerating,
  error,
  onSelectArtifact,
  onGenerate,
  onShowToast,
}: {
  artifacts: ContentArtifactItem[];
  selectedArtifact: ContentArtifactItem;
  chatMessages: ContentChatMessage[];
  isGenerating: boolean;
  error: string | null;
  onSelectArtifact: (id: string) => void;
  onGenerate: (prompt: string, kind: ContentArtifactKind, channel: string) => Promise<void>;
  onShowToast: (msg: string) => void;
}) {
  const { openSendEmailModal } = useWorkspace();
  const [selectedKind, setSelectedKind] = useState<ContentArtifactKind>('video');
  const [channel, setChannel] = useState(ARTIFACT_KINDS[0].channelDefault);
  const [promptInput, setPromptInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;
    const text = promptInput.trim();
    setPromptInput('');
    await onGenerate(text, selectedKind, channel);
  };

  const handleCopyCopywriting = async () => {
    const full = `${selectedArtifact.title}\n\n${selectedArtifact.captionOrCopy}\n\n${selectedArtifact.hashtags.join(' ')}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopiedId(selectedArtifact.id);
      onShowToast('Copywriting & hashtag disalin ke clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onShowToast('Teks siap disalin secara manual dari pratinjau');
    }
  };

  const handleDownloadArtifact = () => {
    const { filename, mimeType, content } =
      buildArtifactDownloadContent(selectedArtifact);
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onShowToast(`Artifact "${filename}" berhasil diunduh`);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Fasilitas Support Staff Sales &amp; Affiliate
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17324D]">
            Chat &amp; Artifact Generate Content Studio
          </h1>
          <p className="mt-1 text-xs text-[#526675]">
            Diskusikan kebutuhan kampanye dengan AI Sales Content Assistant dan hasilkan
            artifact Video, Design Flyer, Gambar Iklan, maupun Dokumen Penawaran siap pakai.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#526675]">
          <span className="font-mono-tabular font-semibold text-[#17324D]">
            {artifacts.length} Artifact Tersimpan
          </span>
          <span aria-hidden="true">·</span>
          <span>Powered by Gemini</span>
        </div>
      </div>

      {/* Main Split Workspace: Left Chat & Generator Controls | Right Live Artifact Canvas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN (5 cols): Chat History + Prompt Composer */}
        <div className="flex min-w-0 flex-col rounded-[16px] border border-[#D8E3E9] bg-white lg:col-span-5">
          {/* Format Selector Tabs */}
          <div className="border-b border-[#EAF2F6] p-3.5 sm:p-4">
            <p className="mb-2 text-[11px] font-semibold text-[#526675]">
              Pilih Jenis Artifact yang Ingin Dibuat
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-1">
              {ARTIFACT_KINDS.map((k) => {
                const Icon = k.icon;
                const active = selectedKind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      setSelectedKind(k.id);
                      setChannel(k.channelDefault);
                    }}
                    className={`flex min-h-[40px] sm:min-h-[36px] items-center justify-center gap-1.5 rounded-[8px] px-2 py-2 text-xs font-semibold transition whitespace-nowrap ${
                      active
                        ? 'bg-[#0284C7] text-white'
                        : 'text-[#526675] hover:text-[#17324D]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{k.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-[#526675]">
              <span className="truncate">Kanal: {channel}</span>
              <button
                type="button"
                onClick={() => {
                  const found = ARTIFACT_KINDS.find((k) => k.id === selectedKind);
                  if (found) setPromptInput(found.samplePrompt);
                }}
                className="shrink-0 font-semibold text-[#0284C7] hover:underline"
              >
                Isi Contoh Brief
              </button>
            </div>
          </div>

          {/* Chat Thread */}
          <div className="max-h-[380px] space-y-3 overflow-y-auto p-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                    msg.role === 'user' ? 'bg-[#17324D]' : 'bg-[#0284C7]'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] rounded-[12px] p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#17324D] text-white'
                      : 'border border-[#EAF2F6] bg-[#F5F8FA] text-[#172B3A]'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.artifactId && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectArtifact(msg.artifactId!);
                        setActiveSceneIdx(0);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-[7px] bg-white px-2.5 py-1 text-[11px] font-bold text-[#0284C7] border border-[#87CEEB] hover:bg-[#E6F4F9]"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Buka Artifact di Panel Kanan</span>
                    </button>
                  )}
                  <p
                    className={`mt-1 text-[10px] ${
                      msg.role === 'user' ? 'text-[#ADD8E6]' : 'text-[#718391]'
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex items-center gap-2 rounded-[10px] border border-[#87CEEB] bg-[#E6F4F9] p-3 text-xs font-semibold text-[#17324D]">
                <Loader2 className="h-4 w-4 animate-spin text-[#0284C7]" />
                <span>
                  Sedang menyusun artifact {selectedKind} untuk Staff Sales...
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-[10px] border border-[#B23A48]/30 bg-red-50 p-3 text-xs text-[#B23A48]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Prompt Composer */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-[#EAF2F6] p-3.5 space-y-2.5"
          >
            <textarea
              rows={2}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={`Tulis brief ${selectedKind} untuk Staff Sales & Affiliate (misal: target area, promo, paket internet)...`}
              className="w-full rounded-[10px] border border-[#B8C9D3] bg-[#F5F8FA] p-2.5 text-xs text-[#172B3A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
            />
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[11px] text-[#718391]">
                Estimasi 120 AI Credits / generate
              </span>
              <button
                type="submit"
                disabled={isGenerating || !promptInput.trim()}
                className="inline-flex h-10 sm:h-9 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[9px] bg-[#0284C7] px-4 text-xs font-semibold text-white transition hover:bg-[#0369A1] disabled:opacity-50 whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Generate {ARTIFACT_KINDS.find((k) => k.id === selectedKind)?.label}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN (7 cols): Artifact Library Selector + Live Artifact Preview */}
        <div className="min-w-0 space-y-4 lg:col-span-7">
          {/* Artifact Switcher Strip */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {artifacts.map((art) => {
              const active = art.id === selectedArtifact.id;
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => {
                    onSelectArtifact(art.id);
                    setActiveSceneIdx(0);
                  }}
                  className={`shrink-0 rounded-[10px] border px-3 py-2 text-left transition max-w-[220px] ${
                    active
                      ? 'border-[#0284C7] bg-[#E6F4F9]'
                      : 'border-[#D8E3E9] bg-white hover:border-[#87CEEB]'
                  }`}
                >
                  <p className="font-mono-tabular text-[10px] font-bold uppercase text-[#0284C7]">
                    {art.kind} · {art.createdAt}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-bold text-[#17324D]">
                    {art.title}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Artifact Canvas */}
          <div className="rounded-[16px] border border-[#D8E3E9] bg-white p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-3 border-b border-[#EAF2F6] pb-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#526675]">
                  <span className="font-mono-tabular font-bold uppercase text-[#0284C7]">
                    Artifact {selectedArtifact.kind}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedArtifact.targetAudience}</span>
                </div>
                <h2 className="mt-1 text-base sm:text-lg font-bold text-[#17324D]">
                  {selectedArtifact.title}
                </h2>
                <p className="mt-1 text-xs text-[#526675]">
                  {selectedArtifact.summary}
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center shrink-0">
                <button
                  type="button"
                  onClick={handleCopyCopywriting}
                  className="inline-flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D] hover:border-[#0284C7]"
                >
                  {copiedId === selectedArtifact.id ? (
                    <Check className="h-3.5 w-3.5 text-[#247A55]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-[#0284C7]" />
                  )}
                  <span>Salin Copy</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadArtifact}
                  className="inline-flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-[9px] bg-[#17324D] px-3 text-xs font-semibold text-white hover:bg-[#245477]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh Artifact</span>
                </button>
              </div>
            </div>

            {/* KIND 1: VIDEO STORYBOARD & PLAYER */}
            {selectedArtifact.kind === 'video' && selectedArtifact.videoScenes && (
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-12">
                {/* Vertical Phone Storyboard Preview */}
                <div className="md:col-span-5">
                  <div className="mx-auto flex aspect-[9/14] max-w-[230px] flex-col justify-between rounded-[20px] border border-[#245477] bg-gradient-to-br from-[#17324D] via-[#1C3F60] to-[#0284C7] p-4 text-white shadow-md">
                    <div className="flex items-center justify-between text-[10px] text-[#ADD8E6]">
                      <span className="font-mono-tabular font-bold">
                        {selectedArtifact.videoScenes[activeSceneIdx]?.timeRange}
                      </span>
                      <span>9:16 Reels</span>
                    </div>
                    <div className="my-auto space-y-2 text-center">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                        <Play className="h-4 w-4 text-white" />
                      </span>
                      <p className="text-sm font-bold leading-snug">
                        {selectedArtifact.videoScenes[activeSceneIdx]?.overlayText}
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#E6F4F9]">
                        {selectedArtifact.videoScenes[activeSceneIdx]?.visual}
                      </p>
                    </div>
                    <div className="rounded-[10px] bg-black/25 p-2.5 text-[11px] text-[#E6F4F9]">
                      &ldquo;{selectedArtifact.videoScenes[activeSceneIdx]?.voiceover}&rdquo;
                    </div>
                  </div>
                </div>

                {/* Scene List */}
                <div className="space-y-2.5 md:col-span-7">
                  <p className="text-xs font-bold text-[#17324D]">
                    Urutan Adegan Storyboard (Klik untuk pratinjau)
                  </p>
                  {selectedArtifact.videoScenes.map((scene, idx) => (
                    <button
                      key={scene.timeRange}
                      type="button"
                      onClick={() => setActiveSceneIdx(idx)}
                      className={`w-full rounded-[11px] border p-3 text-left transition ${
                        activeSceneIdx === idx
                          ? 'border-[#0284C7] bg-[#E6F4F9]'
                          : 'border-[#D8E3E9] bg-[#F5F8FA] hover:border-[#87CEEB]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-mono-tabular font-bold text-[#0284C7]">
                          Adegan {idx + 1} · {scene.timeRange}
                        </span>
                        <span className="font-semibold text-[#17324D]">
                          {scene.overlayText}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#526675]">
                        <strong>Voiceover:</strong> &ldquo;{scene.voiceover}&rdquo;
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* KIND 2: DESIGN FLYER / POSTER ARTIFACT */}
            {selectedArtifact.kind === 'design' && selectedArtifact.designConfig && (
              <div className="mt-5 rounded-[16px] border border-[#245477]/20 bg-gradient-to-br from-[#17324D] via-[#245477] to-[#0284C7] p-6 text-white">
                <span className="inline-block rounded-md bg-[#87CEEB] px-3 py-1 text-[11px] font-bold text-[#17324D]">
                  {selectedArtifact.designConfig.offerBadge}
                </span>
                <h3 className="mt-4 text-xl font-bold leading-snug sm:text-2xl">
                  {selectedArtifact.designConfig.headline}
                </h3>
                <p className="mt-2 text-xs text-[#E6F4F9] sm:text-sm">
                  {selectedArtifact.designConfig.subheadline}
                </p>
                <ul className="mt-4 space-y-2">
                  {selectedArtifact.designConfig.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 rounded-[9px] bg-white/10 px-3 py-2 text-xs font-semibold"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[#87CEEB]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
                  <span className="rounded-[9px] bg-[#87CEEB] px-4 py-2 text-xs font-bold text-[#17324D]">
                    {selectedArtifact.designConfig.ctaText}
                  </span>
                  <span className="text-[11px] text-[#ADD8E6]">
                    Siap diunduh sebagai SVG resolusi tinggi
                  </span>
                </div>
              </div>
            )}

            {/* KIND 3: GAMBAR KONSEP IKLAN */}
            {selectedArtifact.kind === 'image' && selectedArtifact.imageSpec && (
              <div className="mt-5 space-y-4">
                <div className="relative overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-gradient-to-r from-[#17324D] via-[#1C496F] to-[#0284C7] p-6 text-white">
                  <p className="font-mono-tabular text-[11px] text-[#ADD8E6]">
                    Rasio {selectedArtifact.imageSpec.aspectRatio} · Visual Ad Concept
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    {selectedArtifact.imageSpec.headlineOverlay}
                  </h3>
                  <p className="mt-1 text-xs text-[#E6F4F9]">
                    {selectedArtifact.imageSpec.subOverlay}
                  </p>
                  <div className="mt-4 rounded-[10px] bg-white/10 p-3 text-xs text-[#E6F4F9]">
                    <p>
                      <strong>Arahan Visual:</strong>{' '}
                      {selectedArtifact.imageSpec.visualConcept}
                    </p>
                    <p className="mt-1">
                      <strong>Pencahayaan &amp; Mood:</strong>{' '}
                      {selectedArtifact.imageSpec.lightingMood}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* KIND 4: DOKUMEN PROPOSAL PENAWARAN */}
            {selectedArtifact.kind === 'document' &&
              selectedArtifact.documentSections && (
                <div className="mt-5 space-y-3 rounded-[12px] border border-[#D8E3E9] bg-[#F8FBFD] p-5">
                  {selectedArtifact.documentSections.map((sec) => (
                    <div
                      key={sec.heading}
                      className="border-b border-[#EAF2F6] pb-3 last:border-b-0 last:pb-0"
                    >
                      <h3 className="text-xs font-bold text-[#17324D] sm:text-sm">
                        {sec.heading}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[#526675]">
                        {sec.body}
                      </p>
                    </div>
                  ))}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        openSendEmailModal({
                          to: 'prospek@perusahaan.co.id',
                          subject: selectedArtifact.title,
                          body: `${selectedArtifact.captionOrCopy}\n\n${selectedArtifact.documentSections
                            ?.map((s) => `${s.heading}\n${s.body}`)
                            .join('\n\n')}`,
                          contextLabel:
                            'Kirim dokumen penawaran dari Content Studio via Gmail.',
                        })
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white hover:bg-[#0369A1]"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Kirim Proposal via Gmail</span>
                    </button>
                  </div>
                </div>
              )}

            {/* Copywriting & Hashtags Footer */}
            <div className="mt-5 rounded-[12px] border border-[#EAF2F6] bg-[#F5F8FA] p-4">
              <p className="text-xs font-bold text-[#17324D]">
                Caption / Naskah Promosi Siap Sebar ({selectedArtifact.channel})
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#172B3A]">
                {selectedArtifact.captionOrCopy}
              </p>
              <p className="mt-2 font-mono-tabular text-[11px] font-semibold text-[#0284C7]">
                {selectedArtifact.hashtags.join(' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
