import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Project from "@/models/Project";
import Client from "@/models/Client";

// GET /api/projects  -> lista con cliente “populado”
export async function GET() {
  await dbConnect();
  const projects = await Project.find({})
    .populate("clientId", "name code")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(projects);
}

// POST /api/projects -> crea proyecto
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      clientId, // ObjectId string
      services, // array [{name, price}]
      total,    // number
      date,     // string (yyyy-mm-dd)
      note,     // string
      fileUrl,  // string (opcional)
    } = body;

    // validar cliente
    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 400 });
    }

    const created = await Project.create({
      clientId,
      services: services || [],
      total: Number(total || 0),
      date,
      note,
      fileUrl,
    });

    const populated = await created.populate("clientId", "name code");
    return NextResponse.json(populated, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Error creando proyecto" }, { status: 500 });
  }
}
