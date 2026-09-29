/**
 * Geometría de la ventana de GNOME Terminal en el último frame de la secuencia del portátil
 * (medida sobre 1280×720). La comparten el servidor (fondo de la ventana) y el cliente (posición).
 */

/** Ventana completa, en fracciones de la imagen. */
export const WINDOW_IN_FRAME = { x: 50 / 1280, y: 11 / 720, w: 1181 / 1280, h: 682 / 720 };

/** Ancho de un carácter de la terminal del frame, en fracción del ancho de la imagen. */
export const FRAME_CHAR = 10.1 / 1280;
