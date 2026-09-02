import type { MetadataRoute } from "next";

// Installable web-app metadata: gives Abode its icon + name in the phone app
// drawer / home screen (and standalone launch) when added to the home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Abode",
    short_name: "Abode",
    description: "Your money, at home.",
    start_url: "/",
    display: "standalone",
    background_color: "#14100E",
    theme_color: "#14100E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
