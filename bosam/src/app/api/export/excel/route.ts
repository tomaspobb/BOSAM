import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Project from "@/models/Project";
import XLSX from "xlsx";

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");       // requerido: YYYY-MM
  const clientId = searchParams.get("clientId"); // opcional

  if (!month) return NextResponse.json({error:"month requerido"}, {status:400});

  const q:any = { month };
  if (clientId) q.clientId = clientId;

  const rows = await Project.find(q).populate("clientId","name code").lean();

  // ---- Construcción del Excel (hoja "Resumen" + "Detalle") ----
  const resumen: any[] = [];
  const detalle: any[] = [];

  const sumPorCliente: Record<string, number> = {};
  rows.forEach(p => {
    const cli = `${p.clientId?.name || ""} (${p.clientId?.code || ""})`;
    sumPorCliente[cli] = (sumPorCliente[cli] || 0) + (p.total || 0);

    p.services.forEach((s:any) => {
      detalle.push({
        Cliente: cli,
        Fecha: p.date,
        Servicio: s.label,
        Cantidad: s.qty,
        "Precio unit.": s.unitPrice,
        Subtotal: s.subtotal,
        Obs: p.note || "",
      });
    });
  });

  Object.entries(sumPorCliente).forEach(([cli,total])=>{
    resumen.push({ Cliente: cli, "Total mensual": total });
  });

  const wb = XLSX.utils.book_new();
  const wsResumen = XLSX.utils.json_to_sheet(resumen);
  const wsDetalle = XLSX.utils.json_to_sheet(detalle);
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
  XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Bosam_${month}.xlsx"`
    }
  });
}
