import { Schema, model, models } from "mongoose";

export interface IInvoice {
  orderNumber: string;            // N° ORDEN
  codigoConcesionario: string;    // e.g. "AS"
  codigoEmpresa: string;          // e.g. "CHV"
  codigoServicio: string;         // e.g. "005"
  fecha: string;                  // "dd/mm/yyyy"
  costo: number;                  // 0..n
  anotaciones?: string;
  blobUrl?: string;               // URL archivo en Blob (opcional)
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    orderNumber: { type: String, required: true, index: true },
    codigoConcesionario: { type: String, required: true, index: true },
    codigoEmpresa: { type: String, required: true },
    codigoServicio: { type: String, required: true },
    fecha: { type: String, required: true },
    costo: { type: Number, required: true },
    anotaciones: String,
    blobUrl: String,
  },
  { timestamps: true }
);

export default models.Invoice || model<IInvoice>("Invoice", InvoiceSchema);
