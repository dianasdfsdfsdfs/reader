export interface EpubMetadata {
    title: string;
    author: string;
    language: string;
    cover: File | null;
}

const stripExtension = (name: string) => name.replace(/\.epub$/i, "").replace(/[_-]+/g, " ").trim();

/**
 * Достаём название, автора, язык и обложку прямо из файла в браузере,
 * чтобы форма загрузки открывалась уже заполненной. Бэкенд .epub не парсит.
 */
export async function readEpubMetadata(file: File): Promise<EpubMetadata> {
    const fallback: EpubMetadata = {
        title: stripExtension(file.name),
        author: "",
        language: "",
        cover: null
    };

    try {
        // epub.js вместе с jszip весит ~400 КБ — подгружаем только когда файл выбран.
        const { default: ePub } = await import("epubjs");
        const book = ePub(await file.arrayBuffer());
        const metadata = await book.loaded.metadata;

        let cover: File | null = null;

        try {
            const coverUrl = await book.coverUrl();

            if (coverUrl) {
                const blob = await fetch(coverUrl).then((response) => response.blob());

                // Бэкенд принимает только jpeg / png / webp.
                if (/^image\/(jpeg|png|webp)$/.test(blob.type)) {
                    const extension = blob.type.split("/")[1].replace("jpeg", "jpg");

                    cover = new File([blob], `cover.${extension}`, { type: blob.type });
                }

                URL.revokeObjectURL(coverUrl);
            }
        } catch {
            // Обложка необязательна — если её нет или она в экзотическом формате, идём дальше.
        }

        const result: EpubMetadata = {
            title: metadata.title?.trim() || fallback.title,
            author: metadata.creator?.trim() ?? "",
            language: metadata.language?.trim().slice(0, 35) ?? "",
            cover
        };

        book.destroy();

        return result;
    } catch {
        return fallback;
    }
}
