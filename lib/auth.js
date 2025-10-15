import { dbConnect } from "@/lib/db";
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
        identifier: { label: "Email / User ID", type: "text", placeholder: "Enter your email or user ID" },
        password: { label: "Password", type: "password" }
      },

      async authorize(credentials) {
        const { identifier, password } = credentials;

        if (!identifier || !password) {
          throw new Error("Please enter all fields.");
        }

        await dbConnect();

        const emailModels = [
          { model: Admin, role: "Admin" },
          { model: Manager, role: "Manager" },
        ];

        for (const { model, role } of emailModels) {
          const user = await model.findOne({ email: identifier });
          if (user) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) throw new Error("Incorrect password.");

            return {
              id: user._id.toString(),
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              imageUrl: user.profilePic || null,
              role,
            };
          }
        }

        // ✅ Now check ID-based users (TeamLead, Employee)
        const idModels = [
          { model: TeamLead, role: "TeamLead" },
          { model: Employee, role: "Employee" },
        ];

        for (const { model, role } of idModels) {
          const user = await model.findOne({ userId: identifier });
          if (user) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) throw new Error("Incorrect password.");

            return {
              id: user._id.toString(),
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`,
              imageUrl: user.profilePic || null,
              role,
            };
          }
        }

  
        throw new Error("No account found with this email or user ID.");
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.userId = user.userId || null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.userId = token.userId;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
