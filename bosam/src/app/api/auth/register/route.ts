import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { name, email, password } = await req.json();
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const emailNorm = String(email).toLowerCase().trim();

    const exist = await User.findOne({ email: emailNorm }).lean();
    if (exist) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      name: name.trim(),
      email: emailNorm,
      passwordHash,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
