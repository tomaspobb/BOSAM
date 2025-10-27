import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (!files || !files.length) {
      return NextResponse.json({ error: "Archivos requeridos" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const filename = `${Date.now()}-${file.name}`.replace(/\s+/g, "_");
      const uploaded = await put(filename, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      uploadedFiles.push({
        url: uploaded.url,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al subir archivos" },
      { status: 500 }
    );
  }
}
