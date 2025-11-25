import { auth } from "@/auth";

export default auth;

export const config = {
  // Don't run middleware on these paths
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
