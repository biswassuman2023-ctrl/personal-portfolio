import { DESCRIPTOR, SIGN_OFF, STATEMENT, u } from './layout'
import { PhotoStack } from './PhotoStack'
import { RoleCard } from './RoleCard'
import { Wordmark } from './Wordmark'

/**
 * Right page: what this person does. Five things.
 *
 * The statement is two lines. It was a two-paragraph bio, which explained the
 * whole person on the opening spread and left nothing for the chapters that
 * follow — a hero should make you want to turn the page, not save you the
 * trouble.
 */
export function HeroRightPage() {
  return (
    <>
      <RoleCard />
      <PhotoStack />
      <Wordmark />
      <Descriptor />
      <Statement />
      <SignOff />
    </>
  )
}

/** The title, with the half that carries the weight set in a printed box. */
function Descriptor() {
  return (
    <p className="descriptor" style={{ left: u(DESCRIPTOR.x), top: u(DESCRIPTOR.y) }}>
      <span className="descriptor__boxed">Web Developer</span>
      <span className="descriptor__plain">+ Designer</span>
    </p>
  )
}

/** Two lines. Enough to place him; not enough to spend the story. */
function Statement() {
  return (
    <p className="statement" style={{ left: u(STATEMENT.x), top: u(STATEMENT.y), width: u(STATEMENT.w) }}>
      I build the interface
      <br />
      and the system under it.
    </p>
  )
}

/** The last mark on the spread. Text alone; the rule under it was invented. */
function SignOff() {
  return (
    <div
      className="sign-off"
      style={{ left: u(SIGN_OFF.x), top: u(SIGN_OFF.y) }}
      aria-hidden="true"
    >
      S.B. — ’25
    </div>
  )
}
