import type { Metadata, Viewport } from "next";
import { display, body } from "@/lib/fonts";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abode",
  description: "Private personal finance dashboard.",
};

export const viewport: Viewport = {
  themeColor: "#14100E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
