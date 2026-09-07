const LINKS = [
  { label: 'ABOUT', href: '#about' },
  { label: 'WORK', href: '#work' },
  { label: 'STORE', href: '#store' },
  { label: 'CONTACT', href: '#contact' },
]

/**
 * Top-right navigation. Real anchors, real focus states.
 *
 * The destinations do not exist yet, so these point at fragments and are
 * structure rather than routing — the chapters they will lead to are still
 * being built. Set in caps at masthead scale, the same weight class as the
 * wordmark it balances — this is not a navbar shrunk to fit a corner. Hover
 * is a small physical lift, not an underline: a link-style border on words
 * this size would read as a browser convention, which is exactly the register
 * this header is not in.
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
