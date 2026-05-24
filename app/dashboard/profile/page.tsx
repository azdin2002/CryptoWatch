import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";

export default async function ProfilePage() {
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
    <>
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Account
        </p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
            Keep your account details current and update your sign-in password.
          </p>
        </div>
      </header>

      <ProfileForm
        initialProfile={{
          name: user.name,
          email: user.email,
        }}
      />
    </>
  );
}
