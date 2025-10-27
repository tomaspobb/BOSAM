// Excel en memoria con xlsx (SheetJS)
import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Project from '@/models/Project';
import Client from '@/models/Client';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const month = url.searchParams.get('month') || undefined;
    const clientId = url.searchParams.get('clientId') || undefined;

    const filter: any = {};
    if (month) filter.month = month;
    if (clientId) filter.clientId = clientId;

    const rowsRaw = await Project.find(filter)
      .populate('clientId')
      .sort({ date: -1 })
      .lean();

    // Filas “flat”: una fila por servicio
    const rows = rowsRaw.flatMap((p: any) =>
      (p.services || []).map((s: any) => ({
        Cliente: `${p?.clientId?.name ?? ''} (${p?.clientId?.code ?? ''})`,
        Fecha: p.date,
        Servicio: s.label,
        Cantidad: s.qty ?? 1,
        'Precio Unitario': s.unitPrice ?? 0,
        Subtotal: s.subtotal ?? (s.unitPrice ?? 0) * (s.qty ?? 1),
        'Total Proyecto': p.total ?? 0,
        Observaciones: p.note ?? '',
      }))
    );

    // Si no hay servicios, dejamos al menos la cabecera vacía:
    const data = rows.length ? rows : [{
      Cliente: '', Fecha: '', Servicio: '', Cantidad: 0,
      'Precio Unitario': 0, Subtotal: 0, 'Total Proyecto': 0, Observaciones: ''
    }];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

    // ancho de columnas bonito
    ws['!cols'] = [
      { wch: 28 }, // Cliente
      { wch: 12 }, // Fecha
      { wch: 24 }, // Servicio
      { wch: 10 }, // Cantidad
      { wch: 16 }, // Precio Unitario
      { wch: 14 }, // Subtotal
      { wch: 16 }, // Total Proyecto
      { wch: 38 }, // Observaciones
    ];

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `Bosam_${month || 'periodo'}.xlsx`;
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return new Response(e?.message || 'Error generando Excel', { status: 500 });
  }
}
