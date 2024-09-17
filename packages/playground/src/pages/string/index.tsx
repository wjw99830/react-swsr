import { createRoot, hydrateRoot } from "react-dom/client";
import { getSwsrInfo } from "@react-swsr/runtime";
import App from "./app";

const root = document.getElementById("root")!;
if (getSwsrInfo().hit) {
  hydrateRoot(root, <App />);
} else {
  createRoot(root).render(<App />);
}
