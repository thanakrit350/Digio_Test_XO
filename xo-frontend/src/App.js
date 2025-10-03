import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import HistoryPage from "./pages/history/HistoryPage";
import ReplayPage from "./pages/replay/ReplayPage";
import PvePage from "./pages/pve/PvePage";
import PvpPage from "./pages/pvp/PvpPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/replay/:id" element={<ReplayPage />} />
          <Route path="/pve" element={<PvePage />} />
          <Route path="/pvp" element={<PvpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
