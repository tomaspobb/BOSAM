import mongoose, { Schema, Model } from "mongoose";

const fileSchema = new Schema({
  url: { type: String, required: true },
  name: String,
  size: Number,
  type: String,
});

const serviceSchema = new Schema({
  type: String,
  label: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
  subtotal: { type: Number, required: true },
  files: [fileSchema],
});

serviceSchema.pre("save", function (next) {
  if (!this.type && this.label) {
    // @ts-ignore
    this.type = String(this.label).toUpperCase().replace(/\s+/g, "_");
  }
  next();
});

const projectSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    code: String,
    date: { type: String, required: true },
    month: { type: String, index: true },
    note: String,
    services: [serviceSchema],
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

projectSchema.pre("save", function (next) {
  const self: any = this;
  self.total = (self.services || []).reduce((s: number, it: any) => s + (it.subtotal || 0), 0);
  self.month = (self.date || "").slice(0, 7);
  next();
});

const Project: Model<any> =
  (mongoose.models && (mongoose.models.Project as Model<any>)) ||
  mongoose.model("Project", projectSchema);

export default Project;
