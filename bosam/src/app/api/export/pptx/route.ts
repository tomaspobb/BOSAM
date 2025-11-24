// PPTX en memoria con pptxgenjs (sin fs)
import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Project from '@/models/Project';
import PptxGenJS from 'pptxgenjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// util: fetch -> base64 (para imágenes)
async function fetchAsBase64(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No se pudo leer imagen: ${url}`);
  const ab = await r.arrayBuffer();
  const b64 = Buffer.from(ab).toString('base64');
  const m = /\.jpe?g$/i.test(url)
    ? 'image/jpeg'
    : /\.png$/i.test(url)
    ? 'image/png'
    : 'image/jpeg';
  return `data:${m};base64,${b64}`;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) return new Response('projectId requerido', { status: 400 });

    const p: any = await Project.findById(projectId).populate('clientId').lean();
    if (!p) return new Response('Proyecto no encontrado', { status: 404 });

    const pptx = new PptxGenJS();

    // Tamaño 16:9
    const SLIDE_W = 13.33;
    const SLIDE_H = 7.5;
    pptx.defineLayout({ name: 'BOSAM', width: SLIDE_W, height: SLIDE_H });
    pptx.layout = 'BOSAM';

    // Portada
    {
      const slide = pptx.addSlide();
      slide.addText('Bosam', {
        x: 0.5,
        y: 0.4,
        fontSize: 18,
        bold: true,
        color: 'E63946',
      });
      slide.addText('Reporte de Proyecto', {
        x: 0.5,
        y: 1.0,
        fontSize: 34,
        bold: true,
        color: '1c1e23',
      });

      const title = `${p?.clientId?.name ?? ''} (${p?.clientId?.code ?? ''})`;
      slide.addText(title, { x: 0.5, y: 2.0, fontSize: 22, color: '333333' });
      slide.addText(`Fecha: ${p.date}`, {
        x: 0.5,
        y: 2.7,
        fontSize: 16,
        color: '666666',
      });

      const servicios = (p.services || [])
        .map((s: any) => `${s.label} × ${s.qty}`)
        .join('  •  ');
      slide.addText(servicios || 'Sin servicios', {
        x: 0.5,
        y: 3.4,
        fontSize: 16,
        color: '444444',
      });

      slide.addText(`Total: $${(p.total || 0).toLocaleString('es-CL')}`, {
        x: 0.5,
        y: 4.2,
        fontSize: 22,
        bold: true,
        color: '1c1e23',
      });
    }

    // Config de marco para imágenes (centradas, sin deformar)
    const IMG_W = 10.5; // ancho del marco
    const IMG_H = 5.5;  // alto del marco
    const IMG_X = (SLIDE_W - IMG_W) / 2;
    const TITLE_Y = 0.5;
    const IMG_Y = 1.4;

    // Una imagen por diapositiva
    for (const s of p.services || []) {
      const files: string[] = (s.files || []).map((f: any) => f.url).filter(Boolean);
      if (!files.length) continue;

      const imgs = await Promise.all(
        files.map(async (u) => {
          try {
            return await fetchAsBase64(u);
          } catch {
            return null;
          }
        })
      );
      const valid = imgs.filter(Boolean) as string[];
      if (!valid.length) continue;

      for (const img of valid) {
        const slide = pptx.addSlide();

        // título del servicio
        slide.addText(
          `${s.label} — x${s.qty} — $${(s.subtotal || 0).toLocaleString('es-CL')}`,
          {
            x: 0.5,
            y: TITLE_Y,
            fontSize: 18,
            bold: true,
            color: '1c1e23',
          }
        );

        // Imagen en marco centrado, manteniendo proporción
        slide.addImage({
          data: img,
          x: IMG_X,
          y: IMG_Y,
          w: IMG_W,
          h: IMG_H,
          sizing: 'contain' as any,
        });
      }
    }

    // Devolver como buffer
    const buffer = await pptx.write('nodebuffer');

    const filename = `Proyecto_${(p?.clientId?.code || 'CL')}_${String(p._id).slice(
      -6
    )}.pptx`;
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return new Response(e?.message || 'Error generando PPT', { status: 500 });
  }
}
