import { getImageConfig, getS3Config } from "./env";
import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

type GeneratedImage = {
  buffer: Buffer;
  contentType: string;
};

async function generateWithGeminiModel(
  prompt: string,
  model: string
): Promise<GeneratedImage> {
  const { apiKey, apiBase } = getImageConfig();
  if (!apiKey) {
    throw new Error("IMAGE_API_KEY is not set");
  }

  const normalizedModel = model.startsWith("models/") ? model : `models/${model}`;
  const safePrompt = typeof prompt === "string" ? prompt : JSON.stringify(prompt);
  console.log(`[images] gemini request model=${normalizedModel} endpoint=generateContent`);
  const response = await fetch(
    `${apiBase}/${normalizedModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: safePrompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.log(`[images] gemini error status=${response.status} body=${text}`);
    throw new Error(text || "Gemini image generation failed");
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string; mimeType?: string };
          inline_data?: { data?: string; mimeType?: string };
          text?: string;
        }>;
      };
    }>;
  };

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data || part.inline_data?.data);
  const inlineData = imagePart?.inlineData ?? imagePart?.inline_data;
  if (!inlineData?.data) {
    console.log("[images] gemini response missing inlineData", {
      hasCandidates: Boolean(data.candidates?.length),
      partsCount: parts.length
    });
    throw new Error("Gemini response has no image data");
  }

  return {
    buffer: Buffer.from(inlineData.data, "base64"),
    contentType: inlineData.mimeType ?? "image/png"
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
  const { provider, model, fallbackModel } = getImageConfig();
  console.log(`[images] generate provider=${provider}, promptType=${typeof prompt}`);
  if (provider === "openai") {
    return generateWithOpenAI(prompt);
  }
  try {
    return await generateWithGeminiModel(prompt, model);
  } catch (error) {
    console.log("[images] primary model failed, trying fallback", error);
    return generateWithGeminiModel(prompt, fallbackModel);
  }
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

/**
 * Upload a single image for a case.
 */
export async function uploadCaseImage(
  buffer: Buffer,
  filename: string,
  contentType: string,
  caseId: string
) {
  const { endpoint, region, bucket, accessKeyId, secretAccessKey, publicBaseUrl } =
    getS3Config();
  const s3 = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey }
  });

  const ext = resolveImageExtension(filename, contentType);
  const id = randomUUID();
  const key = `cases/${caseId}/${id}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read"
    })
  );

  const baseUrl = publicBaseUrl || `${endpoint.replace(/\/$/, "")}/${bucket}`;
  return `${baseUrl}/${key}`;
}

/**
 * Upload a case cover image and return the public URL.
 */
export async function uploadCaseCover(
  buffer: Buffer,
  filename: string,
  contentType: string,
  caseId: string
) {
  const { endpoint, region, bucket, accessKeyId, secretAccessKey, publicBaseUrl } =
    getS3Config();
  const s3 = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey }
  });

  const ext = resolveImageExtension(filename, contentType);
  const key = `cases/${caseId}/cover.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read"
    })
  );

  const baseUrl = publicBaseUrl || `${endpoint.replace(/\/$/, "")}/${bucket}`;
  return `${baseUrl}/${key}`;
}

function resolveImageExtension(filename: string, contentType: string) {
  const parts = filename.split(".");
  const fromName = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  if (fromName && ["jpg", "jpeg", "png", "webp", "avif", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/avif") return "avif";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}
