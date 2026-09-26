-- CreateTable
CREATE TABLE "About" (
    "id" TEXT NOT NULL DEFAULT 'about',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "advantages" JSONB NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "About_pkey" PRIMARY KEY ("id")
);
