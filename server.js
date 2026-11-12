// =====================================================================
//  TC Workspace — Gemini Proxy Server
//  Reads GEMINI_API_KEY from .env and proxies requests to the
//  Gemini API so the key is never exposed to the browser.
//
//  Usage:
//    npm install          (installs dotenv — only dependency)
//    node server.js
//  Then open http://localhost:3000 in your browser.
// =====================================================================

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config(); // load .env into process.env

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('[server] ERROR: GEMINI_API_KEY is not set in .env');
  process.exit(1);
}

// ── MIME types ────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.csv':  'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico':  'image/x-icon',
};

// ── Helper: collect request body ─────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ── Helper: HTTPS POST to Gemini ──────────────────────────────────────
function geminiPost(body) {
  return new Promise((resolve, reject) => {
    const model = 'gemini-2.0-flash';
    const endpoint = `/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const data = Buffer.from(JSON.stringify(body), 'utf8');

    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── HTTP server ──────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {

  // ── POST /api/generate ─────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/generate') {
    try {
      const rawBody = await readBody(req);
      const { requirements, featureName } = JSON.parse(rawBody);

      if (!requirements || !requirements.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'requirements field is required' }));
        return;
      }

      const prompt = buildPrompt(requirements, featureName || 'Feature');
      const geminiPayload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      };

      const { status, body } = await geminiPost(geminiPayload);

      if (status !== 200) {
        console.error('[server] Gemini error:', status, body);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Gemini API error', detail: body }));
        return;
      }

      // Extract the JSON array from Gemini's response
      const geminiRes = JSON.parse(body);
      const text = geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';

      // Gemini with responseMimeType:json returns raw JSON — parse it
      let testCases;
      try {
        testCases = JSON.parse(text);
        if (!Array.isArray(testCases)) throw new Error('not an array');
      } catch {
        // If parsing fails fall back gracefully
        console.error('[server] Could not parse Gemini JSON output:', text.slice(0, 300));
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unexpected response format from Gemini' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(testCases));

    } catch (err) {
      console.error('[server] /api/generate error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // ── GET /api/status ───────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, model: 'gemini-2.0-flash', keyConfigured: true }));
    return;
  }

  // ── Static file serving — serves everything from public/ ─────────
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(__dirname, 'public', urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`[server] TC Workspace running at http://localhost:${PORT}`);
  console.log(`[server] Gemini model: gemini-2.0-flash`);
  console.log(`[server] API key: ${API_KEY.slice(0, 6)}***`);
});

// ── Prompt builder ────────────────────────────────────────────────────
function buildPrompt(requirements, featureName) {
  return `You are a senior QA engineer. Given the following software requirements, produce a JSON array of structured test cases.

Feature: ${featureName}

Requirements:
${requirements}

Rules:
- Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
- Each element must have exactly these fields:
  {
    "id": string,          // format: TC-<FEATURE>-<CATEGORY_ABBR>-<3-digit-seq>, e.g. TC-LOGIN-POS-001
    "title": string,       // short, descriptive test case title
    "category": string,    // one of: "Positive", "Negative", "Boundary", "Edge Case", "Validation", "Error Handling"
    "priority": string,    // one of: "High", "Medium", "Low"
    "preconditions": string,
    "steps": string[],     // ordered array of test steps
    "testData": string,    // concrete example values to use
    "expected": string     // expected result / outcome
  }
- Cover all six categories: Positive, Negative, Boundary, Edge Case, Validation, Error Handling.
- Generate at least 2 cases per category.
- Use the requirements to derive specific, realistic test data (real values, not placeholders like "valid input").
- Do NOT invent business rules not mentioned in the requirements.
- IDs must be unique and sequential.`;
}
