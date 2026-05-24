import {
  HydratedDocument,
  Model,
  Schema,
  Types,
  model,
  models,
} from "mongoose";

import type { AlertCondition } from "@/types";

export interface Alert {
  userId: Types.ObjectId;
  cryptoId: string;
  cryptoSymbol: string;
  cryptoName: string;
  targetPrice: number;
  condition: AlertCondition;
  active: boolean;
  triggeredAt: Date | null;
  notificationLockedAt: Date | null;
  createdAt: Date;
}

export type AlertDocument = HydratedDocument<Alert>;

interface AlertModel extends Model<Alert> {
  findActiveByUser(userId: string): Promise<AlertDocument[]>;
  markTriggered(alertId: string): Promise<AlertDocument | null>;
}

const alertSchema = new Schema<Alert, AlertModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cryptoId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    cryptoSymbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    cryptoName: {
      type: String,
      required: true,
      trim: true,
    },
    targetPrice: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number): boolean => Number.isFinite(value) && value > 0,
        message: "Target price must be positive",
      },
    },
    condition: {
      type: String,
      enum: ["above", "below"],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
    notificationLockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

alertSchema.index({ userId: 1, cryptoId: 1, active: 1 });
alertSchema.index({ active: 1, triggeredAt: 1, notificationLockedAt: 1 });
alertSchema.index(
  { userId: 1, cryptoId: 1, condition: 1, targetPrice: 1, active: 1 },
  {
    unique: true,
    partialFilterExpression: { active: true },
  },
);

alertSchema.statics.findActiveByUser = async function findActiveByUser(
  userId: string,
): Promise<AlertDocument[]> {
  return this.find({
    userId: new Types.ObjectId(userId),
    active: true,
  })
    .sort({ createdAt: -1 })
    .exec();
};

alertSchema.statics.markTriggered = async function markTriggered(
  alertId: string,
): Promise<AlertDocument | null> {
  return this.findByIdAndUpdate(
    alertId,
    {
      $set: {
        active: false,
        triggeredAt: new Date(),
        notificationLockedAt: null,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).exec();
};

const AlertModel =
  (models.Alert as AlertModel | undefined) ||
  model<Alert, AlertModel>("Alert", alertSchema);

export default AlertModel;
