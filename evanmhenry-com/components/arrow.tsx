export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="m9 6 6 6-6 6" />}
  </svg>
}
