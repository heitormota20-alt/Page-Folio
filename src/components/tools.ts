/**
 * As ferramentas do Heitor. O id é o nome do ícone 3D em public/ferramentas/
 * (seção "Minhas ferramentas") e a chave do logo em uma cor de tool-icons.ts
 * (pop-up das artes).
 */
export const TOOL_NAMES = {
  photoshop: 'Photoshop',
  illustrator: 'Illustrator',
  'after-effects': 'After Effects',
  figma: 'Figma',
  canva: 'Canva',
  capcut: 'CapCut',
  claude: 'Claude',
  blender: 'Blender',
} as const

export type ToolId = keyof typeof TOOL_NAMES
