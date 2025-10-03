import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../styles/Layout.css";

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main id="main" className="app-main">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
