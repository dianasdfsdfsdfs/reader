import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { PageLoader } from "@/shared/ui/Spinner";

export function ProtectedRoute() {
    const { user, ready } = useAuth();
    const location = useLocation();

    if (!ready) {
        return (
            <div className="grid min-h-dvh place-items-center">
                <PageLoader />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}
