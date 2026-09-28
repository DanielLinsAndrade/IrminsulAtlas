import { useContext } from "react";
import { ShellContext, ShellContextValue } from "./shellContextDef";

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error("useShell deve ser utilizado dentro de um ShellProvider.");
  }
  return context;
}