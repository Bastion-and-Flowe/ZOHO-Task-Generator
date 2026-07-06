import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validations";

function applyUserClaims(token: JWT, user: { id: string; department: string; subDepartment: string; name?: string | null }) {
  token.id = user.id;
  token.department = user.department;
  token.subDepartment = user.subDepartment;
  if (user.name) token.name = user.name;
  return token;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          subDepartment: user.subDepartment,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        return applyUserClaims(token, user);
      }

      if (trigger === "update" && session) {
        return applyUserClaims(token, {
          id: token.id,
          department: session.user.department,
          subDepartment: session.user.subDepartment,
          name: session.user.name,
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.department = token.department;
        session.user.subDepartment = token.subDepartment;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
