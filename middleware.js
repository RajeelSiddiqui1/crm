import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // All public paths
  const publicPaths = [
    "/",
    "/manager-verified",
    "/forgot-password",
    "/reset-password"
  ];

  // Login/register pages
  const authPages = [
    "/adminlogin",
    "/managerlogin",
    "/teamleadlogin",
    "/employeelogin",
    "/managerregister"
  ];

  const roleHomePages = {
    Admin: "/admin/home",
    Manager: "/manager/home",
    TeamLead: "/teamlead/home",
    Employee: "/employee/home"
  };

  // 1️⃣ Logged-in user trying to access login/register pages → redirect to home
  if (token && authPages.includes(pathname)) {
    return NextResponse.redirect(new URL(roleHomePages[token.role] || "/", req.url));
  }

  // 2️⃣ Not logged-in user trying to access private pages → redirect to login
  if (!token && ![...publicPaths, ...authPages].includes(pathname)) {
    const roleFromPath = pathname.split("/")[1];
    const roleLoginPages = {
      admin: "/adminlogin",
      manager: "/managerlogin",
      teamlead: "/teamleadlogin",
      employee: "/employeelogin"
    };
    const loginPage = roleLoginPages[roleFromPath] || "/login";
    return NextResponse.redirect(new URL(loginPage, req.url));
  }

  // 3️⃣ Role-based access: logged-in user cannot access other roles' private routes
  if (token) {
    const role = token.role;
    const rolePaths = {
      Admin: "/admin",
      Manager: "/manager",
      TeamLead: "/teamlead",
      Employee: "/employee"
    };

    if (pathname.startsWith("/admin") && role !== "Admin") {
      return NextResponse.redirect(new URL(roleHomePages[role] || "/", req.url));
    }
    if (pathname.startsWith("/manager") && role !== "Manager") {
      return NextResponse.redirect(new URL(roleHomePages[role] || "/", req.url));
    }
    if (pathname.startsWith("/teamlead") && role !== "TeamLead") {
      return NextResponse.redirect(new URL(roleHomePages[role] || "/", req.url));
    }
    if (pathname.startsWith("/employee") && role !== "Employee") {
      return NextResponse.redirect(new URL(roleHomePages[role] || "/", req.url));
    }
  }

  // All other cases → allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ]
};
