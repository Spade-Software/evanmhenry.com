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
    image: '/images/spade-software-icon.svg',
  },
  {
    title: 'BackOps',
    description: 'A better backstage for live events.',
    url: 'https://backopslive.com',
    image: '/images/backops-icon.svg',
  },
  {
    title: 'Crato Project',
    description: 'Tools and ideas for a healthier life.',
    url: 'https://cratoproject.com/',
    image: '/images/crato-project-icon.svg',
  },
  {
    title: 'PayGrids',
    description: 'Tip pool management, simplified.',
    url: 'https://paygrids.com/',
    image: '/images/paygrids-icon.svg',
  },
]
