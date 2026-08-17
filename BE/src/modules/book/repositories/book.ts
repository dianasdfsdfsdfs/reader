import database from "@/db";
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
            data: settings
        })
    }

    async addToFavourite(userId: number, bookId: number, favourite: boolean) {
        return await database.usersBooks.update({
            where: {
                userId_bookId: {userId,bookId}
            }, 
            data: {
                favourite: favourite
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

        return await database.usersBooks.findMany({
            where: {
                userId,
                favourite: filter.favourite,
                bookRelation: {
                    title: filter.title
                        ? { contains: filter.title, mode: "insensitive" }
                        : undefined,
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

}

export const bookRepository = new BookRepository();
