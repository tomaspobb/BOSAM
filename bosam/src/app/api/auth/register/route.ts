import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { name, email, password } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const exists = await User.findOne({ email });
  if (exists) return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, passwordHash });
  return NextResponse.json({ ok: true });
}
