import { getImageConfig, getS3Config } from "./env";
import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

type GeneratedImage = {
  buffer: Buffer;
  contentType: string;
};

async function generateWithGemini(prompt: string): Promise<GeneratedImage> {
  const { apiKey, apiBase, model } = getImageConfig();
  if (!apiKey) {
    throw new Error("IMAGE_API_KEY is not set");
  }

  const normalizedModel = model.startsWith("models/") ? model : `models/${model}`;
  const safePrompt = typeof prompt === "string" ? prompt : JSON.stringify(prompt);
  console.log(`[images] gemini request model=${normalizedModel} endpoint=generateImages`);
  const response = await fetch(
    `${apiBase}/${normalizedModel}:generateImages?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: { text: safePrompt },
        imageGenerationConfig: {
          outputMimeType: "image/png"
        }
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.log(`[images] gemini error status=${response.status} body=${text}`);
    throw new Error(text || "Gemini image generation failed");
  }

  const data = (await response.json()) as {
    generatedImages?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  };

  const image = data.generatedImages?.[0];
  if (!image?.bytesBase64Encoded) {
    console.log("[images] gemini response missing generatedImages", {
      hasImages: Boolean(data.generatedImages?.length)
    });
    throw new Error("Gemini response has no image data");
  }

  return {
    buffer: Buffer.from(image.bytesBase64Encoded, "base64"),
    contentType: image.mimeType ?? "image/png"
  };
}

async function generateWithOpenAI(prompt: string): Promise<GeneratedImage> {
  const { apiKey, apiBase, model } = getImageConfig();
  if (!apiKey) {
    throw new Error("IMAGE_API_KEY is not set");
  }

  const response = await fetch(`${apiBase}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      response_format: "b64_json"
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Image generation failed");
  }

  const data = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
  };

  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image generation returned empty payload");
  }

  return {
    buffer: Buffer.from(b64, "base64"),
    contentType: "image/png"
  };
}

export async function generateImage(prompt: string) {
  const { provider } = getImageConfig();
  console.log(`[images] generate provider=${provider}, promptType=${typeof prompt}`);
  if (provider === "openai") {
    return generateWithOpenAI(prompt);
  }
  return generateWithGemini(prompt);
}

export async function uploadImageVariants(buffer: Buffer) {
  const { endpoint, region, bucket, accessKeyId, secretAccessKey, publicBaseUrl } =
    getS3Config();
  const s3 = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey }
  });

  const id = randomUUID();
  const avif = await sharp(buffer).avif({ quality: 70 }).toBuffer();
  const webp = await sharp(buffer).webp({ quality: 80 }).toBuffer();
  const jpg = await sharp(buffer).jpeg({ quality: 80 }).toBuffer();

  const basePath = `industry/${id}`;
  const uploads = [
    { key: `${basePath}.avif`, body: avif, contentType: "image/avif" },
    { key: `${basePath}.webp`, body: webp, contentType: "image/webp" },
    { key: `${basePath}.jpg`, body: jpg, contentType: "image/jpeg" }
  ];

  for (const file of uploads) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: file.key,
        Body: file.body,
        ContentType: file.contentType,
        ACL: "public-read"
      })
    );
  }

  const baseUrl = publicBaseUrl || `${endpoint.replace(/\/$/, "")}/${bucket}`;
  return {
    avifUrl: `${baseUrl}/${basePath}.avif`,
    webpUrl: `${baseUrl}/${basePath}.webp`,
    jpgUrl: `${baseUrl}/${basePath}.jpg`
  };
}

export async function uploadScreenshotVariants(buffer: Buffer, pageId: string) {
  const { endpoint, region, bucket, accessKeyId, secretAccessKey, publicBaseUrl } =
    getS3Config();
  const s3 = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey }
  });

  const avif = await sharp(buffer).avif({ quality: 60 }).toBuffer();
  const webp = await sharp(buffer).webp({ quality: 75 }).toBuffer();
  const jpg = await sharp(buffer).jpeg({ quality: 75 }).toBuffer();

  const basePath = `screenshots/${pageId}`;
  const uploads = [
    { key: `${basePath}.avif`, body: avif, contentType: "image/avif" },
    { key: `${basePath}.webp`, body: webp, contentType: "image/webp" },
    { key: `${basePath}.jpg`, body: jpg, contentType: "image/jpeg" }
  ];

  for (const file of uploads) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: file.key,
        Body: file.body,
        ContentType: file.contentType,
        ACL: "public-read"
      })
    );
  }

  const baseUrl = publicBaseUrl || `${endpoint.replace(/\/$/, "")}/${bucket}`;
  return {
    avifUrl: `${baseUrl}/${basePath}.avif`,
    webpUrl: `${baseUrl}/${basePath}.webp`,
    jpgUrl: `${baseUrl}/${basePath}.jpg`
  };
}
