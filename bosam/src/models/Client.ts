import mongoose, { Schema, Model } from "mongoose";

export type ClientDoc = {
  name: string;
  code: string;
};

const clientSchema = new Schema<ClientDoc>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
  },
  { timestamps: true }
);

// 🔒 patrón estable para Next 15
const Client: Model<ClientDoc> =
  (mongoose.models && (mongoose.models.Client as Model<ClientDoc>)) ||
  mongoose.model<ClientDoc>("Client", clientSchema);

export default Client;
