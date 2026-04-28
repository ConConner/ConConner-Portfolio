// src/main.tsx
import "@/index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Content from "@/pages/Content";
import { ThemeProvider } from "./components/theme-provider";
import { ContentDetailRoute } from "./routes/ContentDetailRoute";
import { getAllContent, getAllGames } from "./data/db";
import PatcherPage from "./pages/PatcherPage";

const content = getAllContent();
const games = getAllGames();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Content />} />
            <Route
              path="/projects/:id"
              element={<ContentDetailRoute games={games} content={content} />}
            />
            <Route path="/patch/:hackId" element={<PatcherPage />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
