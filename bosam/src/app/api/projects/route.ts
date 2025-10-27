// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Project from '@/models/Project';
import Client from '@/models/Client';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';         // ⬅️ IMPORTANTE (Mongoose + formData)
export const dynamic = 'force-dynamic';  // evita cache

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
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Falta BLOB_READ_WRITE_TOKEN en el .env.local' },
        { status: 500 }
      );
    }

    await dbConnect();

    const form = await req.formData();
    const payloadStr = form.get('payload') as string | null;
    if (!payloadStr) {
      return NextResponse.json({ error: 'payload vacío' }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr); // { clientId, date, note, services:[{label,unitPrice,qty}] }
    if (!payload?.clientId || !payload?.date || !Array.isArray(payload?.services)) {
      return NextResponse.json({ error: 'payload inválido' }, { status: 400 });
    }

    // valida cliente (opcional)
    const clientExists = await Client.exists({ _id: payload.clientId });
    if (!clientExists) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // agrupa File[] por índice de servicio: files[0], files[1], ...
    const filesByService = new Map<number, File[]>();
    for (const [key, value] of form.entries()) {
      const m = /^files\[(\d+)\]$/.exec(key);
      if (m && value instanceof File) {
        const idx = Number(m[1]);
        const arr = filesByService.get(idx) ?? [];
        arr.push(value);
        filesByService.set(idx, arr);
      }
    }

    // carpeta por proyecto
    const folder = `projects/${payload.date}-${nanoid(6)}`;

    // construye services con subida de blobs (si es que hay)
    const services = await Promise.all(
      payload.services.map(async (s: any, si: number) => {
        const files = filesByService.get(si) || [];
        const uploaded = await Promise.all(
          files.map(async (file, fi) => {
            // nombre seguro
            const safeName = `${Date.now()}-${fi}-${file.name}`.replace(/\s+/g, '_');

            // SUBIDA A VERCEL BLOB
            const { url } = await put(`${folder}/${safeName}`, file, {
              access: 'public',
              token,                    // usa el token del .env
            });

            return { url, name: file.name, size: file.size, type: file.type };
          })
        );

        const qty = Number.isFinite(s?.qty) ? Math.max(1, s.qty) : 1;
        const unitPrice = Number.isFinite(s?.unitPrice) ? Math.max(0, s.unitPrice) : 0;
        const subtotal = unitPrice * qty;

        return {
          label: String(s?.label ?? 'Servicio'),
          unitPrice,
          qty,
          subtotal,
          files: uploaded,
        };
      })
    );

    // crea proyecto
    const doc = await Project.create({
      clientId: payload.clientId,
      date: payload.date,
      note: payload.note || '',
      services,
    });

    return NextResponse.json({ ok: true, id: String(doc._id) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
