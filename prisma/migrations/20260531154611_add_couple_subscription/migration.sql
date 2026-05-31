-- CreateTable
CREATE TABLE "CoupleSubscription" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "targetCoupleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoupleSubscription_followerId_targetCoupleId_key" ON "CoupleSubscription"("followerId", "targetCoupleId");

-- AddForeignKey
ALTER TABLE "CoupleSubscription" ADD CONSTRAINT "CoupleSubscription_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleSubscription" ADD CONSTRAINT "CoupleSubscription_targetCoupleId_fkey" FOREIGN KEY ("targetCoupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
