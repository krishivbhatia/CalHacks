import { useEffect, useRef, useState } from 'react'

export type SpokenMessage = { id: string; senderId: string; status: string; audioUrl: string | null }

// 0.1s of silence. Playing it inside the start tap unlocks audio on iOS/Safari.
const SILENT =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

/**
 * Plays the friend's spoken messages on THIS device, one at a time, exactly once each.
 * Messages that already exist when the room first loads are never replayed.
 */
export function useRoomAudio({
  messages,
  meId,
  soundOn,
  paused,
}: {
  messages: SpokenMessage[] | undefined
  meId: string | undefined
  soundOn: boolean
  paused: boolean
}) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const seen = useRef(new Set<string>())
  const primed = useRef(false)
  const queue = useRef<{ id: string; url: string }[]>([])
  const playing = useRef(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)

  function playNext() {
    if (playing.current) return
    const next = queue.current.shift()
    if (!next) return
    const el = (audio.current ??= new Audio())
    playing.current = true
    setSpeakingId(next.id)
    const finish = () => {
      el.onended = el.onerror = null
      playing.current = false
      setSpeakingId(null)
      playNext()
    }
    el.onended = el.onerror = finish
    el.src = next.url
    el.play().catch(finish) // autoplay blocked: skip silently, the text is still shown
  }

  useEffect(() => {
    if (!messages || !meId) return
    const fresh = messages.filter((m) => m.status === 'spoken' && m.audioUrl && !seen.current.has(m.id))
    fresh.forEach((m) => seen.current.add(m.id))
    if (!primed.current) {
      primed.current = true // history: mark as heard, don't speak it
      return
    }
    if (!soundOn || paused) return
    for (const m of fresh) if (m.senderId !== meId) queue.current.push({ id: m.id, url: m.audioUrl! })
    playNext()
  })

  // Pausing the room silences the device right away.
  useEffect(() => {
    if (!paused) return
    queue.current = []
    playing.current = false
    audio.current?.pause()
    const t = window.setTimeout(() => setSpeakingId(null), 0)
    return () => window.clearTimeout(t)
  }, [paused])

  useEffect(() => () => audio.current?.pause(), [])

  return {
    speakingId,
    /** Call from the start-tap so later audio is allowed to play. */
    unlock() {
      const el = (audio.current ??= new Audio())
      el.src = SILENT
      el.play().catch(() => {})
    },
    replay(url: string, id: string) {
      queue.current.push({ id, url })
      playNext()
    },
  }
}
