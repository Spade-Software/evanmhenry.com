import Image from 'next/image'
import { projects } from '@/content/projects'

export function ProjectGallery() {
  return <div className="project-gallery">{projects.map((project, index) => <article data-project key={project.title} className={index === 0 ? 'gallery-project first-project' : 'gallery-project'}>
    <a className={`project-media${project.preview ? '' : ' brand-media'}`} href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${project.title}`}>
      <Image src={project.preview || project.image} alt={project.preview ? `${project.title} interface preview` : `${project.title} brand mark`} width={project.preview ? 1200 : 120} height={project.preview ? 675 : 120} sizes={project.preview ? '(max-width: 824px) 100vw, 700px' : '120px'} loading={index === 0 ? 'eager' : 'lazy'} />
    </a>
    <div className="project-caption"><h2><a href={project.url} target="_blank" rel="noopener noreferrer">{project.title}</a></h2><p>{project.description}</p></div>
  </article>)}</div>
}
