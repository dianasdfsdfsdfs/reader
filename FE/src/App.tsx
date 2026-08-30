import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AuthPage } from "@/features/auth/AuthPage";
import { AppLayout } from "@/layouts/AppLayout";
import { HomePage } from "@/features/home/HomePage";
import { LibraryPage } from "@/features/library/LibraryPage";
import { UploadPage } from "@/features/upload/UploadPage";
import { BookDetailPage } from "@/features/books/BookDetailPage";
import { CollectionPage } from "@/features/collections/CollectionPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { ToastProvider } from "@/shared/ui/Toast";
import { PageLoader } from "@/shared/ui/Spinner";

// epub.js с его jszip тянет ~400 КБ и нужен только в читалке — грузим отдельным чанком.
const ReaderPage = lazy(() =>
    import("@/features/reader/ReaderPage").then((module) => ({ default: module.ReaderPage }))
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false
        }
    }
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ToastProvider>
                    <AuthProvider>
                        <Routes>
                            <Route path="/auth" element={<AuthPage />} />

                            <Route element={<ProtectedRoute />}>
                                {/* Читалка — на весь экран, без общей навигации. */}
                                <Route
                                    path="/read/:id"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <ReaderPage />
                                        </Suspense>
                                    }
                                />

                                <Route element={<AppLayout />}>
                                    <Route index element={<HomePage />} />
                                    <Route path="/library" element={<LibraryPage />} />
                                    <Route path="/upload" element={<UploadPage />} />
                                    <Route path="/book/:id" element={<BookDetailPage />} />
                                    <Route path="/collection/:id" element={<CollectionPage />} />
                                    <Route path="/profile" element={<ProfilePage />} />
                                </Route>
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AuthProvider>
                </ToastProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}
