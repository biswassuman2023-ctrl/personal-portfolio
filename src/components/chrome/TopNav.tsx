const LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#work' },
  { label: 'Store', href: '#store' },
  { label: 'Contact', href: '#contact' },
]

/**
 * Top-right navigation. Real anchors, real focus states.
 *
 * The destinations do not exist yet, so these point at fragments and are
 * structure rather than routing — the chapters they will lead to are still
 * being built. Hover is a single hairline; anything more would start competing
 * with the notebook.
 */
export function TopNav() {
  return (
    <nav className="chrome__nav" aria-label="Primary">
      <ul>
        {LINKS.map(({ label, href }) => (
          <li key={label}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
