// src/main.tsx
import "@/index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Bootstrap } from "@/components/Bootstrap";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Content from "@/pages/Content";
import { ThemeProvider } from "./components/theme-provider";
import { ContentDetailRoute } from "./routes/ContentDetailRoute";
import { getAllContent, getAllGames, initDb } from "./data/db";
import PatcherPage from "./pages/PatcherPage";
import { AuthGuard } from "@/admin/AuthGuard";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminContentForm from "@/pages/admin/AdminContentForm";
import AdminTimeline from "@/pages/admin/AdminTimeline";
import AdminGames from "@/pages/admin/AdminGames";

const root = ReactDOM.createRoot(document.getElementById("root")!);

const renderBootstrap = (error?: unknown) =>
  root.render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Bootstrap error={error} />
      </ThemeProvider>
    </React.StrictMode>,
  );

renderBootstrap();

try {
  // Everything downstream reads the database synchronously, so it is fetched
  // once here before the router mounts.
  await initDb();
} catch (error) {
  renderBootstrap(error);
  throw error;
}

const content = getAllContent();
const games = getAllGames();

root.render(
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

            {/* Admin, deliberately not linked from the public nav. */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AuthGuard>
                  <AdminDashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/admin/content/new"
              element={
                <AuthGuard>
                  <AdminContentForm />
                </AuthGuard>
              }
            />
            <Route
              path="/admin/content/:id/edit"
              element={
                <AuthGuard>
                  <AdminContentForm />
                </AuthGuard>
              }
            />
            <Route
              path="/admin/timeline"
              element={
                <AuthGuard>
                  <AdminTimeline />
                </AuthGuard>
              }
            />
            <Route
              path="/admin/games"
              element={
                <AuthGuard>
                  <AdminGames />
                </AuthGuard>
              }
            />
          </Routes>
        </Layout>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
