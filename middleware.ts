import { auth } from "@/auth";

export default auth;

export const config = {
  // Don't run middleware on these paths
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sign-in).*)"],
};
