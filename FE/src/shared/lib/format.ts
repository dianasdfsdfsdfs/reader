/** «13 книг» / «1 книга» / «22 книги» — иначе счётчик в карточке коллекции читается коряво. */
export const pluralizeBooks = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return `${count} книга`;
    }

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return `${count} книги`;
    }

    return `${count} книг`;
};

export const initialsOf = (title: string) =>
    title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("");
