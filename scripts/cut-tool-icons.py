"""
Gera public/ferramentas/*.webp — os ícones 3D das ferramentas, recortados da
folha assets/design/ferramentas-3d.jpeg (8 ícones sobre fundo branco, gerada no
Gemini), com fundo transparente.

Por que não pela cor: o fundo é branco, mas as sombras de chão são cinza (e a do
Canva, roxa) e a quina dos ícones tem um filete de brilho quase branco — pela
cor, sombra entra e brilho sai. O que separa bem é a NITIDEZ: fundo e sombras
são degradês suaves; a borda do ícone é um corte seco.

  1. o fundo é tudo o que se alcança a partir das beiradas da folha andando só
     por pixels "suaves" (gradiente baixo) e sem cor forte — a inundação passa
     pelas sombras e para na borda dos ícones;
  2. o resto, com os buracos preenchidos, são os ícones: os 8 maiores pedaços,
     em ordem de leitura (2 linhas × 4);
  3. cada ícone é uma placa vista em perspectiva — convexa. O contorno final é o
     fecho convexo do pedaço: tapa onde a inundação comeu um filete de brilho e
     deixa a borda lisa. Desenhado com supersampling (borda antisserrilhada) e
     recuado meio pixel, para não trazer o branco do fundo junto;
  4. cada ícone vai para um quadro quadrado igual, centrado e na mesma escala.
     A sombra fica por conta do CSS (a de chão da imagem não faz sentido num
     ícone que gira no ar).

uso: python scripts/cut-tool-icons.py [pasta-de-previa]
     (com a pasta, salva também os ícones sobre o azul da página, para conferir)
requer: numpy, scipy e pillow (com WebP)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.spatial import ConvexHull

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'design' / 'ferramentas-3d.jpeg'
OUT = ROOT / 'public' / 'ferramentas'
# ordem de leitura da folha
NAMES = ['figma', 'canva', 'after-effects', 'photoshop', 'illustrator', 'capcut', 'blender', 'claude']

SIZE = 640  # lado do quadro final (px) — o maior ícone chega a ~330px de CSS; 2× na tela retina
FILL = 0.9  # fração do quadro ocupada pelo lado maior do ícone
GRAD_MAX = 0.12  # gradiente abaixo disso é "suave" (fundo/sombra); borda de ícone passa de 0,8
SAT_MAX = 0.6  # cor mais forte que isso não é fundo, por mais suave que seja
INSET = 2.5  # recuo do contorno (px da folha), contra o fio branco do fundo
SS = 4  # supersampling do contorno
QUALITY = 88
PAGE_BLUE = (0, 54, 178)  # #0036b2, só para a prévia


def hull_mask(comp, box):
    """Fecho convexo do pedaço, antisserrilhado, dentro da caixa (y0, y1, x0, x1)."""
    y0, y1, x0, x1 = box
    edge = comp & ~ndi.binary_erosion(comp)
    ys, xs = np.nonzero(edge)
    pts = np.column_stack([xs + 0.5, ys + 0.5])  # centros dos pixels
    hull = pts[ConvexHull(pts).vertices]
    # o fecho passa pelos centros dos pixels da borda: empurra meio pixel para
    # fora (chega à aresta real) e recua INSET
    c = hull.mean(axis=0)
    d = hull - c
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    hull = hull + d * (0.5 - INSET)
    w, h = x1 - x0, y1 - y0
    img = Image.new('L', (w * SS, h * SS), 0)
    poly = [((x - x0) * SS, (y - y0) * SS) for x, y in hull]
    ImageDraw.Draw(img).polygon(poly, fill=255)
    return np.asarray(img.resize((w, h), Image.BOX), dtype=np.float32) / 255


def main():
    preview_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    rgb = np.asarray(Image.open(SRC).convert('RGB'), dtype=np.float32) / 255
    mx = rgb.max(axis=2)
    sat = (mx - rgb.min(axis=2)) / np.maximum(mx, 1e-6)
    smooth = np.stack([ndi.gaussian_filter(rgb[..., c], 1.0) for c in range(3)], axis=-1)
    grad = np.max([np.hypot(ndi.sobel(smooth[..., c], 0), ndi.sobel(smooth[..., c], 1)) for c in range(3)], axis=0)

    # 1. inundação a partir das beiradas
    passable = (grad < GRAD_MAX) & (sat < SAT_MAX)
    lab, _ = ndi.label(passable)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    background = np.isin(lab, border[border > 0])

    # 2. os ícones
    icons = ndi.binary_fill_holes(~background)
    icons = ndi.binary_opening(icons, iterations=3)  # fiapos da inundação
    labels, n = ndi.label(icons)
    sizes = ndi.sum(icons, labels, range(1, n + 1))
    keep = np.argsort(sizes)[::-1][: len(NAMES)] + 1
    if len(keep) < len(NAMES):
        sys.exit(f'achei só {len(keep)} ícones na folha')
    h_img = rgb.shape[0]
    centers = ndi.center_of_mass(icons, labels, keep)
    order = sorted(range(len(keep)), key=lambda i: (centers[i][0] > h_img / 2, centers[i][1]))

    OUT.mkdir(parents=True, exist_ok=True)
    previews = []
    for name, i in zip(NAMES, order):
        comp = labels == keep[i]
        ys, xs = np.nonzero(comp)
        y0, y1 = max(0, ys.min() - 2), min(rgb.shape[0], ys.max() + 3)
        x0, x1 = max(0, xs.min() - 2), min(rgb.shape[1], xs.max() + 3)
        side = max(y1 - y0, x1 - x0)

        # 3. contorno convexo
        alpha = hull_mask(comp, (y0, y1, x0, x1))
        rgba = np.dstack([rgb[y0:y1, x0:x1], alpha])
        tile = Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA')

        # 4. mesmo quadro para todos
        scale = SIZE * FILL / side
        tw, th = round(tile.width * scale), round(tile.height * scale)
        tile = tile.convert('RGBa').resize((tw, th), Image.LANCZOS).convert('RGBA')
        canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
        canvas.alpha_composite(tile, ((SIZE - tw) // 2, (SIZE - th) // 2))
        out = OUT / f'{name}.webp'
        canvas.save(out, 'WEBP', quality=QUALITY, method=6)
        print(f'{out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB')
        previews.append(canvas)

    if preview_dir:
        sheet = Image.new('RGBA', (SIZE * 4, SIZE * 2), PAGE_BLUE + (255,))
        for k, im in enumerate(previews):
            sheet.alpha_composite(im, ((k % 4) * SIZE, (k // 4) * SIZE))
        sheet.convert('RGB').save(preview_dir / 'ferramentas-previa.png')
        print('previa:', preview_dir / 'ferramentas-previa.png')


if __name__ == '__main__':
    main()
