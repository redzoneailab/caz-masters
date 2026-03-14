import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./prisma";
import { CazMastersAdapter } from "./auth-adapter";
import { sendMagicLinkEmail } from "./resend";

export const authOptions: NextAuthOptions = {
  adapter: CazMastersAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return true;

      // Update avatar from Google profile
      if (account?.provider === "google" && user.image) {
        await prisma.userAccount
          .update({
            where: { id: user.id },
            data: { avatarUrl: user.image },
          })
          .catch(() => {});
      }

      // Link any unlinked Player records to this account
      await prisma.player.updateMany({
        where: { email: user.email, userAccountId: null },
        data: { userAccountId: user.id },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userAccountId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.userAccountId = token.userAccountId;
      return session;
    },
  },
};
