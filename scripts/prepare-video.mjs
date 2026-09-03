/**
 * Passo 0 — preparação do vídeo.
 *
 * Reencoda o vídeo de origem para all-intra (todo frame vira keyframe) para que
 * cada `video.currentTime = t` seja um seek barato, sem reconstruir GOP.
 * Sem isso o scrub engasga.
 *
 *   node scripts/prepare-video.mjs [entrada.mp4]
 *
 * Saída: public/personagem.mp4  (mesma origem — nunca URL externa)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ffmpeg = require('ffmpeg-static')
const ffprobe = require('ffprobe-static').path

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const input = resolve(root, process.argv[2] ?? 'Character_turning_head_in_surprise_202609022142.mp4')
const output = resolve(root, 'public/personagem.mp4')

if (!existsSync(input)) {
  console.error(`Vídeo de entrada não encontrado: ${input}`)
  process.exit(1)
}
mkdirSync(dirname(output), { recursive: true })

const probe = (file, streamEntries) =>
  JSON.parse(
    execFileSync(ffprobe, [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', streamEntries,
      '-of', 'json',
      file,
    ]).toString(),
  )

const src = probe(input, 'stream=codec_name,width,height,r_frame_rate,nb_frames,duration')
  .streams[0]
console.log('Entrada :', src)

// Reencode: H.264 all-intra. keyint=1 + min-keyint=1 + scenecut=0 => 1 GOP por frame.
// Corte sem perda (-ss/-to -c copy) não é necessário aqui: as duas pontas do clipe
// já são conteúdo (personagem em quadro), não há trecho morto para aparar.
execFileSync(
  ffmpeg,
  [
    '-y',
    '-i', input,
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryslow',
    '-crf', '16',
    '-pix_fmt', 'yuv420p',
    '-x264-params', 'keyint=1:min-keyint=1:scenecut=0',
    '-movflags', '+faststart',
    output,
  ],
  { stdio: ['ignore', 'ignore', 'inherit'] },
)

const out = probe(output, 'stream=codec_name,width,height,r_frame_rate,nb_frames,duration').streams[0]

// Confirma que TODO frame é keyframe.
const keyFlags = execFileSync(ffprobe, [
  '-v', 'error',
  '-select_streams', 'v:0',
  '-show_entries', 'frame=key_frame',
  '-of', 'csv=p=0',
  output,
])
  .toString()
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.length > 0)
const total = keyFlags.length
const keyframes = keyFlags.filter((f) => f === '1').length

console.log('Saída   :', out)
console.log(`Duração : ${Number(out.duration).toFixed(3)} s`)
console.log(`Frames  : ${total}  (keyframes: ${keyframes})`)
if (keyframes !== total) {
  console.error('AVISO: nem todo frame é keyframe — o scrub vai engasgar.')
  process.exit(1)
}
console.log('OK — public/personagem.mp4 all-intra.')
