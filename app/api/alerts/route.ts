import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import AlertModel, { AlertDocument } from "@/models/Alert";
import type {
  AlertCondition,
  AlertData,
  AlertRecord,
  ApiResponse,
} from "@/types";

interface AlertRequestBody {
  cryptoId?: unknown;
  cryptoSymbol?: unknown;
  cryptoName?: unknown;
  targetPrice?: unknown;
  condition?: unknown;
}

interface DeleteAlertResponse {
  id: string;
}

interface MongoDuplicateKeyError extends Error {
  code?: number;
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
): Promise<AlertRequestBody | null> => {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return null;
    }

    return body as AlertRequestBody;
  } catch {
    return null;
  }
};

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized ? normalized : null;
};

const normalizeCryptoId = (value: unknown): string | null => {
  const normalized = normalizeText(value)?.toLowerCase();

  if (!normalized || !cryptoIdPattern.test(normalized)) {
    return null;
  }

  return normalized;
};

const normalizeCondition = (value: unknown): AlertCondition | null => {
  if (value === "above" || value === "below") {
    return value;
  }

  return null;
};

const normalizeTargetPrice = (value: unknown): number | null => {
  const price = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  return price;
};

const validateAlertBody = (body: AlertRequestBody | null): AlertData | null => {
  if (!body) {
    return null;
  }

  const cryptoId = normalizeCryptoId(body.cryptoId);
  const cryptoSymbol = normalizeText(body.cryptoSymbol)?.toUpperCase() ?? null;
  const cryptoName = normalizeText(body.cryptoName);
  const targetPrice = normalizeTargetPrice(body.targetPrice);
  const condition = normalizeCondition(body.condition);

  if (!cryptoId || !cryptoSymbol || !cryptoName || !targetPrice || !condition) {
    return null;
  }

  return {
    cryptoId,
    cryptoSymbol,
    cryptoName,
    targetPrice,
    condition,
  };
};

const getDocumentId = (document: { _id: unknown }): string =>
  document._id instanceof Types.ObjectId
    ? document._id.toString()
    : String(document._id);

const serializeAlert = (alert: AlertDocument): AlertRecord => ({
  id: getDocumentId(alert),
  userId: alert.userId.toString(),
  cryptoId: alert.cryptoId,
  cryptoSymbol: alert.cryptoSymbol,
  cryptoName: alert.cryptoName,
  targetPrice: alert.targetPrice,
  condition: alert.condition,
  active: alert.active,
  triggeredAt: alert.triggeredAt ? alert.triggeredAt.toISOString() : null,
  createdAt: alert.createdAt.toISOString(),
});

const isDuplicateKeyError = (
  error: unknown,
): error is MongoDuplicateKeyError =>
  error instanceof Error &&
  "code" in error &&
  (error as MongoDuplicateKeyError).code === 11000;

const handleError = (error: unknown): NextResponse<ApiResponse<null>> => {
  if (isDuplicateKeyError(error)) {
    return jsonResponse(null, 409, "This active alert already exists.");
  }

  return jsonResponse(
    null,
    500,
    error instanceof Error ? error.message : "Unable to process alerts.",
  );
};

export const GET = async (): Promise<
  NextResponse<ApiResponse<AlertRecord[] | null>>
> => {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonResponse(null, 401, "Authentication required.");
  }

  try {
    await connectDB();
    const alerts = await AlertModel.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .exec();

    return jsonResponse(alerts.map(serializeAlert), 200);
  } catch (error) {
    return handleError(error);
  }
};

export const POST = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<AlertRecord | null>>> => {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonResponse(null, 401, "Authentication required.");
  }

  const alertData = validateAlertBody(await parseRequestBody(request));

  if (!alertData) {
    return jsonResponse(
      null,
      400,
      "cryptoId, cryptoSymbol, cryptoName, positive targetPrice, and condition are required.",
    );
  }

  try {
    await connectDB();
    const duplicateAlert = await AlertModel.findOne({
      userId: new Types.ObjectId(userId),
      cryptoId: alertData.cryptoId,
      condition: alertData.condition,
      targetPrice: alertData.targetPrice,
      active: true,
    }).exec();

    if (duplicateAlert) {
      return jsonResponse(null, 409, "This active alert already exists.");
    }

    const alert = await AlertModel.create({
      ...alertData,
      userId: new Types.ObjectId(userId),
    });

    return jsonResponse(serializeAlert(alert), 201);
  } catch (error) {
    return handleError(error);
  }
};

export const DELETE = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<DeleteAlertResponse | null>>> => {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonResponse(null, 401, "Authentication required.");
  }

  const alertId = request.nextUrl.searchParams.get("id");

  if (!alertId || !Types.ObjectId.isValid(alertId)) {
    return jsonResponse(null, 400, "A valid alert id is required.");
  }

  try {
    await connectDB();
    const result = await AlertModel.deleteOne({
      _id: new Types.ObjectId(alertId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (result.deletedCount === 0) {
      return jsonResponse(null, 404, "Alert not found.");
    }

    return jsonResponse({ id: alertId }, 200);
  } catch (error) {
    return handleError(error);
  }
};
