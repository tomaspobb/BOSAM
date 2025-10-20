import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const body = await req.json();
  const updated = await Invoice.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json({ invoice: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  await Invoice.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
