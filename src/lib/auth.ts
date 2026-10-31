import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./prisma";
import { CazMastersAdapter } from "./auth-adapter";
import { sendMagicLinkEmail } from "./resend";
import { TOURNAMENT } from "./tournament";

async function isKnownEmail(email: string) {
  const where = { email: { equals: email, mode: "insensitive" as const } };
  const [account, player] = await Promise.all([
    prisma.userAccount.findFirst({ where, select: { id: true } }),
    prisma.player.findFirst({ where, select: { id: true } }),
  ]);
  return Boolean(account || player);
}

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
    async signIn({ user, account, email }) {
      if (!user.email) return true;

      // Magic-link request, before anything is sent. Bots submit strangers' addresses from
      // rotating IPs, so after the tournament only known addresses get an email. Unknown ones
      // see the normal "check your email" page, so the form doesn't reveal who has an account.
      if (email?.verificationRequest) {
        const offSeason = Date.now() > TOURNAMENT.date.getTime();
        if (!offSeason || (await isKnownEmail(user.email))) return true;
        return "/auth/verify-request";
      }

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
