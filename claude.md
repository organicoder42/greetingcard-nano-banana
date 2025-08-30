# claude.md — "Greetingsmith" (AI Greeting Card Web App)

## 1) Product Goal
Build a simple, privacy-aware web app that lets anyone generate a personalised greeting card for a special occasion in minutes.

User provides:
- Occasion (e.g., "Birthday", "Graduation", "Anniversary", "Get well soon…")
- Recipient name (e.g., "Agnes")
- One photo of the recipient (optional but encouraged)

User chooses a visual style:
- Cartoonish
- Futuristic
- Old days (vintage/retro)

The app uses:
- Gemini 2.5 (text) to craft a short, warm greeting message matching tone + occasion.
- Gemini-2.5-flash-image-preview ("NanoBanana") for image generation / image-to-image stylisation of the card cover (background + frame + optional stylised version of the uploaded photo or a composited layout with the original photo).
- Exports a print-ready PDF the user can download.

Default stack: Next.js 15 + React + TypeScript + Tailwind + shadcn/ui.
PDF export via pdf-lib (client) or PDFKit (API route) — prefer client-side pdf-lib to avoid server storage of user photos.

## 2) Scope & Non-Goals

### In Scope
- Single-page flow: input → preview → download
- Upload photo (JPG/PNG, max 10MB)
- Live preview of generated artwork + greeting text
- Three fixed styles (cartoonish, futuristic, old days)
- PDF export (A5 and A4 options; portrait by default)
- Minimal telemetry (client-side only, opt-in)
- Basic rate-limit guard (per session)
- Stripe payment integration for PDF exports

### Out of Scope (for v1)
- Multi-page cards, envelopes, inside spreads
- Accounts, persistence, analytics dashboards
- Bulk generation
- Translations (v1 English only; keep locale hooks ready)

## 3) User Stories & Acceptance Criteria

### Create a card quickly
Given I enter an occasion, a name, optionally upload a photo, and pick a style,
When I click Generate,
Then I see a styled cover image + a short greeting line within ~10–20s and can tweak the greeting text (inline edit).

### High-quality export
When I click Download PDF,
Then I get a crisp, single-page PDF (300 DPI effective for images; embedded fonts) sized A5 (default) or A4.

### Privacy guardrails
My uploaded photo is processed in memory (no persistent storage) unless I explicitly opt-in to improve the model.
The app displays a clear disclosure before sending any image to external APIs.

### Error resilience
If the image model fails, I can retry or switch to a "photo-in-frame" fallback that composes my original photo on a generated background with consistent style.

## 4) Architecture Overview

### Client (Next.js App Router):
- Components: CardForm, StyleSelector, ImagePreview, GreetingEditor, PdfDownloadButton, PayButton
- Local state via React hooks; Zustand (optional) for global card state
- Calls API routes for model requests (server keeps API keys secret)

### Server (Next.js API routes):
- `/api/generate-text` → calls Gemini 2.5 text endpoint
- `/api/generate-image` → calls Gemini-2.5-flash-image-preview ("NanoBanana") for:
  - text-to-image background in chosen style
  - (if supported) image-to-image stylisation of the uploaded photo
  - fallback: compose user photo over generated background with style-consistent frame/motifs (server can return PNG layers)
- No persistence by default; temp buffers only
- Optional: `/api/moderate` (lightweight checks before calling image model)

### PDF Export:
Prefer client-side pdf-lib to assemble final high-res composition → instant download
Embed font (e.g., Inter or fallback system fonts)

## 5) Data Flow (happy path)
1. User fills form (occasion, recipient, optional relationship/tone), uploads photo, picks style.
2. Client requests `/api/generate-text` with {occasion, name, style, tone}.
   Server returns greeting text candidates (1–3).
3. Client requests `/api/generate-image` with:
   - style + textual description (derived prompt)
   - uploaded image (if user accepts external processing)
   Server returns a base64 PNG (or URL) for preview.
4. User optionally edits greeting text inline.
5. User clicks "Unlock & Download" → Stripe Checkout flow
6. After payment, client composes final layout (image + text) in canvas, then renders PDF via pdf-lib.
7. User downloads PDF.

## 6) Model Abstractions & Prompts

Implement a ModelClient with pluggable backends. Start with Google AI Gemini endpoints (env-gated). Provide a local MockModelClient for dev.

### 6.1 Text (Gemini 2.5)
Purpose: Generate a concise, occasion-appropriate greeting (headline + one-liner).

