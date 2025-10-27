export { default } from "next-auth/middleware";

// Protegemos todo menos /auth y assets estáticos
export const config = {
  matcher: [
    "/((?!auth|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
