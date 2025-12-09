// middleware.js
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Public paths anyone can access
  const publicPaths = ["/", "/manager-verified", "/forgot-password", "/reset-password"];

  // Login pages
  const authPages = ["/adminlogin", "/managerlogin", "/teamleadlogin", "/employeelogin", "/managerregister"];

  // Role-based home pages
  const roleHomePages = {
    Admin: "/admin/home",
    Manager: "/manager/home",
    TeamLead: "/teamlead/home",
    Employee: "/employee/home",
  };

  // 1️⃣ Logged-in user trying to access login pages → redirect to their home
  if (token && authPages.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL(roleHomePages[token.role] || "/", req.url));
  }

  // 2️⃣ Not logged-in user trying to access any page other than public → redirect to public path
  if (!token && !publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3️⃣ Role-based access control for private routes
  if (token) {
    const role = token.role;

    if (
      (pathname.startsWith("/admin") && role !== "Admin") ||
      (pathname.startsWith("/manager") && role !== "Manager") ||
      (pathname.startsWith("/teamlead") && role !== "TeamLead") ||
      (pathname.startsWith("/employee") && role !== "Employee")
    ) {
      return NextResponse.redirect(new URL(roleHomePages[role] || "/", req.url));
    }
  }

  // 4️⃣ Allow public pages or authorized access
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude API routes, next.js static files, images, favicon
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
