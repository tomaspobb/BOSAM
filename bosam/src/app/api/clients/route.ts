// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Client from "@/models/Client";

export const runtime = "nodejs";

// GET: lista de clientes
export async function GET() {
  try {
    await dbConnect();
    const list = await Client.find().sort({ name: 1 }).lean();
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error listando clientes" }, { status: 500 });
  }
}

// POST: crear cliente
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    if (!data.name || !data.code) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }
    const doc = await Client.create({ name: data.name, code: data.code });
    return NextResponse.json({ ok: true, id: doc._id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error creando cliente" }, { status: 500 });
  }
}

// DELETE: eliminar cliente ?id=...
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    await Client.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error eliminando cliente" }, { status: 500 });
  }
}
