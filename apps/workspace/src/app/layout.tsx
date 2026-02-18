import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AuthWrapper } from "@/components/AuthWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Workspace",
  description: "Workspace app for CRM users",
};

const COOKIE_NAME = "superadmin_workspace_id";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const wid = cookieStore.get(COOKIE_NAME)?.value;
  const parsed =
    wid != null
      ? (() => {
          const n = parseInt(wid, 10);
          return Number.isInteger(n) && n >= 1 ? n : null;
        })()
      : null;

  return (
    <html lang="en">
      <body>
        <AuthWrapper initialSuperadminWorkspaceId={parsed ?? undefined}>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
