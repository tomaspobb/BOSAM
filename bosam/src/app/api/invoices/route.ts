import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const conces = searchParams.get("conces") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const q: any = {};
  if (conces) q.codigoConcesionario = conces;
  // (fecha guarda string; si luego usas Date real, aquí filtras por rango)

  const data = await Invoice.find(q).sort({ createdAt: -1 }).lean();
  const total = data.reduce((s, d: any) => s + (Number(d.costo) || 0), 0);
  return NextResponse.json({ data, total });
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const created = await Invoice.create(body);
  return NextResponse.json({ invoice: created });
}
