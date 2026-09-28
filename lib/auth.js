import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { rateLimit } from "@/lib/rateLimit";

// 10 login attempts per 15 minutes per *email* (not IP — NextAuth's authorize
// callback doesn't reliably expose the client IP across environments, and
// per-account limiting is what actually stops credential-stuffing/brute-force
// against one target, regardless of which IP it comes from).
const LOGIN_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

export const authOptions = {
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const { allowed } = rateLimit(`login:${credentials.email.toLowerCase()}`, LOGIN_LIMIT);
        if (!allowed) {
          throw new Error("Too many login attempts. Please try again in a few minutes.");
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user) {
          throw new Error("No account found with this email");
        }
        if (user.banned) {
          throw new Error("This account has been suspended");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