Request shape:
```typescript
type TextGenInput = {
  occasion: string;         // "Birthday", "Graduation", etc.
  recipientName: string;    // "Agnes"
  style: "cartoonish" | "futuristic" | "old_days";
  tone?: "warm" | "playful" | "formal" | "romantic" | "friendly"; // default warm
  extraContext?: string;    // optional notes from user
  language?: string;        // default "en"
  maxChars?: number;        // default 220
}
```

System prompt (template):
```
You are a concise greeting-card copywriter.
Write in <LANG>, upbeat and human, without clichés.
Output JSON with keys: headline, line.

Constraints:
- total length under <MAX_CHARS> characters
- include recipient's name exactly once in headline or line
- match tone: <TONE>
- match visual style cue: <STYLE_CUE> (affects word choice subtly)
- avoid sensitive topics, no personal data beyond input
```

User prompt (template):
```
Occasion: <OCCASION>
Recipient: <NAME>
Tone: <TONE> (default: warm)
Style cue: <STYLE_CUE>  // "cartoonish", "futuristic", or "vintage"
Extra context: <EXTRA_CONTEXT_OR_EMPTY>
```

Expected JSON response:
```json
{
  "headline": "Happy Birthday, Agnes!",
  "line": "Wishing you bright laughter, sweet cake, and a year full of little miracles."
}
```

### 6.2 Image (Gemini-2.5-flash-image-preview / "NanoBanana")

Modes:
- T2I Background: produce a background + frame elements matching style
- I2I Stylisation (if supported): stylise the user's photo to blend with theme
- Compose Fallback: server composites original photo over generated background with style-consistent frame

Request shape:
```typescript
type ImageGenInput = {
  style: "cartoonish" | "futuristic" | "old_days";
  occasion: string;               // influences motifs (balloons, stars, laurels, etc.)
  preferredPalette?: string[];    // optional hex values
  includeTextArea?: boolean;      // reserve negative space for text? default true
  userPhoto?: { bytes: Buffer; mime: string } | null; // processed only with consent
  outputSize?: { w: number; h: number }; // default 2048x1536
}
```

Prompt template (background T2I):
```
Create a single-page greeting card COVER background for <OCCASION>.
Style: <STYLE> (cartoonish | futuristic | vintage-old-days).
Design cues:
- clear focal area reserved for text (negative space), avoid busy patterns there
- subtle motifs for occasion (e.g., balloons for birthday, laurel for graduation)
- cohesive palette, printable values, avoid neon clipping
- clean edges at safe margins for PDF trim (3mm bleed if possible)
No text. No watermarks.
Output: high-resolution PNG suitable for print.
```

Prompt template (I2I stylisation, if available):
```
Take the provided portrait photo and stylise it to match <STYLE> for a greeting card:
- Preserve facial likeness and skin tones
- Apply <STYLE>-consistent linework/texture (cartoonish|futuristic|vintage)
- Gentle background separation (soft vignette or halo), no text
Return a PNG with transparent background if possible; else a clean solid background.
```

Server-side compose fallback (if I2I not supported or fails):
1. Generate background (T2I).
2. Detect face bounding box (lightweight on client or server; or skip for v1 and rely on user cropping).
3. Place user photo centered with rounded frame, drop shadow, style-consistent border.

## 7) UI / UX Specs

### 7.1 Screens & Components

**Header:** app name "Greetingsmith", minimal nav

**CardForm:**
- Occasion (select + free text)
- Recipient name (text)
- Tone (dropdown: warm, playful, formal, romantic, friendly)
- Photo upload (drag-drop, preview, replace/remove)
- Style picker (3 cards with previews)
- Consent toggle: "Allow sending my photo to the image model" (default off)
- Generate button (loading state + progress)

**PreviewPane:**
- Shows generated background + (stylised or original) photo
- Greeting text: headline (H2) + one-liner below; inline editable
- Regenerate buttons: "Regenerate Text", "Regenerate Image"
- Size selector for export: A5 (default), A4
- "Unlock & Download (DKK 25)" button (replaces free download)

**Toasts** for errors/retries

**Footer:** privacy note + model attributions + payment terms

