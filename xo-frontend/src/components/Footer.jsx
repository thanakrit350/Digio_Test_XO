import React from "react";
import "../styles/Layout.css";

export default function Footer() {
  return (
    <footer className="footer-wrap">
      <div className="footer-container">
        © {new Date().getFullYear()} <b>XO Game</b> · Digio
        <span className="dot">•</span>
        <span >thanakrit7578@gmail.com</span>
      </div>
    </footer>
  );
}
