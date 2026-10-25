// Parent intake chat. SCRIPTED mode: canned parent lines + canned Claude replies,
// then the profile card is shown from the child's seeded row.
// LIVE mode: once Person B ships ai.intakeTurn, swap `reply()` for a useAction call.
import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'

type Turn = { role: 'parent' | 'claude'; text: string }

function buildScript(c: Doc<'children'>) {
  const first = c.interests[0] ?? 'playing'
  return [
    {
      parent: `${c.name} is ${c.age} and absolutely loves ${c.interests.join(' and ')}.`,
      claude: `${c.name} sounds wonderful. How does ${c.name} usually communicate, for example with a symbol tablet, signs, or a few words?`,
    },
    {
      parent: `${c.communicationStyle}.`,
      claude: `Thank you, that really helps. Is there anything about sounds, lights, or busy spaces I should keep in mind?`,
    },
    {
      parent: `${c.sensoryNotes}.`,
      claude: `Got it. Last one: when ${c.name} plays with another kid, what tends to go well? For example, talking about ${first}, taking turns, or playing side by side?`,
    },
    {
      parent: `Short, predictable turns work best, especially about ${first}.`,
      claude: `Thank you! I've put together a profile for ${c.name}. Please check it and change anything that isn't right. You're always in control of what's shared.`,
    },
  ]
}

export default function Intake({ childId }: { childId: Id<'children'> }) {
  const children = useQuery(api.children.list)
  const child = children?.find((c) => c._id === childId)
  const [turns, setTurns] = useState<Turn[]>([])
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, thinking])

  if (children === undefined) return <div className="pv-muted">Loading…</div>
  if (!child) return <div className="pv-muted">Child profile not found.</div>

  const script = buildScript(child)
  const done = step >= script.length
  const suggestion = done ? '' : script[step].parent

  const send = (text: string) => {
    if (!text.trim() || thinking || done) return
    const reply = script[step].claude
    setTurns((t) => [...t, { role: 'parent', text: text.trim() }])
    setDraft('')
    setThinking(true)
    // Small delay so the scripted demo reads like a live reply.
    setTimeout(() => {
      setTurns((t) => [...t, { role: 'claude', text: reply }])
      setThinking(false)
      setStep((s) => s + 1)
    }, 900)
  }

  return (
    <div className="pv-intake">
      <section className="pv-card pv-chat">
        <h2>Tell Claude about {child.name}</h2>
        <p className="pv-muted">
          Claude turns this into a short profile used only to suggest friends. You review it first.
        </p>
        <div className="pv-bubbles">
          <div className="pv-bubble is-claude">
            Hi! I'd love to learn about {child.name} so we can find a good friend. What does {child.name} enjoy?
          </div>
          {turns.map((t, i) => (
            <div key={i} className={`pv-bubble is-${t.role}`}>{t.text}</div>
          ))}
          {thinking && <div className="pv-bubble is-claude is-typing">Claude is thinking…</div>}
          <div ref={endRef} />
        </div>
        {!done && (
          <form
            className="pv-compose"
            onSubmit={(e) => {
              e.preventDefault()
              send(draft || suggestion)
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={suggestion}
              disabled={thinking}
              aria-label="Message to Claude"
            />
            <button className="pv-btn pv-btn-primary" disabled={thinking}>Send</button>
          </form>
        )}
      </section>

      {done && (
        <section className="pv-card pv-profile">
          <div className="pv-eyebrow">Profile ready for your review</div>
          <h2>{child.name}, {child.age}</h2>
          <p>{child.profileSummary}</p>
          <dl>
            <dt>Interests</dt>
            <dd className="pv-symbols">
              {child.interests.map((i) => <span key={i} className="pv-chip">{i}</span>)}
            </dd>
            <dt>Communication</dt>
            <dd>{child.communicationStyle}</dd>
            <dt>Sensory notes</dt>
            <dd>{child.sensoryNotes}</dd>
          </dl>
        </section>
      )}
    </div>
  )
}
