import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";
import type { ApiResponse, ProfileRecord } from "@/types";

interface ProfilePatchBody {
  name?: unknown;
  password?: unknown;
}

const MIN_PASSWORD_LENGTH = 8;

const jsonResponse = <T>(
  data: T | null,
  status: number,
  error: string | null = null,
): NextResponse<ApiResponse<T>> =>
  NextResponse.json(
    {
      data,
      error,
    },
    { status },
  );

const getAuthenticatedUserId = async (): Promise<string | null> => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;

  if (!userId || !Types.ObjectId.isValid(userId)) {
    return null;
  }

  return userId;
};

const parseRequestBody = async (
  request: NextRequest,
): Promise<ProfilePatchBody | null> => {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return null;
    }

    return body as ProfilePatchBody;
  } catch {
    return null;
  }
};

const serializeProfile = (user: {
  name: string;
  email: string;
}): ProfileRecord => ({
  name: user.name,
  email: user.email,
});

export const GET = async (): Promise<
  NextResponse<ApiResponse<ProfileRecord | null>>
> => {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonResponse(null, 401, "Authentication required.");
  }

  try {
    await connectDB();
    const user = await UserModel.findById(userId).select("name email").exec();

    if (!user) {
      return jsonResponse(null, 404, "Profile not found.");
    }

    return jsonResponse(serializeProfile(user), 200);
  } catch (error) {
    return jsonResponse(
      null,
      500,
      error instanceof Error ? error.message : "Unable to load profile.",
    );
  }
};

export const PATCH = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<ProfileRecord | null>>> => {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonResponse(null, 401, "Authentication required.");
  }

  const body = await parseRequestBody(request);

  if (!body || typeof body.name !== "string") {
    return jsonResponse(null, 400, "Name is required.");
  }

  const name = body.name.trim();

  if (!name) {
    return jsonResponse(null, 400, "Name cannot be empty.");
  }

  if (
    body.password !== undefined &&
    body.password !== null &&
    typeof body.password !== "string"
  ) {
    return jsonResponse(null, 400, "Password must be a string.");
  }

  const password = typeof body.password === "string" ? body.password : null;
  const hasPasswordUpdate = password !== null && password.length > 0;

  if (hasPasswordUpdate && password.length < MIN_PASSWORD_LENGTH) {
    return jsonResponse(
      null,
      400,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  try {
    await connectDB();
    const user = await UserModel.findById(userId).exec();

    if (!user) {
      return jsonResponse(null, 404, "Profile not found.");
    }

    user.name = name;

    if (hasPasswordUpdate) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return jsonResponse(serializeProfile(user), 200);
  } catch (error) {
    return jsonResponse(
      null,
      500,
      error instanceof Error ? error.message : "Unable to update profile.",
    );
  }
};
