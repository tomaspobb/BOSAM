// PPTX combinado en memoria con pptxgenjs (sin fs)
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

// helper: agrega TODAS las slides de UN proyecto
async function addProjectSlides(pptx: any, p: any) {
  const SLIDE_W = 13.33;
  const SLIDE_H = 7.5;
  pptx.defineLayout({ name: 'BOSAM', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'BOSAM';

  // Portada del proyecto
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

  // Config común para imágenes
  const IMG_W = 10.5;
  const IMG_H = 5.5;
  const IMG_X = (SLIDE_W - IMG_W) / 2;
  const TITLE_Y = 0.5;
  const IMG_Y = 1.4;

  // Imágenes por servicio: una imagen por diapositiva
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
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const idsParam = url.searchParams.get('ids');
    if (!idsParam) return new Response('ids requerido', { status: 400 });

    const ids = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) return new Response('Sin IDs válidos', { status: 400 });

    const projects = await Promise.all(
      ids.map((id) => Project.findById(id).populate('clientId').lean())
    );
    const validProjects = projects.filter(Boolean) as any[];
    if (!validProjects.length) {
      return new Response('Proyectos no encontrados', { status: 404 });
    }

    const pptx = new PptxGenJS();

    for (const p of validProjects) {
      await addProjectSlides(pptx, p);
    }

    const buffer = await pptx.write('nodebuffer');
    const filename = `Bosam_compilado_${Date.now()}.pptx`;

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
    return new Response(e?.message || 'Error generando PPT combinado', {
      status: 500,
    });
  }
}
