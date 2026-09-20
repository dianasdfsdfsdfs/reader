import database from "@/db";
import { Prisma } from "@/generated/prisma/client";
import { Themes, Visibility } from "@/generated/prisma/enums";

const bookWithGenres = {
    genres: {
        include: {
            genreRelation: true
        }
    }
} as const;

class BookRepository {
    async findByNameInUserLibrary(userId: number, title: string) {
        return await database.usersBooks.findMany({
            where: {
                userId,
                bookRelation: {
                    title: {
                        contains: title,
                        mode: "insensitive"
                    }
                }
            },
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        });
    }

    async findByNameInPublicLibrary(title: string) {
        return await database.book.findMany({
            where: {
                title: {
                    contains: title,
                    mode: "insensitive"
                },
                isPublic: true
            },
            include: bookWithGenres
        });
    }

    async uploadBook(data: {
        userId: number;
        title: string;
        fileKey: string;
        coverKey?: string | null;
        author?: string | null;
        language?: string | null;
        genres?: string[];
        visibility?: Visibility;
    }) {
        return await database.$transaction(async (tx) => {
            const genreNames = [...new Set(data.genres ?? [])];

            const existingGenres = await tx.genre.findMany({
                where: {
                    genre: {
                        in: genreNames
                    }
                }
            });

            const missingGenres = genreNames.filter(
                (name) => !existingGenres.some((genre) => genre.genre === name)
            );

            const createdGenres = await Promise.all(
                missingGenres.map((genre) => tx.genre.create({ data: { genre } }))
            );

            const genreIds = [...existingGenres, ...createdGenres].map((genre) => genre.id);

            return await tx.book.create({
                data: {
                    title: data.title,
                    author: data.author ?? null,
                    fileKey: data.fileKey,
                    coverKey: data.coverKey ?? null,
                    language: data.language ?? null,
                    isPublic: data.visibility === Visibility.PUBLIC,
                    genres: {
                        create: genreIds.map((genreId) => ({ genreId }))
                    },
                    users: {
                        create: {
                            userId: data.userId,
                            visibility: data.visibility
                        }
                    }
                },
                include: bookWithGenres
            });
        });
    }

    async findUserBooksByGenre(userId: number, genre: string) {
        return await database.usersBooks.findMany({
            where: {
                userId,
                bookRelation: {
                    genres: {
                        some: {
                            genreRelation: { genre }
                        }
                    }
                }
            },
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        })
    }

    async findUserBooksByLanguage(userId: number, language: string) {
        return await database.usersBooks.findMany({
            where: {
                userId,
                bookRelation: {
                    language: {
                        equals: language,
                        mode: "insensitive"
                    }
                }
            },
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        })
    }

    async findUserBooksByAuthor(userId: number, author: string) {
        return await database.usersBooks.findMany({
            where: {
                userId,
                bookRelation: {
                    author: {
                        contains: author,
                        mode: "insensitive"
                    }
                }
            },
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        })
    }

    async editBook(userId: number, bookId: number, data: {
        customTitle?: string | null;
        customCoverKey?: string | null;
        visibility?: Visibility;
        isPublic?: boolean;
    }) {
        return await database.usersBooks.update({
            where: {
                userId_bookId: { userId, bookId }
            },
            data: {
                customTitle: data.customTitle,
                customCoverKey: data.customCoverKey,
                visibility: data.visibility,
                ...(data.isPublic !== undefined && {
                    bookRelation: {
                        update: {
                            isPublic: data.isPublic
                        }
                    }
                })
            },
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        })
    }

    async deletePrivateBook(userId: number, bookId: number) {
        return await database.usersBooks.delete({
            where: {
                userId_bookId: {userId, bookId}
            }
        })
    }

    async addBookToLibrary(userId: number, bookId: number) {
        return await database.usersBooks.create({
            data: {
                userId,
                bookId
            },
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        })
    }

    async findUserBookById(userId: number, bookId: number) {
        return await database.usersBooks.findUnique({
            where: {
                userId_bookId: { userId, bookId }
            },
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        })
    }

    async findPublicBookById(bookId: number) {
        return await database.book.findFirst({
            where: {
                id: bookId,
                isPublic: true
            },
            include: bookWithGenres
        })
    }

    async updateBookSettings(userId: number, bookId: number, settings: {
        currentLocation?: string | null;
        progress?: number;
        theme?: Themes;
        fontSize?: number;
    }) {
        return await database.usersBooks.update({
            where: {
                userId_bookId: {userId, bookId}
            },
            data: settings,
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        })
    }

    async addToFavourite(userId: number, bookId: number, favourite: boolean) {
        return await database.usersBooks.update({
            where: {
                userId_bookId: {userId,bookId}
            }, 
            data: {
                favourite: favourite
            },
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        })
    }

    async findUsersFavouriteBooks(userId: number) {
        return await database.usersBooks.findMany({
            where: {
                userId,
                favourite: true
            },
            include: {
                bookRelation: {
                    include: bookWithGenres
                }
            }
        })
    }

