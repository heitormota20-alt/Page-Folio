"""
Gera public/personagem/ — os quadros do vídeo do personagem SEM o fundo azul,
em WebP com transparência, recortados à área do personagem.

Por que quadros e não vídeo: navegadores não mostram vídeo com transparência de
forma confiável (o Safari não lê WebM com alpha) e recortar ao vivo (WebGL)
perde nitidez e deixa borda. Aqui o recorte é feito uma vez, com calma:

  1. alpha pela "azulidade" (b − r): o fundo é azul/petróleo, o personagem é
     quente (pele, cabelo, jaqueta) ou neutro (camiseta preta);
  2. a borda é suavizada e apertada pela curva do alpha (sem erosão, que
     apagaria linhas finas como a haste dos óculos);
  3. descontaminação: nos pixels de borda, a cor vem do interior mais próximo
     (some o azul/escuro que vazava do fundo);
  4. todos os quadros são cortados na mesma caixa (a união do personagem em
     todos eles), guardada em manifest.json para o site posicionar igual ao
     vídeo original (object-fit: cover).

uso: python scripts/cutout-frames.py [qualidade]
requer: numpy, pillow e ffmpeg no PATH
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public' / 'Personagem_Definitivo_scrub.mp4'
OUT = ROOT / 'public' / 'personagem'
QUALITY = int(sys.argv[1]) if len(sys.argv) > 1 else 82

# limiares da "azulidade" (b − r, 0–1): abaixo de LO é personagem, acima de HI é fundo
LO, HI = 0.05, 0.15


def probe():
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames',
         '-show_entries', 'stream=width,height,nb_read_frames', '-of', 'csv=p=0', str(SRC)],
        capture_output=True, text=True, check=True).stdout.strip().split(',')
    return int(out[0]), int(out[1]), int(out[2])


def frames(w, h):
    """Quadros RGB (float 0–1) direto do ffmpeg, sem PNGs temporários."""
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(SRC), '-f', 'rawvideo',
                          '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    size = w * h * 3
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3).astype(np.float32) / 255
    p.wait()


def box3(a):
    """Média 3×3 (suaviza a borda do alpha)."""
    p = np.pad(a, 1, mode='edge')
    return sum(p[y:y + a.shape[0], x:x + a.shape[1]] for y in range(3) for x in range(3)) / 9


def key(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    t = np.clip(((b - r) - LO) / (HI - LO), 0, 1)
    a = 1 - t * t * (3 - 2 * t)  # smoothstep invertido
    # suaviza e "aperta" pela curva (não por erosão: erosão apaga linhas finas,
    # como a haste dos óculos)
    a = np.clip((box3(a) - 0.12) / 0.88, 0, 1)
    return a


def decontaminate(rgb, a, steps=6):
    """Pixels de borda herdam a cor do interior mais próximo (dilatação de cor)."""
    solid = a > 0.97
    col = np.where(solid[..., None], rgb, 0)
    wsum = solid.astype(np.float32)
    for _ in range(steps):
        pc = np.pad(col, ((1, 1), (1, 1), (0, 0)))
        pw = np.pad(wsum, 1)
        acc = sum(pc[y:y + a.shape[0], x:x + a.shape[1]] for y in range(3) for x in range(3))
        acw = sum(pw[y:y + a.shape[0], x:x + a.shape[1]] for y in range(3) for x in range(3))
        grow = (wsum == 0) & (acw > 0)
        col = np.where(grow[..., None], acc / np.maximum(acw, 1e-6)[..., None], col)
        wsum = np.where(grow, 1.0, wsum)
    edge = (a > 0.01) & (a < 0.97)
    out = rgb.copy()
    near = edge & (wsum > 0)
    out[near] = col[near]
    # bordas longe do interior (linhas finas, ex.: haste dos óculos): tira o azul
    far = edge & (wsum == 0)
    out[..., 2] = np.where(far, np.minimum(out[..., 2], np.maximum(out[..., 0], out[..., 1]) + 0.02), out[..., 2])
    return out


def main():
    w, h, n = probe()
    print(f'{SRC.name}: {w}×{h}, {n} quadros')

    # passada 1: caixa do personagem em todos os quadros
    x0, y0, x1, y1 = w, h, 0, 0
    for rgb in frames(w, h):
        a = key(rgb)
        ys, xs = np.nonzero(a > 0.02)
        x0, x1 = min(x0, xs.min()), max(x1, xs.max())
        y0, y1 = min(y0, ys.min()), max(y1, ys.max())
    pad = 6
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(w, x1 + pad + 1), min(h, y1 + pad + 1)
    print(f'caixa do personagem: x {x0}–{x1}, y {y0}–{y1}')

    # passada 2: recorte, descontaminação e WebP
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob('f*.webp'):
        old.unlink()
    total = 0
    for i, rgb in enumerate(frames(w, h)):
        rgb = rgb[y0:y1, x0:x1]
        a = key(rgb)
        rgb = decontaminate(rgb, a)
        rgba = np.dstack([rgb, a])
        img = Image.fromarray((np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
        path = OUT / f'f{i:03d}.webp'
        img.save(path, 'WEBP', quality=QUALITY, alpha_quality=90, method=6)
        total += path.stat().st_size
        if i % 20 == 0:
            print(f'  quadro {i}/{n}')

    manifest = {'count': i + 1, 'source': [w, h], 'crop': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]}
    (OUT / 'manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
    print(f'{i + 1} quadros, {total / 1024 / 1024:.1f} MB — {OUT}')
    print(json.dumps(manifest))


if __name__ == '__main__':
    main()
