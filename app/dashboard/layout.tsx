import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardLayout as DashboardShell } from "@/components/layout/DashboardLayout";
import { authOptions } from "@/lib/auth";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId) {
    redirect("/login");
  }

  return (
    <DashboardShell
      user={{
        name: session.user.name ?? "User",
        email: session.user.email,
      }}
    >
      {children}
    </DashboardShell>
  );
}
