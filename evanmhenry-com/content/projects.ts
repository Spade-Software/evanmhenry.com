export type Project = {
  title: string
  description: string
  url: string
  image: string
  preview?: string
}

export const projects: Project[] = [
  {
    title: 'Spade',
    description: 'A studio building software for businesses and the people behind them.',
    url: 'https://spadehq.com',
    image: '/images/spade-square-light.webp',
  },
  {
    title: 'BackOps',
    description: 'Software for planning and coordinating live events.',
    url: 'https://backopslive.com',
    image: '/images/backops-square-light.svg',
    preview: '/images/backops-preview.png',
  },
  {
    title: 'Crato Project',
    description: 'A workout tracker you can control with AI.',
    url: 'https://cratoproject.com/',
    image: '/images/crato-square-light.webp',
  },
]
