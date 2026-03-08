import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await prisma.userAccount.upsert({
          where: { googleId: account.providerAccountId },
          update: { name: user.name || "", avatarUrl: user.image || null },
          create: {
            googleId: account.providerAccountId,
            email: user.email,
            name: user.name || "",
            avatarUrl: user.image || null,
          },
        });

        // Link any existing Player records to this account
        const userAccount = await prisma.userAccount.findUnique({
          where: { email: user.email },
        });
        if (userAccount) {
          await prisma.player.updateMany({
            where: { email: user.email, userAccountId: null },
            data: { userAccountId: userAccount.id },
          });
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        const userAccount = await prisma.userAccount.findUnique({
          where: { googleId: account.providerAccountId },
        });
        token.userAccountId = userAccount?.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.userAccountId = token.userAccountId;
      return session;
    },
  },
};
