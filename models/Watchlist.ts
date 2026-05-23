import { Document, Model, Schema, Types, model, models } from "mongoose";

export interface Watchlist {
  userId: Types.ObjectId;
  cryptos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistDocument extends Watchlist, Document {}

interface WatchlistModel extends Model<WatchlistDocument> {
  findByUserId(userId: string): Promise<WatchlistDocument | null>;
  addCrypto(userId: string, cryptoId: string): Promise<WatchlistDocument>;
  removeCrypto(userId: string, cryptoId: string): Promise<WatchlistDocument | null>;
}

const watchlistSchema = new Schema<WatchlistDocument, WatchlistModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    cryptos: {
      type: [String],
      default: [],
      validate: {
        validator(cryptos: string[]): boolean {
          return new Set(cryptos).size === cryptos.length;
        },
        message: "Watchlist cannot contain duplicate crypto IDs.",
      },
    },
  },
  {
    timestamps: true,
  },
);

watchlistSchema.statics.findByUserId = async function findByUserId(
  userId: string,
): Promise<WatchlistDocument | null> {
  return this.findOne({ userId }).exec();
};

watchlistSchema.statics.addCrypto = async function addCrypto(
  userId: string,
  cryptoId: string,
): Promise<WatchlistDocument> {
  return this.findOneAndUpdate(
    { userId },
    {
      $addToSet: { cryptos: cryptoId },
      $set: { updatedAt: new Date() },
      $setOnInsert: { userId: new Types.ObjectId(userId) },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  ).orFail();
};

watchlistSchema.statics.removeCrypto = async function removeCrypto(
  userId: string,
  cryptoId: string,
): Promise<WatchlistDocument | null> {
  return this.findOneAndUpdate(
    { userId },
    {
      $pull: { cryptos: cryptoId },
      $set: { updatedAt: new Date() },
    },
    {
      new: true,
      runValidators: true,
    },
  ).exec();
};

const WatchlistModel =
  (models.Watchlist as WatchlistModel | undefined) ||
  model<WatchlistDocument, WatchlistModel>("Watchlist", watchlistSchema);

export default WatchlistModel;