### 7.2 Layout & Design Guidelines
- Tailwind + shadcn/ui; rounded-2xl, soft shadows
- Maintain safe area for text (don't overlap busy motifs)
- Text baseline grid (headline ~28–36px; line ~16–18px)
- Accessibility: colour contrast ≥ WCAG AA for text area

## 8) File/Folder Structure
```
/app
  /api
    generate-text/route.ts
    generate-image/route.ts
    /pay
      checkout/route.ts
      verify/route.ts
    /stripe
      webhook/route.ts
    export-pdf/route.ts
  /components
    CardForm.tsx
    StyleSelector.tsx
    ImagePreview.tsx
    GreetingEditor.tsx
    PdfDownloadButton.tsx
    PayButton.tsx
    UploadDropzone.tsx
  page.tsx
  thanks/page.tsx
  cancelled/page.tsx
/lib
  models/textClient.ts
  models/imageClient.ts
  models/mockClient.ts
  pdf/buildPdf.ts
  prompts/textPrompts.ts
  prompts/imagePrompts.ts
  compose/canvasCompose.ts  // client-side composition helpers
  payments/stripe.ts
  auth/unlockToken.ts
/types
  index.d.ts
/public
  styles-previews/*.png
.env.local.example
```

## 9) API Route Contracts (Next.js)

### POST /api/generate-text
Body:
```json
{
  "occasion":"Birthday",
  "recipientName":"Agnes",
  "style":"old_days",
  "tone":"warm",
  "extraContext":"",
  "language":"en",
  "maxChars":220
}
```

Response:
```json
{
  "candidates":[
    {"headline":"Happy Birthday, Agnes!","line":"Wishing you gentle memories and new adventures ahead."}
  ]
}
```

### POST /api/generate-image
Body (multipart/form-data):
- meta (JSON): { style, occasion, includeTextArea, outputSize }
- photo (file) optional

Response:
```json
{
  "imagePngBase64": "iVBORw0KGgoAAA...",
  "mode": "t2i" | "i2i" | "compose_fallback"
}
```

## 10) PDF Export (client)
- Use pdf-lib to create A5/A4 canvas (portrait)
- Place background image to bleed (add 3mm optional bleed)
- Place photo layer (if separate) with vector frame
- Add headline + line in text area (embed font)
- Output filename: greeting-<occasion>-<name>.pdf

## 11) Privacy, Safety & Compliance
- Default do not send user photo to external APIs. Require explicit toggle.
- If toggle is off: only background T2I; compose original photo locally.
- If toggle is on: include photo in /api/generate-image call for I2I.
- Do not store images server-side; process in memory; return Base64/ArrayBuffer.
- Enforce max file size & type checks.
- Content policy: reject violent/sexual/harassment themes.
- Add a simple phrase filter before text rendering (swear words, slurs), with user-friendly error message.
- Log minimal telemetry (counts only) and only if user opts-in.

## 12) Configuration & Environment
`.env.local.example`:
```
GOOGLE_GEMINI_API_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_PRICE_ID_CARD=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:3000/thanks?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:3000/cancelled
CURRENCY=DKK
UNLOCK_JWT_SECRET=superlongrandomstring
UNLOCK_JWT_TTL_SECONDS=900

# Feature flags
FEATURE_IMAGE_I2I=true
FEATURE_LOCAL_COMPOSE_FALLBACK=true
MAX_UPLOAD_MB=10
```

## 13) Payments — Stripe Integration

### 13.1 Pricing Model (v1)
- Pay-per-card: DKK 25.00
- 1 unlock = 1 hi-res export (A5 or A4)
- Free watermarked preview before payment (low-res and/or banner)

### 13.2 User Flow
1. User fills the form → generates preview (free, watermarked or low-res)
2. Click "Unlock & Download" → server creates Stripe Checkout Session
3. After successful payment, Stripe redirects back to /thanks?session_id=...
4. Client calls /api/pay/verify?session_id=... → server verifies paid session and returns unlock token (JWT)
5. Client uses token to call /api/export-pdf → server returns hi-res PDF

### 13.3 Backend Endpoints

#### POST /api/pay/checkout
Creates a Checkout Session for a single unlock.

Request:
```json
{ "variant": "single_card" }
```

Response:
```json
{ "checkoutUrl": "https://checkout.stripe.com/c/session_..." }
```

#### GET /api/pay/verify?session_id=...
Verifies payment, returns a short-lived unlock token (JWT).

Response:
```json
{ "ok": true, "unlockToken": "<jwt>" }
```

#### POST /api/export-pdf
Requires a valid unlockToken; returns the final hi-res PDF.

Request:
```json
{
  "unlockToken": "<jwt>",
  "card": {
    "occasion":"Birthday",
    "recipientName":"Agnes",
    "style":"old_days",
    "headline":"Happy Birthday, Agnes!",
    "line":"Wishing you gentle memories and new adventures ahead.",
    "imagePngBase64":"iVBORw0KGgoAAA..."
  },
  "size":"A5"
}
```

### 13.4 Security & Compliance
- Do not store card data; Stripe handles it
- Keep API keys server-side only
- Sanitize/validate session_id input
- Sign/verify JWT strictly; keep TTL short
- Enable Stripe Tax for automatic VAT/MOMS collection

## 14) Implementation Plan (Tasks for Claude Code)

### Bootstrap app
- Create Next.js 15 + TypeScript + Tailwind + shadcn/ui project
- Add pdf-lib and Stripe dependencies

### Types & prompts
- Define TextGenInput, ImageGenInput, response DTOs
- Create lib/prompts/textPrompts.ts and imagePrompts.ts

### Model clients
- textClient.ts for Gemini 2.5 text
- imageClient.ts for Gemini-2.5-flash-image-preview (T2I + optional I2I)
- mockClient.ts for local dev (returns stock images / canned text)

### API routes
- /api/generate-text → validate input, call textClient, return candidates
- /api/generate-image → parse multipart, enforce consent rules, call imageClient
- Payment routes: /api/pay/checkout, /api/pay/verify, /api/export-pdf
- Optional: /api/stripe/webhook

### UI components
- UploadDropzone with file type/size validation
- StyleSelector (3 cards with small preview images)
- CardForm (occasion select + free text, name, tone, consent toggle, generate)
- ImagePreview (shows generated cover)
- GreetingEditor (inline edit headline/line)
- PayButton (Stripe Checkout integration)
- Success/cancelled pages

### Canvas composition
- compose/canvasCompose.ts: helper to layer background + (photo) + text guides for preview

### PDF generation
- lib/pdf/buildPdf.ts: A5/A4 with optional bleed, font embed, image scaling, text layout

### Payment integration
- Stripe client setup
- JWT token management for unlocks
- Webhook handling (optional but recommended)

### State management
- Keep local in component state; add Zustand if complexity grows

### Error handling
- Toasts for timeouts, model errors; retry controls
- Payment error handling

### QA & polish
- Validate colour profiles, ensure crisp text in PDF
- Lighthouse pass; basic a11y checks
- Add simple E2E smoke test (Playwright) for happy path

## 15) Prompt & Style Mappings

### Style → Visual Guidance
- **cartoonish:** soft outlines, pastel palette, playful shapes, confetti/balloons for birthdays
- **futuristic:** clean gradients, holographic hints, geometric motifs, subtle glow
- **old_days (vintage):** paper texture, sepia/duotone palette, classic ornaments, film grain lite

### Style → Text Tone Bias
- **cartoonish** → playful, lively verbs, light rhyme allowed
- **futuristic** → optimistic, sleek, concise, minimal adjectives
- **old_days** → warm, nostalgic, gentle metaphors, no archaic spelling

## 16) Testing Checklist
- [ ] Generate card with and without photo
- [ ] Consent off → photo never leaves browser; verify network tab
- [ ] All three styles look distinct and printable (no neon clipping)
- [ ] Greeting text under maxChars, contains recipient name once
- [ ] PDF renders crisp on Mac Preview and Adobe Reader
- [ ] Error cases: model timeout, bad file type, oversized image
- [ ] Fallback compose path verified
- [ ] Payment flow: checkout → success → unlock → download
- [ ] Payment error handling: expired sessions, failed payments

## 17) Future Enhancements
- Inside message (page 2) + multiple layouts
- Multi-language support (da, fr, es…)
- Stickers/overlays, confetti animation
- User accounts, save to library
- Print service integration
- Credit packs and subscription models

## 18) Developer Notes
- Keep pure functions for prompt assembly (easy to unit test)
- Avoid server storage by default; if needed later, use signed URLs to S3/GCS with short TTL
- For best print results, render card image at 300 DPI relative to target size (A5: 1748×2480 px inc. bleed); downscale in preview as needed
- If the image model can return transparent PNG layers, prefer that for compositing; otherwise use server-side simple matting or a masked frame
- Use Stripe Test Mode during development with test card: 4242 4242 4242 4242

## Done = You can:
- Fill the form, upload a photo, choose a style, hit Generate, see a styled cover + greeting
- Edit the greeting text inline
- Pay via Stripe Checkout for unlock
- Download a crisp, single-page PDF (A5/A4) after payment verification