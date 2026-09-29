"use client";

import { useEffect } from "react";

/**
 * Disuasión frente a la inspección casual (solo en producción):
 * bloquea el menú contextual y los atajos que abren las herramientas de desarrollo,
 * el código fuente o "guardar página".
 *
 * No es una protección absoluta: el navegador necesita descargar el código para mostrar
 * la página, y siempre puede abrirse desde su menú. Lo que sí garantiza la build de
 * producción es que ese código llega compilado y minificado, sin comentarios ni mapas de origen.
 */
export function InspectGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      // Tecla física: en macOS, Option cambia el carácter (Cmd+Opt+I llega como "ˆ").
      const code = e.code;
      const mod = e.ctrlKey || e.metaKey;
      const blocked =
        code === "F12" ||
        // Herramientas de desarrollo: Ctrl+Shift+I/J/C/K (Windows/Linux) y Cmd+Opt+I/J/C (macOS).
        (mod && (e.shiftKey || e.altKey) && ["KeyI", "KeyJ", "KeyC", "KeyK"].includes(code)) ||
        // Ver código fuente y guardar página: Ctrl/Cmd+U, Ctrl/Cmd+S, Cmd+Opt+U.
        (mod && !e.shiftKey && (code === "KeyS" || (code === "KeyU" && (e.metaKey || !isTerminalTarget(e)))));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("contextmenu", onContextMenu, { capture: true });
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      window.removeEventListener("contextmenu", onContextMenu, { capture: true });
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, []);

  return null;
}

/** Ctrl+U dentro de la terminal borra la línea (como en bash): no se intercepta allí. */
function isTerminalTarget(e: KeyboardEvent) {
  return e.target instanceof HTMLElement && e.target.classList.contains("term-hidden-input");
}
