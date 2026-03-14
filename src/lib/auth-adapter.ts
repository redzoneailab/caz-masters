import type { Adapter, AdapterUser, AdapterAccount, VerificationToken } from "next-auth/adapters";
import { prisma } from "./prisma";

type UserAccount = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

function toAdapterUser(u: UserAccount): AdapterUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    image: u.avatarUrl,
    emailVerified: null,
  };
}

export function CazMastersAdapter(): Adapter {
  return {
    async createUser(data: Omit<AdapterUser, "id">) {
      // For email sign-in, try to pull a name from existing Player records
      let name = data.name || data.email?.split("@")[0] || "Player";
      if (data.email) {
        const player = await prisma.player.findFirst({
          where: { email: data.email },
          orderBy: { createdAt: "desc" },
        });
        if (player) name = player.fullName;
      }

      const user = await prisma.userAccount.create({
        data: { email: data.email!, name },
      });
      return toAdapterUser(user);
    },

    async getUser(id: string) {
      const user = await prisma.userAccount.findUnique({ where: { id } });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email: string) {
      const user = await prisma.userAccount.findUnique({ where: { email } });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }: Pick<AdapterAccount, "provider" | "providerAccountId">) {
      if (provider === "google") {
        const user = await prisma.userAccount.findUnique({
          where: { googleId: providerAccountId },
        });
        return user ? toAdapterUser(user) : null;
      }
      return null;
    },

    async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
      const user = await prisma.userAccount.update({
        where: { id: data.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.image && { avatarUrl: data.image }),
        },
      });
      return toAdapterUser(user);
    },

    async linkAccount(account: AdapterAccount) {
      if (account.provider === "google") {
        await prisma.userAccount.update({
          where: { id: account.userId },
          data: { googleId: account.providerAccountId },
        });
      }
    },

    async createVerificationToken(data: VerificationToken) {
      return await prisma.verificationToken.create({ data });
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      try {
        return await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
      } catch {
        return null;
      }
    },
  };
}
