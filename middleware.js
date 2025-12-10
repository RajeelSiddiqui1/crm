// middleware.js
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const publicPaths = ["/", "/manager-verified", "/forgot-password", "/reset-password"];
  const authPages = [
    "/adminlogin",
    "/managerlogin",
    "/teamleadlogin",
    "/employeelogin",
    "/managerregister"
  ];

  const blockForLoggedIn = [...publicPaths, ...authPages];

  const roleHomePages = {
    Admin: "/admin/home",
    Manager: "/manager/home",
    TeamLead: "/teamlead/home",
    Employee: "/employee/home",
  };

  // 1️⃣ IF LOGGED IN USER tries to open any public or auth page → redirect to home
  if (token && blockForLoggedIn.includes(pathname)) {
    return NextResponse.redirect(new URL(roleHomePages[token.role], req.url));
  }

  // 2️⃣ IF NOT LOGGED IN → cannot access private routes
  if (!token) {
    const isPublic = publicPaths.includes(pathname) || authPages.includes(pathname);
    if (!isPublic) {
      const roleFromPath = pathname.split("/")[1]?.toLowerCase();
      const roleLoginPages = {
        admin: "/adminlogin",
        manager: "/managerlogin",
        teamlead: "/teamleadlogin",
        employee: "/employeelogin",
      };
      return NextResponse.redirect(new URL(roleLoginPages[roleFromPath] || "/", req.url));
    }
  }

  // 3️⃣ Role-based protection
  if (token) {
    const role = token.role;

    if (
      (pathname.startsWith("/admin") && role !== "Admin") ||
      (pathname.startsWith("/manager") && role !== "Manager") ||
      (pathname.startsWith("/teamlead") && role !== "TeamLead") ||
      (pathname.startsWith("/employee") && role !== "Employee")
    ) {
      return NextResponse.redirect(new URL(roleHomePages[role], req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
