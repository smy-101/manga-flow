import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Library from "./pages/Library";
import Reader from "./pages/Reader";
import Settings from "./pages/Settings";
import SetupGuide from "./pages/SetupGuide";
import { useSettingsStore } from "./stores/settingsStore";

function AppRoutes() {
  const libraryPath = useSettingsStore((s) => s.libraryPath);

  if (!libraryPath) {
    return <SetupGuide />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Library />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/reader/:bookId" element={<Reader />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
