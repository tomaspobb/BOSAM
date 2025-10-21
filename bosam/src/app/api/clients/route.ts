import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Client from "@/models/Client";

// GET /api/clients  -> lista y seed si está vacío
export async function GET() {
  await dbConnect();
  const count = await Client.countDocuments();
  if (count === 0) {
    await Client.insertMany([
      { name: "Fronza",     code: "FRZ" },
      { name: "AutoSummit", code: "AS"  },
    ]);
  }
  const clients = await Client.find({}).sort({ name: 1 }).lean();
  return NextResponse.json(clients);
}

// POST /api/clients  -> crea cliente
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, code, email, phone, address } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "name y code son requeridos" }, { status: 400 });
    }

    const created = await Client.create({
      name,
      code: String(code).toUpperCase(),
      email, phone, address,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error creando cliente" }, { status: 500 });
  }
}
