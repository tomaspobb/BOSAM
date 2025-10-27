import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },

  providers: [
    Credentials({
      name: "Bosam",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();

        const email = credentials?.email?.toLowerCase().trim() || "";
        const password = credentials?.password || "";

        // Traemos hash; si hubo campo legacy "password" también lo revisamos
        const u = await User.findOne({ email })
          .select("+passwordHash +password name email role")
          .lean();

        if (!u) return null;

        const hashed = u.passwordHash || u.password;
        if (!hashed) return null;

        // Si empieza con "$2" asumimos bcrypt; si no, podría ser texto plano legacy
        const ok = hashed.startsWith("$2")
          ? await bcrypt.compare(password, hashed)
          : password === hashed;

        if (!ok) return null;

        // Lo que va al token y luego a session.user
        return {
          id: String(u._id),
          email: u.email,
          name: u.name,
          role: u.role || "user",
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = user; // user => lo que retorna authorize()
      return token;
    },
    async session({ session, token }) {
      if (token?.user) (session as any).user = token.user;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
