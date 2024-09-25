import { createContext } from "react";
import { IStreamContext, IStringContext } from "./typings";

export const StreamContext = createContext<IStreamContext | null>(null);
export const StringContext = createContext<IStringContext | null>(null);

export function log(message: string) {
  console.log(
    `%cSWSR%c ${message}`,
    "background-color: #308b43; color: #efedef; padding: 2px 4px; border-radius: 4px",
    ""
  );
}
