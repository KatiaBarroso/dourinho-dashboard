import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AwakeGate from "@/components/AwakeGate";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guardiões do Rio — Dashboard",
  description: "Dashboard do quiz Guardiões do Rio: missão sustentabilidade",
  icons: { icon: "/Icon-512.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AwakeGate>{children}</AwakeGate>
      </body>
    </html>
  );
}
