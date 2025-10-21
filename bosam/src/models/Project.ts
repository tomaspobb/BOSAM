import mongoose, { Schema, models } from "mongoose";

const serviceSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const projectSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    services: [serviceSchema],
    total: { type: Number, default: 0 },
    date: { type: String, required: true },
    note: { type: String },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

const Project = models.Project || mongoose.model("Project", projectSchema);
export default Project;
