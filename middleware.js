import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    const publicPaths = [
        "/", 
        "/adminlogin", 
        "/managerlogin", 
        "/teamleadlogin", 
        "/employeelogin", 
        "/managerregister",
        "/manager-verified",
        "/forgot-password",
        "/reset-password",
        "/api/auth/[...nextauth]",
        "/api/auth/signin"
    ];

    if (token && publicPaths.includes(pathname)) {
        if (pathname === "/managerregister") {
            return NextResponse.next();
        }

        const roleRedirects = {
            Admin: "/admin/home",
            Manager: "/manager/home",
            TeamLead: "/teamlead/home",
            Employee: "/employee/home",
        };

        const redirectUrl = roleRedirects[token.role] || "/";
        return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    if (!token && !publicPaths.includes(pathname)) {
        if (pathname.startsWith("/admin/") || 
            pathname.startsWith("/manager/") || 
            pathname.startsWith("/teamlead/") || 
            pathname.startsWith("/employee/")) {
            
            const roleFromPath = pathname.split("/")[1];
            const roleLoginPages = {
                "admin": "/adminlogin",
                "manager": "/managerlogin",
                "teamlead": "/teamleadlogin",
                "employee": "/employeelogin"
            };
            
            const loginPage = roleLoginPages[roleFromPath] || "/login";
            return NextResponse.redirect(new URL(loginPage, req.url));
        }
        
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token) {
        const role = token.role;
        
        if (pathname.startsWith("/admin/") && role !== "Admin") {
            const roleHomePages = {
                "Manager": "/manager/home",
                "TeamLead": "/teamlead/home",
                "Employee": "/employee/home",
            };
            return NextResponse.redirect(new URL(roleHomePages[role] || "/", req.url));
        }
        
        if (pathname.startsWith("/manager/") && role !== "Manager") {
            const roleHomePages = {
                "Admin": "/admin/home",
                "TeamLead": "/teamlead/home",
                "Employee": "/employee/home",
            };
            return NextResponse.redirect(new URL(roleHomePages[role] || "/", req.url));
        }
        
        if (pathname.startsWith("/teamlead/") && role !== "TeamLead") {
            const roleHomePages = {
                "Admin": "/admin/home",
                "Manager": "/manager/home",
                "Employee": "/employee/home",
            };
            return NextResponse.redirect(new URL(roleHomePages[role] || "/", req.url));
        }
        
        if (pathname.startsWith("/employee/") && role !== "Employee") {
            const roleHomePages = {
                "Admin": "/admin/home",
                "Manager": "/manager/home",
                "TeamLead": "/teamlead/home",
            };
            return NextResponse.redirect(new URL(roleHomePages[role] || "/", req.url));
        }

        if (pathname === "/adminlogin" && role !== "Admin") {
            return NextResponse.redirect(new URL(`/${role.toLowerCase()}/home`, req.url));
        }
        
        if (pathname === "/managerlogin" && role !== "Manager") {
            return NextResponse.redirect(new URL(`/${role.toLowerCase()}/home`, req.url));
        }
        
        if (pathname === "/teamleadlogin" && role !== "TeamLead") {
            return NextResponse.redirect(new URL(`/${role.toLowerCase()}/home`, req.url));
        }
        
        if (pathname === "/employeelogin" && role !== "Employee") {
            return NextResponse.redirect(new URL(`/${role.toLowerCase()}/home`, req.url));
        }

        const adminOnlyRoutes = ["/admin/users", "/admin/settings", "/admin/audit"];
        if (adminOnlyRoutes.some(route => pathname.startsWith(route)) && role !== "Admin") {
            return NextResponse.redirect(new URL(`/${role.toLowerCase()}/home`, req.url));
        }
        
        const managerOnlyRoutes = ["/manager/team", "/manager/reports"];
        if (managerOnlyRoutes.some(route => pathname.startsWith(route)) && role !== "Manager") {
            return NextResponse.redirect(new URL(`/${role.toLowerCase()}/home`, req.url));
        }
        
        const teamLeadOnlyRoutes = ["/teamlead/tasks", "/teamlead/team"];
        if (teamLeadOnlyRoutes.some(route => pathname.startsWith(route)) && role !== "TeamLead") {
            return NextResponse.redirect(new URL(`/${role.toLowerCase()}/home`, req.url));
        }
        
        const employeeOnlyRoutes = ["/employee/tasks", "/employee/attendance"];
        if (employeeOnlyRoutes.some(route => pathname.startsWith(route)) && role !== "Employee") {
            return NextResponse.redirect(new URL(`/${role.toLowerCase()}/home`, req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
    ]
};