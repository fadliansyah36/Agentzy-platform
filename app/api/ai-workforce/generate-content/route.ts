import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY belum dikonfigurasi pada server. Silakan periksa Settings > Secrets.',
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const kind =
      body?.kind === 'video' ||
      body?.kind === 'design' ||
      body?.kind === 'image' ||
      body?.kind === 'document'
        ? body.kind
        : 'design';
    const tenantName =
      typeof body?.tenantName === 'string' && body.tenantName.trim()
        ? body.tenantName.trim()
        : 'ISP Nusantara';
    const channel =
      typeof body?.channel === 'string' && body.channel.trim()
        ? body.channel.trim()
        : 'Instagram · TikTok · WhatsApp';

    if (!prompt) {
      return NextResponse.json(
        { error: 'Mohon masukkan brief atau topik konten terlebih dahulu.' },
        { status: 400 }
      );
    }

    const systemInstruction = `Anda adalah AI Sales Content Assistant untuk mendukung Staff Sales dan Affiliate Freelance di perusahaan "${tenantName}" dalam ekosistem Agentzy.
Tugas Anda adalah menghasilkan materi pemasaran, promosi, konten media sosial, dan penawaran penjualan dalam Bahasa Indonesia yang persuasif, profesional, jelas, dan siap pakai.
Selalu sesuaikan output dengan jenis artifact yang diminta (${kind}) dan kanal target (${channel}).
Jawab secara ketat dalam format JSON sesuai schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Buat artifact jenis "${kind}" untuk kebutuhan Staff Sales & Affiliate berdasarkan brief berikut:\n"${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assistantReply: {
              type: Type.STRING,
              description:
                'Pesan singkat ramah untuk Staff Sales menjelaskan hasil artifact yang telah dibuat.',
            },
            title: {
              type: Type.STRING,
              description: 'Judul singkat artifact promosi.',
            },
            targetAudience: {
              type: Type.STRING,
              description: 'Segmen calon pelanggan target.',
            },
            summary: {
              type: Type.STRING,
              description: 'Ringkasan 1-2 kalimat strategi konten.',
            },
            captionOrCopy: {
              type: Type.STRING,
              description:
                'Caption siap posting atau pesan penawaran WhatsApp/Email yang persuasif.',
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 sampai 5 hashtag relevan.',
            },
            videoScenes: {
              type: Type.ARRAY,
              description:
                'Isi jika kind adalah video: 3 sampai 4 adegan storyboard berdurasi total 30 detik.',
              items: {
                type: Type.OBJECT,
                properties: {
                  timeRange: { type: Type.STRING },
                  visual: { type: Type.STRING },
                  voiceover: { type: Type.STRING },
                  overlayText: { type: Type.STRING },
                },
              },
            },
            designConfig: {
              type: Type.OBJECT,
              description:
                'Isi jika kind adalah design: konfigurasi teks dan poin unggulan flyer/poster.',
              properties: {
                headline: { type: Type.STRING },
                subheadline: { type: Type.STRING },
                offerBadge: { type: Type.STRING },
                ctaText: { type: Type.STRING },
                accentColor: { type: Type.STRING },
                bullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
            imageSpec: {
              type: Type.OBJECT,
              description:
                'Isi jika kind adalah image: spesifikasi visual iklan dan teks overlay banner.',
              properties: {
                aspectRatio: { type: Type.STRING },
                visualConcept: { type: Type.STRING },
                lightingMood: { type: Type.STRING },
                headlineOverlay: { type: Type.STRING },
                subOverlay: { type: Type.STRING },
              },
            },
            documentSections: {
              type: Type.ARRAY,
              description:
                'Isi jika kind adalah document: 3 sampai 4 bagian proposal atau dokumen penawaran resmi.',
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  body: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);

    return NextResponse.json({
      success: true,
      result: parsed,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Gagal memproses permintaan Gemini API.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
