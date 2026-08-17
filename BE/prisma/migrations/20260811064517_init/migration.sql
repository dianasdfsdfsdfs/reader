/*
  Warnings:

  - A unique constraint covering the columns `[genre]` on the table `Genre` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Genre_genre_key" ON "Genre"("genre");
