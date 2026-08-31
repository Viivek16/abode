import { Fraunces, Sora } from "next/font/google";

// Fraunces (display): a soft, high-end serif for the hero figures and headings.
// Optical-size aware, with tabular figures so counting numbers stay aligned.
export const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Sora (body): every label, value, button, and piece of readable text.
export const body = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});
