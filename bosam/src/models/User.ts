import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    // lo usual es select:false; en authorize pediremos +passwordHash
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, default: "user" },

    // opcional legacy (si existiera en tu colección)
    password: { type: String, select: true },
  },
  { timestamps: true }
);

const User = (models.User as any) || mongoose.model("User", userSchema);
export default User;
