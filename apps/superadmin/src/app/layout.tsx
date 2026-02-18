import type { Metadata } from "next";
import { AuthWrapper } from "@/components/AuthWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Superadmin",
  description: "Superadmin dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}
