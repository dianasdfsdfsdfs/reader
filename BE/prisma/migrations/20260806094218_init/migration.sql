-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "Themes" AS ENUM ('DARK', 'LIGHT', 'SEPIA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "fileKey" TEXT NOT NULL,
    "coverKey" TEXT,
    "language" TEXT,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsersBooks" (
    "userId" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "visibility" "Visibility" NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentLocation" TEXT,
    "favourite" BOOLEAN NOT NULL DEFAULT false,
    "theme" "Themes" NOT NULL,
    "fontSize" INTEGER NOT NULL,

    CONSTRAINT "UsersBooks_pkey" PRIMARY KEY ("userId","bookId")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "genre" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenresBooks" (
    "bookId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "GenresBooks_pkey" PRIMARY KEY ("bookId","genreId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "UsersBooks" ADD CONSTRAINT "UsersBooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersBooks" ADD CONSTRAINT "UsersBooks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenresBooks" ADD CONSTRAINT "GenresBooks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenresBooks" ADD CONSTRAINT "GenresBooks_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