    async findUserBooks(
        userId: number,
        filter: {
            title?: string;
            author?: string;
            language?: string;
            genre?: string;
            favourite?: boolean;
        } = {},
        options: {
            take?: number;
            skip?: number;
            sort?: "added" | "title";
        } = {}
    ) {
        const { take = 20, skip = 0, sort = "added" } = options;

        // Пользователь видит customTitle, если он задан, поэтому и искать надо по нему:
        // иначе переименованная книга не находится по своему же новому названию.
        const titleFilter = filter.title
            ? {
                  OR: [
                      { customTitle: { contains: filter.title, mode: "insensitive" as const } },
                      {
                          customTitle: null,
                          bookRelation: {
                              title: { contains: filter.title, mode: "insensitive" as const }
                          }
                      }
                  ]
              }
            : {};

        return await database.usersBooks.findMany({
            where: {
                userId,
                favourite: filter.favourite,
                ...titleFilter,
                bookRelation: {
                    author: filter.author
                        ? { contains: filter.author, mode: "insensitive" }
                        : undefined,
                    language: filter.language
                        ? { equals: filter.language, mode: "insensitive" }
                        : undefined,
                    genres: filter.genre
                        ? { some: { genreRelation: { genre: filter.genre } } }
                        : undefined
                }
            },
            include: {
                bookRelation: { include: bookWithGenres }
            },
            orderBy: sort === "title"
                ? [{ bookRelation: { title: "asc" } }, { bookId: "asc" }]
                : [{ addedAt: "desc" }, { bookId: "desc" }],
            take,
            skip
        });
    }

    async findCatalogBooks(
        userId: number,
        filter: {
            title?: string;
            genre?: string;
        } = {},
        options: {
            take?: number;
            skip?: number;
        } = {}
    ) {
        const { take = 20, skip = 0 } = options;

        return await database.book.findMany({
            where: {
                isPublic: true,
                users: {
                    none: { userId }
                },
                title: filter.title
                    ? { contains: filter.title, mode: "insensitive" }
                    : undefined,
                genres: filter.genre
                    ? { some: { genreRelation: { genre: filter.genre } } }
                    : undefined
            },
            include: {
                ...bookWithGenres,
                _count: {
                    select: { users: true }
                }
            },
            orderBy: [
                { users: { _count: "desc" } },
                { id: "asc" }
            ],
            take,
            skip
        });
    }

    async countBookOwners(bookId: number) {
        return await database.usersBooks.count({ where: { bookId } });
    }

    async deletePublicBookById(bookId: number) {
        return await database.book.delete({ where: { id: bookId } });
    }

    /** Жанры, у которых есть хотя бы одна публичная книга — для фильтров и секций Library. */
    async findGenresWithPublicBooks(limit?: number) {
        return await database.genre.findMany({
            where: {
                books: {
                    some: {
                        bookRelation: { isPublic: true }
                    }
                }
            },
            select: {
                id: true,
                genre: true,
                _count: {
                    select: {
                        books: {
                            where: {
                                bookRelation: { isPublic: true }
                            }
                        }
                    }
                }
            },
            orderBy: [
                { books: { _count: "desc" } },
                { genre: "asc" }
            ],
            take: limit
        });
    }

    /** Жанры книг, которые уже лежат в библиотеке пользователя. */
    async findGenresInUserLibrary(userId: number) {
        return await database.genre.findMany({
            where: {
                books: {
                    some: {
                        bookRelation: {
                            users: { some: { userId } }
                        }
                    }
                }
            },
            select: { id: true, genre: true },
            orderBy: { genre: "asc" }
        });
    }

    /** Самые популярные публичные книги — первая секция на экране Library. */
    async findMostPopularBooks(userId: number, take: number) {
        return await database.book.findMany({
            where: {
                isPublic: true,
                users: { none: { userId } }
            },
            include: {
                ...bookWithGenres,
                _count: { select: { users: true } }
            },
            orderBy: [
                { users: { _count: "desc" } },
                { id: "asc" }
            ],
            take
        });
    }

    /**
     * Топ-N книг внутри каждого жанра — одним запросом вместо запроса на жанр.
     * Оконная функция нумерует книги по популярности в пределах своего жанра,
     * снаружи остаются только первые `perSection`. Порядок совпадает с
     * `findCatalogBooks`: сначала по числу читателей, при равенстве — по id.
     */
    async findTopBookIdsPerGenre(userId: number, genreIds: number[], perSection: number) {
        return await database.$queryRaw<{ genreId: number; bookId: number }[]>`
            SELECT "genreId", "bookId"
            FROM (
                SELECT
                    gb."genreId" AS "genreId",
                    b."id" AS "bookId",
                    ROW_NUMBER() OVER (
                        PARTITION BY gb."genreId"
                        ORDER BY COUNT(ub."userId") DESC, b."id" ASC
                    ) AS "position"
                FROM "Book" b
                JOIN "GenresBooks" gb ON gb."bookId" = b."id"
                LEFT JOIN "UsersBooks" ub ON ub."bookId" = b."id"
                WHERE b."isPublic" = TRUE
                  AND gb."genreId" IN (${Prisma.join(genreIds)})
                  AND NOT EXISTS (
                      SELECT 1
                      FROM "UsersBooks" owned
                      WHERE owned."bookId" = b."id" AND owned."userId" = ${userId}
                  )
                GROUP BY gb."genreId", b."id"
            ) ranked
            WHERE "position" <= ${perSection}
            ORDER BY "genreId", "position"
        `;
    }

    /** Книги по списку id — той же формы, что и остальной каталог. */
    async findCatalogBooksByIds(bookIds: number[]) {
        return await database.book.findMany({
            where: { id: { in: bookIds } },
            include: {
                ...bookWithGenres,
                _count: { select: { users: true } }
            }
        });
    }

    async findPublicBookByIdRaw(bookId: number) {
        return await database.book.findFirst({
            where: { id: bookId, isPublic: true },
            include: {
                ...bookWithGenres,
                _count: { select: { users: true } }
            }
        });
    }

}

export const bookRepository = new BookRepository();
