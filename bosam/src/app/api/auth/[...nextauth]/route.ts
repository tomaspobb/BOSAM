import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        // 🔓 Acepta cualquier correo/clave durante desarrollo
        if (creds?.email && creds?.password) {
          return { id: "admin", email: creds.email } as any;
        }
        return null;
      },
    }),
  ],
});

export { handler as GET, handler as POST };
