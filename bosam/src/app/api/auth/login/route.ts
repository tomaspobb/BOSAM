import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

const COOKIE = "bosam_session";
export const runtime = "nodejs";

export async function POST(req: Request) {
  await dbConnect();

  const body = await req.json().catch(() => null);
  const email = body?.email?.toString()?.trim()?.toLowerCase();
  const password = body?.password?.toString()?.normalize("NFKC");

  if (!email || !password) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  // Trae passwordHash + legacy
  const userDoc = await User.findOne({ email })
    .select("name email role passwordHash password")
    .exec();

  if (!userDoc) {
    if (process.env.NODE_ENV !== "production") console.log("[LOGIN] Usuario no encontrado:", email);
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  let ok = false;

  if (userDoc.passwordHash) {
    ok = await bcrypt.compare(password.trim(), userDoc.passwordHash);
    if (!ok) ok = await bcrypt.compare(password, userDoc.passwordHash);
  }

  if (!ok && (userDoc as any).password) {
    const stored = String((userDoc as any).password);
    const looksHashed = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
    if (looksHashed) ok = await bcrypt.compare(password, stored);
    else ok = password === stored || password.trim() === stored;

    if (ok) {
      const newHash = looksHashed ? stored : await bcrypt.hash(password, 10);
      userDoc.set("passwordHash", newHash);
      (userDoc as any).set("password", undefined);
      await userDoc.save();
    }
  }

  if (!ok) {
    if (process.env.NODE_ENV !== "production") console.log("[LOGIN] Bcrypt no coincide para:", email);
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return NextResponse.json({ error: "Falta JWT_SECRET" }, { status: 500 });

  const token = await (async () =>
    (await import("jsonwebtoken")).default.sign(
      { sub: String(userDoc._id), name: userDoc.name, email: userDoc.email, role: userDoc.role || "user" },
      secret,
      { expiresIn: "7d" }
    ))();

  const res = NextResponse.json({
    ok: true,
    user: { name: userDoc.name, email: userDoc.email, role: userDoc.role || "user" },
  });

  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
