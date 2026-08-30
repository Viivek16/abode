import { Gabarito, Sora } from "next/font/google";

// Gabarito (display): large numbers, primary buttons, big headings only.
export const display = Gabarito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-gabarito",
  display: "swap",
});

// Sora (body): every label, list, value, and piece of readable text.
export const body = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});
