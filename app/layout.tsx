import type { Metadata } from "next";
import StoreProvider from "./StoreProvider";
import { fontPrimary } from "@/config/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Al-Aqd Admin Dashboard",
  description: "Administrative dashboard for Al-Aqd platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontPrimary.variable} antialiased font-sans`}
        suppressHydrationWarning={true}
      >
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
