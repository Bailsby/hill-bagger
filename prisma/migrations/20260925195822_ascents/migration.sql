-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ascent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hillId" INTEGER NOT NULL,
    "climbedOn" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ascent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE INDEX "Ascent_userId_climbedOn_idx" ON "Ascent"("userId", "climbedOn");

-- CreateIndex
CREATE UNIQUE INDEX "Ascent_userId_hillId_key" ON "Ascent"("userId", "hillId");

-- AddForeignKey
ALTER TABLE "Ascent" ADD CONSTRAINT "Ascent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
