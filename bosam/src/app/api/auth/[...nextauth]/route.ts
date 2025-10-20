import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: { type: "password" } },
      authorize: async (creds) => {
        await dbConnect();
        if (!creds?.email || !creds?.password) return null;
        const u = await User.findOne({ email: creds.email }).lean();
        if (!u) return null;
        const ok = await bcrypt.compare(creds.password, u.passwordHash);
        if (!ok) return null;
        return { id: String(u._id), email: u.email, name: u.name, role: u.role } as any;
      },
    }),
  ],
  pages: { signIn: "/auth/login" },
});

export { handler as GET, handler as POST };
