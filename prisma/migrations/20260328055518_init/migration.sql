-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE
);

-- CreateTable
CREATE TABLE "Tour" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "minPeople" INTEGER NOT NULL DEFAULT 1,
    "images" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVO',
    "country" TEXT,
    "zone" TEXT,
    "durationDays" INTEGER,
    "durationHours" INTEGER,
    "activityType" TEXT,
    "difficulty" TEXT,
    "rating" DOUBLE PRECISION,
    "reviews" INTEGER,
    "guideType" TEXT,
    "transport" TEXT,
    "groups" TEXT,
    "story" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "includedItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "faqs" JSONB,
    "priceOptions" JSONB,
    "tourPackages" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "categoryId" INTEGER NOT NULL,
    CONSTRAINT "Tour_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "date" TIMESTAMP(3) NOT NULL,
    "maxPeople" INTEGER NOT NULL,
    "tourId" INTEGER NOT NULL,
    CONSTRAINT "Availability_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "tourId" INTEGER NOT NULL,
    "people" INTEGER NOT NULL,
    "adults" INTEGER,
    "kids" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "emailConfirm" TEXT,
    "phone" TEXT,
    "hotel" TEXT,
    "paymentMethod" TEXT,
    "promoCode" TEXT,
    "scheduleTime" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Reservation_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
