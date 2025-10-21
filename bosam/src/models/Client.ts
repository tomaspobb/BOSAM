import mongoose, { Schema, models } from "mongoose";

const clientSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true }, // código concesionario, por ejemplo
    email: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

const Client = models.Client || mongoose.model("Client", clientSchema);
export default Client;
