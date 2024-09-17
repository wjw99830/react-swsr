import { FC } from "react";
import { register } from "@react-swsr/runtime";

export const App: FC = () => {
  return (
    <div>
      <h1>Main</h1>
      <button
        style={{ display: "block", marginBottom: 24 }}
        onClick={() => register("../stream/index.swsr.js")}
      >
        streaming rendering
      </button>
      <button
        style={{ display: "block" }}
        onClick={() => register("../string/index.swsr.js")}
      >
        string rendering
      </button>
    </div>
  );
};
