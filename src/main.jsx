import React from "react";
import ReactDOM from "react-dom/client";
import CompensationCalculator from "../compensation-calculator.jsx";

// Global reset
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  html { -webkit-text-size-adjust: 100%; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CompensationCalculator />
  </React.StrictMode>
);
