import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const conces = searchParams.get("conces") || undefined;

  const q: any = {};
  if (conces) q.codigoConcesionario = conces;

  const rows = await Invoice.find(q).sort({ createdAt: -1 }).lean();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Bosam");
  ws.addRow(["N° ORDEN","CÓD CONCES.","CÓD EMPRESA","CÓD SERV.","FECHA","COSTO","ANOTACIONES","URL"]);
  rows.forEach((r: any) =>
    ws.addRow([
      r.orderNumber, r.codigoConcesionario, r.codigoEmpresa,
      r.codigoServicio, r.fecha, Number(r.costo) || 0, r.anotaciones || "", r.blobUrl || ""
    ])
  );
  // total abajo
  const total = rows.reduce((s: number, r: any) => s + (Number(r.costo)||0), 0);
  ws.addRow([]);
  ws.addRow(["", "", "", "", "TOTAL", total]);

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=bosam_invoices.xlsx",
    },
  });
}
