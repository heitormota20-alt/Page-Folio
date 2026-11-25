"""
Gera public/home/personagem.webp na maior resolução possível, mantendo o visual
do design:

  - cor, tons e retoques  ← o recorte do design (assets/design/personagem-recortado.png,
                             quadro 1920 × 1080, com a correção de cor feita no Photoshop)
  - detalhe fino (nitidez) ← a imagem original do avatar (assets/design/personagem-original.jpeg,
                             a geração do Gemini, sem o reamostrar do Photoshop)

O detalhe é a diferença entre o original e ele mesmo reduzido à escala do design;
somado ao recorte ampliado, devolve a nitidez sem mudar a cor. Onde o design foi
retocado (ex.: o logo apagado da camiseta) o detalhe não entra. A borda (alfa)
vem do recorte do design.

Uso:  python scripts/build-character.py [original]
O original pode ser uma versão ampliada (ex.: 2× pelo "Super Resolution" do
Photoshop) da mesma imagem — a escala é ajustada pela largura.

Requer numpy, pillow e scipy.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
ORIGINAL = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'assets/design/personagem-original.jpeg'
CUTOUT = ROOT / 'assets/design/personagem-recortado.png'
OUT = ROOT / 'public/home/personagem.webp'

# Alinhamento medido: design = original(1844 px de largura) × 0.856 + (162, −240)
BASE_WIDTH, BASE_SCALE, OFFSET = 1844, 0.856, (162, -240)
# Caixa do personagem no quadro do design (= CHARACTER_BOX em src/components/hero-layout.ts)
X0, Y0, X1, Y1 = 289, 0, 1611, 1080


def main():
    src = Image.open(ORIGINAL).convert('RGB')
    cut = Image.open(CUTOUT).convert('RGBA')
    s = BASE_SCALE * BASE_WIDTH / src.width
    dw, dh = X1 - X0, Y1 - Y0
    sx0, sy0 = (X0 - OFFSET[0]) / s, (Y0 - OFFSET[1]) / s
    w, h = round(dw / s), round(dh / s)
    orig = src.crop((round(sx0), round(sy0), round(sx0) + w, round(sy0) + h))

    o_hi = np.asarray(orig).astype(np.float32) / 255
    o_lo = np.asarray(orig.resize((dw, dh), Image.LANCZOS).resize((w, h), Image.LANCZOS)).astype(np.float32) / 255
    detail = o_hi - o_lo

    # recorte ampliado com alfa pré-multiplicado (borda limpa)
    d = np.asarray(cut.crop((X0, Y0, X1, Y1))).astype(np.float32) / 255
    def up(arr):
        return np.stack([np.asarray(Image.fromarray(arr[..., i]).resize((w, h), Image.LANCZOS))
                         for i in range(arr.shape[2])], -1)
    pm_up = up((d[..., :3] * d[..., 3:]).astype(np.float32))
    a_up = np.clip(up(d[..., 3:4].astype(np.float32))[..., 0], 0, 1)
    rgb_up = np.clip(pm_up / np.clip(a_up, 1e-3, 1)[..., None], 0, 1)

    # retoques = diferença grande nas baixas frequências (bordas nítidas não contam)
    blur = lambda x, r: ndimage.gaussian_filter(x, sigma=(r, r, 0))
    inner = a_up > 0.98
    retouch = (np.abs(blur(rgb_up, 5) - blur(o_lo, 5)).max(2) > 0.12) & inner
    keep = inner & ~ndimage.binary_dilation(retouch, iterations=10)
    weight = ndimage.gaussian_filter(ndimage.binary_erosion(keep, iterations=1).astype(np.float32), 2.5)

    out = np.clip(rgb_up + detail * weight[..., None], 0, 1)
    rgba = (np.dstack([out, a_up]) * 255 + 0.5).astype(np.uint8)
    img = Image.fromarray(rgba, 'RGBA')
    img.save(OUT, 'WEBP', quality=96, alpha_quality=100, method=6)
    print(f'{OUT.relative_to(ROOT)}: {img.width}×{img.height}, {OUT.stat().st_size // 1024} KB '
          f'({w / dw:.2f}× o recorte do design)')


if __name__ == '__main__':
    main()
