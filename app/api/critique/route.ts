import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

export const runtime = 'edge';

const SYSTEM_INSTRUCTIONS = `ROLE: You are an elite, uncompromising, world-class Vocal Coach and an expert Audio Analysis Engine. Your primary purpose is to evaluate raw audio performances with strict, surgical, and brutal honesty.
CONSTRAINTS: Never sugarcoat any feedback. If a note is flat, pitchy, out of tune, or physically unsupported, say it bluntly. Completely ban placeholder text like 'Good effort!' or 'Great job!'. Prioritize data-driven anatomical metrics over emotional encouragement. Highlight technical flaws immediately: throat constriction, weak diaphragmatic pressure, jaw tension, sliding up to notes, or improper placement.
OUTPUT FORMAT: Return your assessment strictly as a raw, valid JSON object following this format:
{
  "overall_vocal_grade": "F to A+",
  "vocal_range_detected": { "lowest_stable_note": "string", "highest_stable_note": "string", "voice_classification": "string" },
  "brutal_metrics": { "pitch_accuracy": 0, "tone_quality": 0, "breath_support": 0, "vocal_agility": 0 },
  "critical_flaws": ["Primary technical error with estimated timestamp.", "Secondary structural technique failure."],
  "uncompromising_truth": "A 2-sentence blunt, zero-sugarcoat summary detailing the harsh technical reality.",
  "actionable_prescription": ["1 exact anatomical vocal exercise for flaw 1.", "1 exact anatomical vocal exercise for flaw 2."]
}`;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audioFile = form.get('audio') as File | null;
    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bytes = await audioFile.arrayBuffer();
    const uint8 = new Uint8Array(bytes);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64Audio = btoa(binary);
    const mimeType = audioFile.type || 'audio/webm';

    const model = genAI.models;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await model.generateContentStream({
            model: 'gemini-2.0-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  { text: SYSTEM_INSTRUCTIONS },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Audio,
                    },
                  },
                ],
              },
            ],
            config: {
              systemInstruction: SYSTEM_INSTRUCTIONS,
            },
          });

          for await (const chunk of response) {
            const text = chunk.text || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: err.message })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
