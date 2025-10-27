import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Project from "@/models/Project";
import PptxGenJS from "pptxgenjs";

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("projectId");
  if (!id) return NextResponse.json({error:"projectId requerido"}, {status:400});

  const p:any = await Project.findById(id).populate("clientId","name code").lean();
  if (!p) return NextResponse.json({error:"No existe"}, {status:404});

  const ppt = new PptxGenJS();
  ppt.layout = "LAYOUT_16x9";

  // Portada
  let slide = ppt.addSlide();
  slide.addText(p.clientId?.name || "Cliente", { x:0.5, y:0.8, fontSize:36, bold:true });
  slide.addText(`Proyecto #${p._id.toString().slice(-6)}`, { x:0.5, y:1.6, fontSize:22 });
  slide.addText(`Fecha: ${p.date}`, { x:0.5, y:2.1, fontSize:18 });
  slide.addText(`Total: $${(p.total||0).toLocaleString()}`, { x:0.5, y:2.6, fontSize:18 });

  // Una diapositiva por imagen (ordenadas por servicio)
  for (const s of p.services) {
    for (const f of (s.files || [])) {
      const slide = ppt.addSlide();
      slide.addText(`${s.label} — x${s.qty} — $${s.subtotal.toLocaleString()}`, { x:0.5, y:0.5, fontSize:18, bold:true });
      slide.addImage({ path: f.url, x:0.5, y:1.1, w:9.0, h:5.0, sizing: { type:"contain", w:9.0, h:5.0 } });
    }
  }

  const buf = await ppt.write("nodebuffer");
  return new NextResponse(buf as Buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="Proyecto_${p.clientId?.code || 'CL'}_${p._id.toString().slice(-6)}.pptx"`
    }
  });
}
