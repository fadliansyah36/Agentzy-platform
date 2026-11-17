import type { ContentArtifactItem } from '../lib/ai-workforce-types';

export function formatCreditsID(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatIDRCompact(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildArtifactDownloadContent(artifact: ContentArtifactItem): {
  filename: string;
  mimeType: string;
  content: string;
} {
  if (artifact.kind === 'design' || artifact.kind === 'image') {
    const headline =
      artifact.designConfig?.headline ||
      artifact.imageSpec?.headlineOverlay ||
      artifact.title;
    const sub =
      artifact.designConfig?.subheadline ||
      artifact.imageSpec?.subOverlay ||
      artifact.summary;
    const badge =
      artifact.designConfig?.offerBadge || artifact.channel;
    const cta =
      artifact.designConfig?.ctaText || 'Hubungi Staff Sales Resmi Agentzy';
    const bullets = artifact.designConfig?.bullets || [
      artifact.targetAudience,
      artifact.imageSpec?.visualConcept || artifact.summary,
    ];

    const escapeXml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#17324D"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="940" cy="140" r="220" fill="#87CEEB" fill-opacity="0.16"/>
  <rect x="72" y="84" width="936" height="912" rx="32" fill="#FFFFFF" fill-opacity="0.06" stroke="#87CEEB" stroke-opacity="0.35"/>
  <rect x="112" y="136" width="520" height="48" rx="24" fill="#87CEEB"/>
  <text x="140" y="168" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="22" font-weight="700" fill="#17324D">${escapeXml(badge.slice(0, 42))}</text>
  <text x="112" y="290" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="54" font-weight="800" fill="#FFFFFF">${escapeXml(headline.slice(0, 34))}</text>
  <text x="112" y="362" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="54" font-weight="800" fill="#ADD8E6">${escapeXml(headline.slice(34, 68))}</text>
  <text x="112" y="438" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="26" fill="#E6F4F9">${escapeXml(sub.slice(0, 72))}</text>
  ${bullets
    .slice(0, 3)
    .map(
      (b, idx) =>
        `<rect x="112" y="${520 + idx * 82}" width="856" height="64" rx="14" fill="#FFFFFF" fill-opacity="0.12"/><text x="142" y="${560 + idx * 82}" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="24" font-weight="600" fill="#FFFFFF">✓  ${escapeXml(b.slice(0, 58))}</text>`
    )
    .join('\n  ')}
  <rect x="112" y="830" width="560" height="76" rx="18" fill="#87CEEB"/>
  <text x="148" y="878" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="26" font-weight="800" fill="#17324D">${escapeXml(cta.slice(0, 40))}</text>
  <text x="112" y="954" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="20" fill="#ADD8E6">Agentzy · Fasilitas Support Staff Sales</text>
</svg>`;
    return {
      filename: `${artifact.id.toLowerCase()}-${artifact.kind}.svg`,
      mimeType: 'image/svg+xml;charset=utf-8',
      content: svg,
    };
  }

  const lines = [
    `# ${artifact.title}`,
    ``,
    `- **Jenis Artifact:** ${artifact.kind.toUpperCase()}`,
    `- **Target Audiens:** ${artifact.targetAudience}`,
    `- **Kanal:** ${artifact.channel}`,
    `- **Ringkasan:** ${artifact.summary}`,
    ``,
    `## Copy / Caption Siap Pakai`,
    artifact.captionOrCopy,
    ``,
    artifact.hashtags.length ? `Hashtags: ${artifact.hashtags.join(' ')}` : '',
  ];

  if (artifact.videoScenes?.length) {
    lines.push('', '## Storyboard & Naskah Video');
    artifact.videoScenes.forEach((s, i) => {
      lines.push(
        `\n### Adegan ${i + 1} (${s.timeRange})`,
        `- **Visual:** ${s.visual}`,
        `- **Voiceover:** "${s.voiceover}"`,
        `- **Teks Layar:** ${s.overlayText}`
      );
    });
  }

  if (artifact.documentSections?.length) {
    lines.push('', '## Isi Dokumen Penawaran');
    artifact.documentSections.forEach((sec) => {
      lines.push(`\n### ${sec.heading}\n${sec.body}`);
    });
  }

  return {
    filename: `${artifact.id.toLowerCase()}-${artifact.kind}.md`,
    mimeType: 'text/markdown;charset=utf-8',
    content: lines.join('\n'),
  };
}
