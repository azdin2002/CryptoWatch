import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import WatchlistModel from "@/models/Watchlist";
import type { ApiResponse } from "@/types";

interface WatchlistData {
  cryptos: string[];
}

interface WatchlistRequestBody {
  cryptoId?: unknown;
}

const cryptoIdPattern = /^[a-z0-9][a-z0-9-]*$/;

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
): Promise<WatchlistRequestBody | null> => {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return null;
    }

    return body as WatchlistRequestBody;
  } catch {
    return null;
  }
};

const normalizeCryptoId = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const cryptoId = value.trim().toLowerCase();

  if (!cryptoIdPattern.test(cryptoId)) {
    return null;
  }

  return cryptoId;
};

const getRequestCryptoId = async (
  request: NextRequest,
): Promise<string | null> => {
  const queryCryptoId = normalizeCryptoId(
    request.nextUrl.searchParams.get("cryptoId"),
  );

  if (queryCryptoId) {
    return queryCryptoId;
  }

  const body = await parseRequestBody(request);
  return normalizeCryptoId(body?.cryptoId);
};

const getWatchlistData = async (userId: string): Promise<WatchlistData> => {
  const watchlist = await WatchlistModel.findByUserId(userId);

  return {
    cryptos: watchlist?.cryptos ?? [],
  };
};

const handleError = (error: unknown): NextResponse<ApiResponse<null>> => {
  return jsonResponse(
    null,
    500,
    error instanceof Error ? error.message : "Unable to process watchlist.",
  );
};

export const GET = async (): Promise<
  NextResponse<ApiResponse<WatchlistData | null>>
> => {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonResponse(null, 401, "Authentication required.");
  }

  try {
    await connectDB();
    const data = await getWatchlistData(userId);

    return jsonResponse(data, 200);
  } catch (error) {
    return handleError(error);
  }
};

export const POST = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<WatchlistData | null>>> => {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonResponse(null, 401, "Authentication required.");
  }

  const cryptoId = await getRequestCryptoId(request);

  if (!cryptoId) {
    return jsonResponse(null, 400, "A valid cryptoId is required.");
  }

  try {
    await connectDB();
    const watchlist = await WatchlistModel.addCrypto(userId, cryptoId);

    return jsonResponse({ cryptos: watchlist.cryptos }, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const DELETE = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<WatchlistData | null>>> => {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonResponse(null, 401, "Authentication required.");
  }

  const cryptoId = await getRequestCryptoId(request);

  if (!cryptoId) {
    return jsonResponse(null, 400, "A valid cryptoId is required.");
  }

  try {
    await connectDB();
    const watchlist = await WatchlistModel.removeCrypto(userId, cryptoId);

    return jsonResponse({ cryptos: watchlist?.cryptos ?? [] }, 200);
  } catch (error) {
    return handleError(error);
  }
};

