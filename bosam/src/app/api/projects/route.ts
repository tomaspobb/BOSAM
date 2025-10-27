import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { dbConnect } from '@/lib/mongodb';
import Project from '@/models/Project';

export const runtime = 'nodejs'; // Mongoose necesita Node.js runtime

export async function GET(req: NextRequest) {
  await dbConnect();
  const url = new URL(req.url);
  const month = url.searchParams.get('month') || undefined;
  const clientId = url.searchParams.get('clientId') || undefined;

  const filter: any = {};
  if (month) filter.month = month;
  if (clientId) filter.clientId = clientId;

  const list = await Project.find(filter)
    .populate('clientId')
    .sort({ date: -1 })
    .lean();

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const form = await req.formData();
    const payloadStr = form.get('payload') as string;
    if (!payloadStr) {
      return NextResponse.json({ error: 'payload vacío' }, { status: 400 });
    }
    const payload = JSON.parse(payloadStr);
    // payload: { clientId, date, note, services:[{label,unitPrice,qty}] }

    // agrupar archivos por servicio: files[0], files[1], ...
    const filesByService = new Map<number, File[]>();
    for (const [key, value] of form.entries()) {
      const m = key.match(/^files\[(\d+)\]$/);
      if (m && value instanceof File) {
        const idx = Number(m[1]);
        const arr = filesByService.get(idx) ?? [];
        arr.push(value);
        filesByService.set(idx, arr);
      }
    }

    // subimos a Blob SOLO ahora (al guardar)
    const folder = `projects/${payload.date}-${nanoid(6)}`;
    const services = await Promise.all(
      (payload.services || []).map(async (s: any, si: number) => {
        const files = filesByService.get(si) || [];
        const uploaded = await Promise.all(
          files.map(async (file, fi) => {
            const safe = `${Date.now()}-${fi}-${file.name}`.replace(/\s+/g, '_');
            const { url } = await put(`${folder}/${safe}`, file, {
              access: 'public',
              token: process.env.BLOB_READ_WRITE_TOKEN,
            });
            return { url, name: file.name, size: file.size, type: file.type };
          })
        );

        const unit = Number(s.unitPrice || 0);
        const qty  = Number(s.qty || 1);
        return {
          label: s.label,
          unitPrice: unit,
          qty,
          subtotal: unit * qty,
          files: uploaded,
        };
      })
    );

    const doc = await Project.create({
      clientId: payload.clientId,
      date: payload.date,
      note: payload.note || '',
      services,
    });

    return NextResponse.json({ ok: true, id: doc._id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}
