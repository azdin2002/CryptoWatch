import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Types } from "mongoose";

import { DashboardLayout as DashboardShell } from "@/components/layout/DashboardLayout";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;

  if (!userId || !Types.ObjectId.isValid(userId)) {
    redirect("/login");
  }

  await connectDB();
  const user = await UserModel.findById(userId).select("name email").exec();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      user={{
        name: user.name,
        email: user.email,
      }}
    >
      {children}
    </DashboardShell>
  );
}
