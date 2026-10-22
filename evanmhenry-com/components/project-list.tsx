import Image from 'next/image'
import { projects } from '@/content/projects'
import { Arrow } from './arrow'

export function ProjectList() {
  return <ul className="project-list">{projects.map(project => <li key={project.title}>
    <a className="project-row" href={project.url} target="_blank" rel="noopener noreferrer">
      <span className={`project-icon${project.title === 'Crato Project' ? ' project-icon-light' : ''}${project.title === 'BackOps' ? ' project-icon-full' : ''}`}><Image src={project.image} alt="" width={28} height={28} /></span>
      <span className="row-copy"><span className="row-title">{project.title}</span><span className="row-description">{project.description}</span></span>
      <span className="row-arrow"><Arrow diagonal /></span>
    </a>
  </li>)}</ul>
}
