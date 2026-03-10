import type { Metadata } from "next";
import "./globals.css";
import { SocketProvider } from "@/components/SocketProvider";
import StarryBackground from "@/components/StarryBackground";

export const metadata: Metadata = {
  title: "ChatChat | Vanish in the Void",
  description: "Anonymous real-time messaging. No signup. No history. Just chat.",
  manifest: "/manifest.json",
  themeColor: "#ff2a6d",
  appleWebApp: {
    capable: true,
    title: "ChatChat",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#080411] text-foreground-light relative">
        <StarryBackground />
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
