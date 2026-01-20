import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "TeleAgent — трансформация бизнеса с AI",
  description:
    "TeleAgent помогает находить процессы для замены AI и автоматизацией: аудит отделов, внедрение и обучение команд.",
  metadataBase: new URL("https://teleagent.ai"),
  openGraph: {
    title: "TeleAgent — трансформация бизнеса с AI",
    description:
      "Аудит отделов, внедрение AI и автоматизаций под ключ, обучение команд.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
