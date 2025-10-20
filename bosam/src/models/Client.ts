import { Schema, model, models } from "mongoose";

const ClientSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
}, { timestamps: true });

export default models.Client || model("Client", ClientSchema);
