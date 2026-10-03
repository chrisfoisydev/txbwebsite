import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "treXis × BECU — Built together",
  description: "From banking platform to member experience. Explore the source, experience, and platform alignment.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

