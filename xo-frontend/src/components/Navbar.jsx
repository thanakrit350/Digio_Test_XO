import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Layout.css";

export default function Navbar() {
  const getClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  return (
    <header className="nav-wrap">
      <div className="nav-container">
        <div className="brand">
          <span className="brand-xo">XO</span>
          <span className="brand-sub">Digio</span>
        </div>

        <nav className="nav-menu">
          <NavLink to="/" className={getClass}>Home</NavLink>
          <NavLink to="/history" className={getClass}>History</NavLink>
        </nav>

        <div className="nav-right">
        </div>
      </div>
    </header>
  );
}
