import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // just needs to be logged in; role check happens above
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/spots/new", "/spots/:id/edit", "/saved", "/notifications"],
};
