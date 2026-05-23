import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";

interface RegisterRequestBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 8;

const getRegisterBody = async (
  request: NextRequest,
): Promise<RegisterRequestBody | null> => {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return null;
    }

    return body as RegisterRequestBody;
  } catch {
    return null;
  }
};

const isDuplicateKeyError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  return error.code === 11000;
};

export const POST = async (request: NextRequest) => {
  const body = await getRegisterBody(request);

  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required." },
      { status: 400 },
    );
  }

  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  if (password.length < minimumPasswordLength) {
    return NextResponse.json(
      { error: "Password must contain at least 8 characters." },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const existingUser = await UserModel.exists({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: "User registered successfully." },
      { status: 201 },
    );
  } catch (error) {
  console.error("REGISTER ERROR:", error);

  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Unable to register user.",
    },
    { status: 500 },
  );
}
};
