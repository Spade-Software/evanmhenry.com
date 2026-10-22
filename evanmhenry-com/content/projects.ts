export type Project = {
  title: string
  description: string
  url: string
  image: string
}

export const projects: Project[] = [
  {
    title: 'Spade Software',
    description: 'Thoughtful software, built for people.',
    url: 'https://spadehq.com',
    image: '/images/spade-square-light.webp',
  },
  {
    title: 'BackOps',
    description: 'A better backstage for live events.',
    url: 'https://backopslive.com',
    image: '/images/backops-square-light.svg',
  },
  {
    title: 'Crato Project',
    description: 'Tools and ideas for a healthier life.',
    url: 'https://cratoproject.com/',
    image: '/images/crato-square-light.webp',
  },
]
