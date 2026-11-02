import type { Metadata } from "next";
import { Manrope, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import "./redesign.css";
import "./design-system.css";
import "./landing.css";
import "./public-form.css";
import "./theme.css";
import "./field-editor.css";
import { Providers } from "@/components/providers/Providers";

const geistSans = Manrope({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Formora — Start with a sentence. Ship a form.",
  description: "Describe what you need to ask. Formora drafts the questions, you refine every field, then publish one link and chart the answers in one workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('form-ai-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){var d=matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}` }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
