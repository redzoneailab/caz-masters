-- Phase 2: Teams, Hall of Fame, Gallery, Donations, Player Profiles

-- UserAccount for Google sign-in
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserAccount_googleId_key" ON "UserAccount"("googleId");
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

-- Team
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "maxSize" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Team_name_tournamentId_key" ON "Team"("name", "tournamentId");
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add teamsLocked to Tournament
ALTER TABLE "Tournament" ADD COLUMN "teamsLocked" BOOLEAN NOT NULL DEFAULT false;

-- Add teamId and userAccountId to Player
ALTER TABLE "Player" ADD COLUMN "teamId" TEXT;
ALTER TABLE "Player" ADD COLUMN "userAccountId" TEXT;
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Player" ADD CONSTRAINT "Player_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- HallOfFameEntry
CREATE TABLE "HallOfFameEntry" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "winnerName" TEXT NOT NULL,
    "teamName" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HallOfFameEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HallOfFameEntry_year_category_winnerName_key" ON "HallOfFameEntry"("year", "category", "winnerName");

-- GalleryAlbum
CREATE TABLE "GalleryAlbum" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY ("id")
);

-- GalleryPhoto
CREATE TABLE "GalleryPhoto" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Donation
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "dedicatedTo" TEXT,
    "message" TEXT,
    "stripeSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Donation_stripeSessionId_key" ON "Donation"("stripeSessionId");
