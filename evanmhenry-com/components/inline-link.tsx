import Image from 'next/image'

export function InlineLink({ href, image, children }: { href: string; image: string; children: React.ReactNode }) {
  return <a className="inline-callout" href={href} target="_blank" rel="noopener noreferrer"><Image src={image} alt="" width={14} height={14} />{children}</a>
}
