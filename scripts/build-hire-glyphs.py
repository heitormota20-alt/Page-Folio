"""
Gera src/components/hire-glyphs.ts — os contornos de "CONTRATE-ME" na Anton, para o
jogo da caneta no rodapé (HireGame.tsx, inspirado em bezier.method.ac).

Da fonte (TrueType, curvas quadráticas) para o que um designer desenharia com a
caneta: cada sequência de quadráticas vira o MENOR número de cúbicas que a reproduz
(fontTools Qu2CuPen, erro máximo MAX_ERR unidades da fonte) e cada contorno vira uma
lista de nós — o ponto, a alça de entrada e a de saída (relativas ao ponto; 0,0 =
sem alça). Cada contorno começa no nó de canto mais alto (e, empatando, mais à
esquerda); o sentido é o da fonte (externos e furos opostos: preenchimento nonzero).

uso: python scripts/build-hire-glyphs.py caminho/Anton-Regular.ttf
     a fonte: github.com/google/fonts — ofl/anton/Anton-Regular.ttf
requer: fonttools
"""
import sys
from pathlib import Path

from fontTools.pens.qu2cuPen import Qu2CuPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'components' / 'hire-glyphs.ts'
TEXT = 'CONTRATE-ME'
MAX_ERR = 1.5  # unidades da fonte
TRACKING = 14  # folga extra entre letras (unidades), para os nós de letras vizinhas não se colarem


def contours_of(glyphset, name):
    rec = RecordingPen()
    glyphset[name].draw(Qu2CuPen(rec, max_err=MAX_ERR, all_cubic=True))
    contours, cur = [], None
    for op, args in rec.value:
        if op == 'moveTo':
            cur = {'start': args[0], 'segs': []}
        elif op == 'lineTo':
            cur['segs'].append(('L', args))
        elif op == 'curveTo':
            cur['segs'].append(('C', args))
        elif op in ('closePath', 'endPath'):
            contours.append(cur)
            cur = None
        else:
            raise ValueError(f'segmento inesperado: {op}')
    return contours


def nodes_of(contour):
    """Nós [x, y, ix, iy, ox, oy] (y da fonte, para cima)."""
    pts = [contour['start']] + [s[1][-1] for s in contour['segs']]
    segs = contour['segs']
    closed_by_last = pts[-1] == pts[0]
    if closed_by_last:
        pts = pts[:-1]
    n = len(pts)
    nodes = [[p[0], p[1], 0.0, 0.0, 0.0, 0.0] for p in pts]
    for i, (kind, args) in enumerate(segs):
        if kind != 'C':
            continue
        a, b = i % n, (i + 1) % n
        c1, c2 = args[0], args[1]
        nodes[a][4], nodes[a][5] = c1[0] - nodes[a][0], c1[1] - nodes[a][1]
        nodes[b][2], nodes[b][3] = c2[0] - nodes[b][0], c2[1] - nodes[b][1]
    return nodes


def is_corner(nd):
    ix, iy, ox, oy = nd[2:]
    if (ix, iy) == (0, 0) or (ox, oy) == (0, 0):
        return True
    cross = ix * oy - iy * ox
    dot = ix * ox + iy * oy
    return abs(cross) > 0.05 * (ix * ix + iy * iy) ** 0.5 * (ox * ox + oy * oy) ** 0.5 or dot > 0


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    font = TTFont(sys.argv[1])
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    hmtx = font['hmtx']

    glyphs, x = [], 0.0
    for ch in TEXT:
        name = cmap[ord(ch)]
        contours = []
        for c in contours_of(gs, name):
            nodes = [[nd[0] + x, *nd[1:]] for nd in nodes_of(c)]
            corners = [i for i, nd in enumerate(nodes) if is_corner(nd)] or [0]
            start = min(corners, key=lambda i: (-nodes[i][1], nodes[i][0]))  # mais alto, depois mais à esquerda
            contours.append(nodes[start:] + nodes[:start])
        glyphs.append({'char': ch, 'x': x, 'advance': hmtx[name][0], 'contours': contours})
        x += hmtx[name][0] + TRACKING

    # y para baixo (SVG) e caixa da palavra a partir de (0, 0)
    all_pts = [(nd[0], nd[1]) for g in glyphs for c in g['contours'] for nd in c]
    min_x = min(p[0] for p in all_pts)
    max_x = max(p[0] for p in all_pts)
    min_y = min(p[1] for p in all_pts)
    max_y = max(p[1] for p in all_pts)
    pad = 24
    for g in glyphs:
        for c in g['contours']:
            for nd in c:
                nd[0] = nd[0] - min_x + pad
                nd[1] = max_y - nd[1] + pad
                nd[3] = -nd[3]
                nd[5] = -nd[5]
    width = max_x - min_x + 2 * pad
    height = max_y - min_y + 2 * pad

    def num(v):
        r = round(v, 1)
        return str(int(r)) if r == int(r) else str(r)

    lines = []
    total = 0
    for g in glyphs:
        cs = []
        for c in g['contours']:
            total += len(c)
            cs.append('[' + ', '.join('[' + ', '.join(num(v) for v in nd) + ']' for nd in c) + ']')
        lines.append(f"  {{ char: '{g['char']}', contours: [\n    " + ',\n    '.join(cs) + '\n  ] },')

    OUT.write_text(
        '// Gerado por scripts/build-hire-glyphs.py — não editar à mão.\n'
        '// "CONTRATE-ME" na Anton, como um designer vetorizaria com a caneta: cada contorno\n'
        '// é uma lista de nós [x, y, alça de entrada x, y, alça de saída x, y] (alças\n'
        '// relativas ao nó; 0, 0 = sem alça), em unidades da fonte, y para baixo.\n'
        f'export const HIRE_VIEWBOX = {{ width: {num(width)}, height: {num(height)} }}\n\n'
        'export type HireNode = readonly [number, number, number, number, number, number]\n'
        'export interface HireGlyph {\n  char: string\n  contours: readonly (readonly HireNode[])[]\n}\n\n'
        'export const HIRE_GLYPHS: readonly HireGlyph[] = [\n' + '\n'.join(lines) + '\n]\n',
        encoding='utf-8',
    )
    per = ', '.join(f"{g['char']}={sum(len(c) for c in g['contours'])}" for g in glyphs)
    print(f'{OUT.relative_to(ROOT)} — {total} nós ({per}); caixa {num(width)} × {num(height)}')


if __name__ == '__main__':
    main()
