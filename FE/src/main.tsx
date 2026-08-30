import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Тема выбирается в профиле и живёт в localStorage; ставим её до первой отрисовки,
// чтобы страница не моргала светлым фоном.
document.documentElement.dataset.theme =
    localStorage.getItem("reader.theme") === "dark" ? "dark" : "light";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
