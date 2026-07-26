import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gambl-roulette.fantomzone.app"),
  title: "Gambl Roulette | FantomZone",
  description: "A polished European roulette experience built for desktop and mobile play.",
  applicationName: "Gambl Roulette",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Gambl Roulette",
    description: "Fortune favors the bold. Take your seat at the FantomZone table.",
    type: "website",
    images: [{ url: "/og.png", width: 1674, height: 940, alt: "Gambl Roulette — Fortune favors the bold" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gambl Roulette",
    description: "A premium European roulette game for desktop and mobile.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
