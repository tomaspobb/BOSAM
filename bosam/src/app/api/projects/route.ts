import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Project from "@/models/Project";

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");     // opcional: YYYY-MM
  const clientId = searchParams.get("clientId");

  const q:any = {};
  if (month) q.month = month;
  if (clientId) q.clientId = clientId;

  const data = await Project.find(q)
    .populate("clientId", "name code")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  // body = { clientId, date, note, services: [{type,label,unitPrice,qty,files:[{url,name,size,type}]}] }
  const services = (body.services||[]).map((s:any)=>({
    ...s, subtotal: Number(s.unitPrice||0) * Number(s.qty||1)
  }));

  const created = await Project.create({
    clientId: body.clientId,
    date: body.date,
    note: body.note || "",
    services,
  });

  const populated = await created.populate("clientId","name code");
  return NextResponse.json(populated, { status: 201 });
}
