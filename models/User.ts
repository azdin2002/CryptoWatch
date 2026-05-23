import bcrypt from "bcrypt";
import { Document, Model, Schema, model, models } from "mongoose";

export interface User {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface UserDocument extends User, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const bcryptHashPattern = /^\$2[aby]\$\d{2}\$.{53}$/;

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || bcryptHashPattern.test(this.password)) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel =
  (models.User as Model<UserDocument> | undefined) ||
  model<UserDocument>("User", userSchema);

export default UserModel;
