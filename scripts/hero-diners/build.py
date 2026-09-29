"""Separa a los cinco comensales de la fotografía del hero.

Uso (desde la raíz del proyecto):  python3 scripts/hero-diners/build.py

Salida:
  public/images/hero/base.webp       mesa vacía (fondo reconstruido bajo cada comensal)
  public/images/hero/diner-{i}.webp  recorte RGBA de cada comensal
  lib/heroDiners.ts                  cajas y siluetas en el espacio 2400x1500
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from shapes import TABLE, POLYS, SUBTRACT_TABLE

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "public/images/hero-dining-philosophers.webp")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "public/images/hero")
img = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
H, W, _ = img.shape

def poly_mask(pts, dilate=0, blur=0):
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    if dilate: m = m.filter(ImageFilter.MaxFilter(dilate * 2 + 1))
    if blur: m = m.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(m).astype(np.float32) / 255

def ellipse_mask():
    """Elipse de la mesa con antialias (dibujada al doble y reducida)."""
    t = TABLE
    m = Image.new("L", (W * 2, H * 2), 0)
    ImageDraw.Draw(m).ellipse([2 * (t["cx"] - t["rx"]), 2 * (t["cy"] - t["ry"]), 2 * (t["cx"] + t["rx"]), 2 * (t["cy"] + t["ry"])], fill=255)
    return np.asarray(m.resize((W, H), Image.BOX)).astype(np.float32) / 255

table_aa = ellipse_mask()
table = table_aa > 0.5

# Hueco por comensal: polígono dilatado; en P0, P1, P4 no invade la mesa.
holes = []
for i, pts in POLYS.items():
    h = poly_mask(pts, dilate=10) > 0.5
    if SUBTRACT_TABLE[i]: h &= ~table
    holes.append(h)
hole = np.any(holes, axis=0)

def push_pull(color, known):
    """Relleno suave: pirámide de medias ponderadas (push) y reconstrucción (pull)."""
    levels = []
    c, k = color * known[..., None], known.astype(np.float32)
    while min(k.shape) > 4:
        levels.append((c, k))
        h2, w2 = k.shape[0] // 2 * 2, k.shape[1] // 2 * 2
        c = c[:h2, :w2].reshape(h2 // 2, 2, w2 // 2, 2, 3).sum((1, 3))
        k = k[:h2, :w2].reshape(h2 // 2, 2, w2 // 2, 2).sum((1, 3))
    fill = c / np.maximum(k, 1e-6)[..., None]
    for c, k in reversed(levels):
        up = np.stack([np.asarray(Image.fromarray(fill[..., ch]).resize((k.shape[1], k.shape[0]), Image.BILINEAR)) for ch in range(3)], -1)
        mean = c / np.maximum(k, 1e-6)[..., None]
        w = np.clip(k, 0, 1)[..., None]
        fill = mean * w + up * (1 - w)
    return fill

# Mesa y suelo se rellenan por separado: el borde de la mesa queda nítido.
fill_in = push_pull(img, table & ~hole)
fill_out = push_pull(img, ~table & ~hole)
fill = fill_in * table_aa[..., None] + fill_out * (1 - table_aa[..., None])

# Grano para que el relleno no se vea plástico.
rng = np.random.default_rng(6)
grain = rng.normal(0, 2.2, (H, W, 1)).astype(np.float32)
fill = fill + grain

soft_hole = np.asarray(Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)[..., None] / 255
base = img * (1 - soft_hole) + fill * soft_hole

# El plato de P3 quedaba tapado por su cabeza: se reconstruye reflejando su mitad derecha, intacta.
PLATE = dict(cx=1047, cy=911, r=57)
cx, cy, r = PLATE["cx"], PLATE["cy"], PLATE["r"]
y0, y1 = cy - r - 8, cy + r + 8
mirror = base[y0:y1, cx:cx + r + 8][:, ::-1]
patch = np.zeros_like(base)
patch[y0:y1, cx - r - 8:cx] = mirror
yy, xx = np.mgrid[0:H, 0:W]
circle = np.clip((r - np.hypot(xx - cx, (yy - cy) * 1.06)) / 4, 0, 1)
left = np.clip((cx - xx) / 6, 0, 1)
plate_mask = (circle * left * soft_hole[..., 0])[..., None]
base = base * (1 - plate_mask) + patch * plate_mask
Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).save(f"{OUT}/base.webp", "WEBP", quality=86, method=6)

# Matte por diferencia: solo lo que difiere del fondo reconstruido viaja con el comensal.
def blur(a, r):
    return np.stack([np.asarray(Image.fromarray(np.clip(a[..., ch], 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))) for ch in range(3)], -1).astype(np.float32)
diff = np.abs(blur(img, 2) - blur(base, 2)).max(-1)
# P0 está bajo el haz de luz: el suelo texturado exige un umbral más alto.
THRESHOLD = {0: (11, 14)}
CORE_ERODE = {1: 20, 2: 20, 3: 20, 4: 20}

def matte_for(i):
    lo, span = THRESHOLD.get(i, (4, 10))
    raw = np.clip((diff - lo) / span, 0, 1)
    raw_img = Image.fromarray((raw * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2.5))
    return np.asarray(raw_img).astype(np.float32) / 255

meta = []
for i, pts in POLYS.items():
    matte = matte_for(i)
    if i in CORE_ERODE:
        # Núcleo opaco: la túnica oscura sobre suelo oscuro no debe volverse translúcida.
        core = Image.new("L", (W, H), 0)
        ImageDraw.Draw(core).polygon(pts, fill=255)
        core = core.filter(ImageFilter.MinFilter(CORE_ERODE[i] * 2 + 1)).filter(ImageFilter.GaussianBlur(8))
        matte = np.maximum(matte, np.asarray(core).astype(np.float32) / 255)
    region = poly_mask(pts, dilate=6, blur=4)
    if SUBTRACT_TABLE[i]: region *= (1 - table_aa)
    alpha = np.clip(matte * region, 0, 1)
    ys, xs = np.where(alpha > 0.02)
    x0, x1, y0, y1 = xs.min() - 4, xs.max() + 5, ys.min() - 4, ys.max() + 5
    rgba = np.dstack([img, alpha[..., None] * 255])[y0:y1, x0:x1]
    Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8)).save(f"{OUT}/diner-{i}.webp", "WEBP", quality=88, method=6)
    meta.append({"id": i, "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0), "poly": pts})

lines = [
    "/** Generado por scripts/hero-diners/build.py — espacio de coordenadas 2400 × 1500. */",
    f"export const HERO_SIZE = {{ width: {W}, height: {H} }} as const;",
    "",
    f"export const HERO_TABLE = {{ cx: {TABLE['cx']}, cy: {TABLE['cy']}, rx: {TABLE['rx']}, ry: {TABLE['ry']} }} as const;",
    "",
    "export interface HeroDinerShape {",
    "  id: number;",
    "  /** Caja del recorte. */",
    "  x: number;",
    "  y: number;",
    "  w: number;",
    "  h: number;",
    "  /** Silueta para el área interactiva. */",
    "  poly: [number, number][];",
    "}",
    "",
    "export const HERO_DINERS: HeroDinerShape[] = [",
]
for d in meta:
    pts = ", ".join(f"[{x}, {y}]" for x, y in d["poly"])
    lines.append(f'  {{ id: {d["id"]}, x: {d["x"]}, y: {d["y"]}, w: {d["w"]}, h: {d["h"]}, poly: [{pts}] }},')
lines.append("];")
open(os.path.join(ROOT, "lib/heroDiners.ts"), "w").write("\n".join(lines) + "\n")
print("done", [(m["id"], m["w"], m["h"]) for m in meta])
