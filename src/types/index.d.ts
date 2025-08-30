export type StyleType = "cartoonish" | "futuristic" | "old_days";
export type ToneType = "warm" | "playful" | "formal" | "romantic" | "friendly";
export type SizeType = "A5" | "A4";

export interface TextGenInput {
  occasion: string;
  recipientName: string;
  style: StyleType;
  tone?: ToneType;
  extraContext?: string;
  language?: string;
  maxChars?: number;
}

export interface TextGenResponse {
  candidates: Array<{
    headline: string;
    line: string;
  }>;
}

export interface ImageGenInput {
  style: StyleType;
  occasion: string;
  preferredPalette?: string[];
  includeTextArea?: boolean;
  userPhoto?: {
    bytes: Buffer;
    mime: string;
  } | null;
  outputSize?: {
    w: number;
    h: number;
  };
}

export interface ImageGenResponse {
  imagePngBase64: string;
  mode: "t2i" | "i2i" | "compose_fallback";
}

export interface CardData {
  occasion: string;
  recipientName: string;
  style: StyleType;
  tone: ToneType;
  headline: string;
  line: string;
  imagePngBase64: string;
  userPhoto?: string;
  hasUserConsent: boolean;
}

export interface PaymentCheckoutRequest {
  variant: "single_card";
}

export interface PaymentCheckoutResponse {
  checkoutUrl: string;
}

export interface PaymentVerifyResponse {
  ok: boolean;
  unlockToken?: string;
  error?: string;
}

export interface PdfExportRequest {
  unlockToken: string;
  card: CardData;
  size: SizeType;
}

export interface UnlockTokenPayload {
  sid: string;
  product: string;
  iat: number;
}

export interface ModelClient {
  generateText(input: TextGenInput): Promise<TextGenResponse>;
  generateImage(input: ImageGenInput): Promise<ImageGenResponse>;
}

export interface UploadedFile {
  file: File;
  preview: string;
  bytes: ArrayBuffer;
}