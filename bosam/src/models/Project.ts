import mongoose, { Schema, models } from "mongoose";

const fileSchema = new Schema({
  url: { type: String, required: true },
  name: String,
  size: Number,
  type: String,   // "image/png", "application/pdf", etc.
});

const serviceSchema = new Schema({
  type: { type: String, required: true },   // 'POST_IG' | 'POP' | 'FOTOMONTAJE' | ...
  label: { type: String, required: true },  // "Post IG", "POP", etc. (para mostrar)
  unitPrice: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
  subtotal: { type: Number, required: true },    // = unitPrice * qty
  files: [fileSchema]                            // imágenes asociadas a ESTE servicio
});

const projectSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
  code: String,         // opcional: # interno
  date: { type: String, required: true },  // 'YYYY-MM-DD'
  month: { type: String, index: true },    // 'YYYY-MM' (para export mensual)
  note: String,
  services: [serviceSchema],
  total: { type: Number, default: 0 },
}, { timestamps: true });

projectSchema.pre('save', function (next) {
  const self:any = this;
  self.total = (self.services || []).reduce((s:number, it:any) => s + (it.subtotal || 0), 0);
  self.month = (self.date || '').slice(0,7);
  next();
});

const Project = models.Project || mongoose.model("Project", projectSchema);
export default Project;
