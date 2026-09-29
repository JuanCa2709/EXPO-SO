/**
 * Perfil del dispositivo para adaptar el coste de la página (solo cliente).
 * Las APIs de memoria y red solo existen en Chromium: sin ellas se asume un equipo medio.
 */

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

export interface DeviceProfile {
  /** Equipo modesto: menos memoria, menos núcleos, ahorro de datos o red lenta. */
  lowPower: boolean;
  /** Pantalla táctil principal (móvil / tablet). */
  coarse: boolean;
  saveData: boolean;
  slowNetwork: boolean;
  /** GB de memoria reportados (o estimados). */
  memory: number;
  dpr: number;
}

export function getDeviceProfile(): DeviceProfile {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: NetworkInformation };
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const memory = nav.deviceMemory ?? (coarse ? 4 : 8);
  const cores = nav.hardwareConcurrency ?? 4;
  const saveData = Boolean(nav.connection?.saveData);
  const slowNetwork = /(^|-)2g$|^3g$/.test(nav.connection?.effectiveType ?? "");
  // Algunos navegadores (Brave, Safari) falsean o limitan núcleos y memoria por privacidad:
  // solo se considera modesto un equipo con pocos recursos en ambos, o muy pocos en uno.
  const constrained = memory <= 2 || cores <= 2 || (memory <= 4 && cores <= 4);
  return {
    lowPower: constrained || saveData || slowNetwork,
    coarse,
    saveData,
    slowNetwork,
    memory,
    dpr: window.devicePixelRatio || 1,
  };
}
