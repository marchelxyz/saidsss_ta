import { getScreenshotConfig } from "./env";
import puppeteer from "puppeteer";

type PageSpeedResponse = {
  lighthouseResult?: {
    audits?: {
      "final-screenshot"?: {
        details?: { data?: string };
      };
    };
  };
};

export async function captureScreenshot(url: string) {
  const { apiKey, provider, timeoutMs } = getScreenshotConfig();
  if (provider === "pagespeed") {
    try {
      return await captureWithPageSpeed(url, apiKey);
    } catch {
      return null;
    }
  }
  try {
    return await captureWithPuppeteer(url, timeoutMs);
  } catch {
    return null;
  }
}

async function captureWithPageSpeed(url: string, apiKey: string) {
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("screenshot", "true");
  if (apiKey) {
    apiUrl.searchParams.set("key", apiKey);
  }

  const response = await fetch(apiUrl.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "PageSpeed screenshot failed");
  }

  const data = (await response.json()) as PageSpeedResponse;
  const screenshotData =
    data.lighthouseResult?.audits?.["final-screenshot"]?.details?.data;

  if (!screenshotData) {
    throw new Error("PageSpeed screenshot data not found");
  }

  const base64 = screenshotData.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
}

async function captureWithPuppeteer(url: string, timeoutMs: number) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: timeoutMs });
    await page.waitForTimeout(750);
    const buffer = (await page.screenshot({ type: "png" })) as Buffer;
    return buffer;
  } finally {
    await browser.close();
  }
}
