import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    const publicPaths = ["/login","/"]

    if (token && publicPaths.includes(pathname)) {
        const roleRedirects = {
            Admin: "/adminhome",
            Manager: "/managerhome",
            TeamLead: "/teamleadhome",
            Employee: "/employeehome",
        };

        return NextResponse.redirect(new URL(roleRedirects[token.role] || "/", req.url))
    }

    if (!token && !publicPaths.includes(pathname)) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ]
}