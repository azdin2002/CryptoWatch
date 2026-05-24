import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { getSimplePrices } from "@/lib/coingecko";
import connectDB from "@/lib/mongodb";
import { sendAlertEmail } from "@/lib/mail";
import AlertModel, { AlertDocument } from "@/models/Alert";
import UserModel from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AlertCheckError {
  alertId: string;
  message: string;
}

interface AlertCheckResult {
  checked: number;
  triggered: number;
  emailsSent: number;
  skipped: number;
  duplicatesPrevented: number;
  errors: AlertCheckError[];
}

const MAX_ALERTS_PER_RUN = 50;
const LOCK_TIMEOUT_MS = 10 * 60 * 1_000;

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

const getDocumentId = (document: { _id: unknown }): string =>
  document._id instanceof Types.ObjectId
    ? document._id.toString()
    : String(document._id);

const isAuthorizedCronRequest = (request: NextRequest): boolean => {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const bearerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const headerToken = request.headers.get("x-cron-secret")?.trim();
  const queryToken = request.nextUrl.searchParams.get("secret")?.trim();

  return (
    bearerToken === cronSecret ||
    headerToken === cronSecret ||
    queryToken === cronSecret
  );
};

const shouldTriggerAlert = (
  alert: AlertDocument,
  currentPrice: number,
): boolean => {
  if (alert.condition === "above") {
    return currentPrice >= alert.targetPrice;
  }

  return currentPrice <= alert.targetPrice;
};

const getActiveAlerts = async (): Promise<AlertDocument[]> => {
  const staleLockThreshold = new Date(Date.now() - LOCK_TIMEOUT_MS);

  return AlertModel.find({
    active: true,
    triggeredAt: null,
    $or: [
      { notificationLockedAt: null },
      { notificationLockedAt: { $exists: false } },
      { notificationLockedAt: { $lte: staleLockThreshold } },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(MAX_ALERTS_PER_RUN)
    .exec();
};

const claimAlert = async (
  alert: AlertDocument,
): Promise<AlertDocument | null> => {
  const staleLockThreshold = new Date(Date.now() - LOCK_TIMEOUT_MS);

  return AlertModel.findOneAndUpdate(
    {
      _id: alert._id,
      active: true,
      triggeredAt: null,
      $or: [
        { notificationLockedAt: null },
        { notificationLockedAt: { $exists: false } },
        { notificationLockedAt: { $lte: staleLockThreshold } },
      ],
    },
    {
      $set: {
        notificationLockedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).exec();
};

const releaseAlertClaim = async (alert: AlertDocument): Promise<void> => {
  await AlertModel.updateOne(
    {
      _id: alert._id,
      active: true,
    },
    {
      $set: {
        notificationLockedAt: null,
      },
    },
  ).exec();
};

const getRecipientEmails = async (
  alerts: AlertDocument[],
): Promise<Map<string, string>> => {
  const userIds = Array.from(
    new Set(alerts.map((alert) => alert.userId.toString())),
  ).map((userId) => new Types.ObjectId(userId));

  const users = await UserModel.find({
    _id: {
      $in: userIds,
    },
  })
    .select("email")
    .exec();

  return new Map(
    users.map((user) => [getDocumentId(user), user.email] as const),
  );
};

export const GET = async (
  request: NextRequest,
): Promise<NextResponse<ApiResponse<AlertCheckResult | null>>> => {
  if (!process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    console.error("[alerts/check] CRON_SECRET is required in production.");
    return jsonResponse(null, 503, "Alert checks are not configured securely.");
  }

  if (!isAuthorizedCronRequest(request)) {
    console.warn("[alerts/check] Unauthorized cron execution attempt.");
    return jsonResponse(null, 401, "Unauthorized alert check request.");
  }

  const result: AlertCheckResult = {
    checked: 0,
    triggered: 0,
    emailsSent: 0,
    skipped: 0,
    duplicatesPrevented: 0,
    errors: [],
  };

  try {
    await connectDB();
    const alerts = await getActiveAlerts();
    result.checked = alerts.length;

    if (alerts.length === 0) {
      console.info("[alerts/check] No active alerts to process.");
      return jsonResponse(result, 200);
    }

    const cryptoIds = Array.from(
      new Set(alerts.map((alert) => alert.cryptoId)),
    );
    const [prices, recipientEmails] = await Promise.all([
      getSimplePrices(cryptoIds, {
        cache: "no-store",
        retries: 1,
        timeoutMs: 10_000,
      }),
      getRecipientEmails(alerts),
    ]);

    for (const alert of alerts) {
      const currentPrice = prices[alert.cryptoId]?.usd;

      if (typeof currentPrice !== "number" || !Number.isFinite(currentPrice)) {
        result.skipped += 1;
        continue;
      }

      if (!shouldTriggerAlert(alert, currentPrice)) {
        result.skipped += 1;
        continue;
      }

      const recipientEmail = recipientEmails.get(alert.userId.toString());

      if (!recipientEmail) {
        result.skipped += 1;
        result.errors.push({
          alertId: getDocumentId(alert),
          message: "Alert owner email was not found.",
        });
        continue;
      }

      const claimedAlert = await claimAlert(alert);

      if (!claimedAlert) {
        result.duplicatesPrevented += 1;
        continue;
      }

      const triggeredAt = new Date();
      result.triggered += 1;

      try {
        const email = await sendAlertEmail({
          recipientEmail,
          cryptoName: claimedAlert.cryptoName,
          cryptoSymbol: claimedAlert.cryptoSymbol,
          currentPrice,
          targetPrice: claimedAlert.targetPrice,
          condition: claimedAlert.condition,
          triggeredAt,
        });

        await AlertModel.markTriggered(getDocumentId(claimedAlert));
        result.emailsSent += 1;
        console.info(
          `[alerts/check] Email sent for alert ${getDocumentId(
            claimedAlert,
          )}: ${email.messageId}`,
        );
      } catch (emailError) {
        await releaseAlertClaim(claimedAlert);
        result.errors.push({
          alertId: getDocumentId(claimedAlert),
          message:
            emailError instanceof Error
              ? emailError.message
              : "Unable to send alert email.",
        });
      }
    }

    console.info(
      `[alerts/check] checked=${result.checked} triggered=${result.triggered} emailsSent=${result.emailsSent} skipped=${result.skipped} duplicatesPrevented=${result.duplicatesPrevented} errors=${result.errors.length}`,
    );

    return jsonResponse(result, 200);
  } catch (error) {
    console.error("[alerts/check] Alert check failed.", error);
    return jsonResponse(
      null,
      500,
      error instanceof Error ? error.message : "Unable to check alerts.",
    );
  }
};
