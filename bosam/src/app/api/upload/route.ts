import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

    const filename = `${Date.now()}-${file.name}`.replace(/\s+/g, "_");
    const uploaded = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: uploaded.url });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Error de subida" }, { status: 500 });
  }
}
