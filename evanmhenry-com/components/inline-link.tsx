import Image from 'next/image'

export function InlineLink({ href, image, children }: { href: string; image: string; children: React.ReactNode }) {
  return <a className="inline-record" data-analytics-event="project_click" data-analytics-name={typeof children === 'string' ? children : undefined} data-analytics-placement="intro_inline" href={href} target="_blank" rel="noopener noreferrer"><span className={`record-icon${image.includes('spade') ? ' record-icon-entity' : ''}`}><Image src={image} alt="" width={18} height={18} /></span><span className="record-label">{children}</span></a>
}
