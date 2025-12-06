import NextAuth from "next-auth";
import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import bcrypt from "bcrypt";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email / User ID", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const { identifier, password, role } = credentials;
        if (!identifier || !password || !role) {
          throw new Error("Please provide all required fields.");
        }

        await dbConnect();

        const roleModelMap = {
          Admin: { model: Admin, identifierField: "email" },
          Manager: { model: Manager, identifierField: "email" },
          TeamLead: { model: TeamLead, identifierField: "userId" },
          Employee: { model: Employee, identifierField: "userId" },
        };

        if (!roleModelMap[role]) {
          throw new Error("Invalid role specified.");
        }

        const { model, identifierField } = roleModelMap[role];
        const query = { [identifierField]: identifier };
        const user = await model.findOne(query).select("-otp -otpExpiry");

        if (!user) {
          throw new Error(`No ${role} found with this ${identifierField}.`);
        }

        // Check verification for Manager
        if (role === "Manager" && !user.verified) {
          throw new Error("Please verify your email before logging in.");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password.");
        }

        const userData = {
          id: user._id.toString(),
          email: user.email,
          userId: user.userId || null,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`,
          profilePic: user.profilePic || null,
          role,
          verified: user.verified || false
        };

        if (role === "Manager") {
          userData.departments = user.departments?.map((id) => id.toString()) || [];
          userData.managerId = null;
          userData.depId = null;
        } else if (role === "TeamLead" || role === "Employee") {
          userData.managerId = user.managerId?.toString() || null;
          userData.depId = user.depId?.toString() || null;
          userData.departments = null;
          userData.startTime = user.startTime || "09:00";
          userData.endTime = user.endTime || "18:00";
        }

        return userData;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.userId = user.userId;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.name = user.name;
        token.email = user.email;
        token.profilePic = user.profilePic;
        token.managerId = user.managerId;
        token.depId = user.depId;
        token.departments = user.departments;
        token.startTime = user.startTime;
        token.endTime = user.endTime;
        token.verified = user.verified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.userId = token.userId;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.profilePic = token.profilePic;
        session.user.managerId = token.managerId;
        session.user.depId = token.depId;
        session.user.departments = token.departments;
        session.user.startTime = token.startTime;
        session.user.endTime = token.endTime;
        session.user.verified = token.verified;
      }
      return session;
    },
    async redirect({ url, baseUrl, token }) {
      if (token) {
        if (token.role === "Manager" && !token.verified) {
          return `${baseUrl}/manager-verified?email=${token.email}`;
        }
        
        const roleRedirects = {
          Admin: "/admin/home",
          Manager: "/manager/home",
          TeamLead: "/teamlead/home",
          Employee: "/employee/home",
        };
        return roleRedirects[token.role] || baseUrl;
      }
      return `${baseUrl}/login`;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
};

export default NextAuth(authOptions);