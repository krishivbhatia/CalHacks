import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export default function Check() {
  const params = new URLSearchParams(location.search)
  const roomId = params.get('room') as Id<'rooms'>
  const childId = params.get('child') as Id<'children'>
  const room = useQuery(api.rooms.get, roomId ? { roomId } : 'skip')
  const messages = useQuery(api.messages.listByRoom, roomId ? { roomId } : 'skip')
  const send = useMutation(api.messages.sendSymbols)
  const confirm = useMutation(api.messages.confirm)
  const reject = useMutation(api.messages.reject)
  const pause = useMutation(api.rooms.pause)
  const resume = useMutation(api.rooms.resume)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [playback, setPlayback] = useState('Not started')
  const [error, setError] = useState('')
  const player = useRef<HTMLAudioElement>(null)
  const seen = useRef(new Set<string>())
  const initialized = useRef(false)
  const active = room?.status === 'active'
  useEffect(() => {
    if (!messages) return
    if (!initialized.current) {
      messages.forEach(m => seen.current.add(m._id))
      initialized.current = true
      return
    }
    for (const message of messages) {
      if (message.status !== 'spoken' || !message.audioUrl || seen.current.has(message._id)) continue
      if (!active) { seen.current.add(message._id); continue }
      if (message.senderChildId === childId) { seen.current.add(message._id); continue }
      if (!audioEnabled || !player.current) continue
      seen.current.add(message._id)
      player.current.src = message.audioUrl
      void player.current.play().catch(() => setPlayback('Playback blocked — press replay'))
    }
  }, [messages, audioEnabled, active, childId])
  useEffect(() => {
    if (!active && player.current) {
      player.current.pause()
      player.current.currentTime = 0
    }
  }, [active])
  const attempt = (task: Promise<unknown>) => { setError(''); void task.catch(e => setError(String(e))) }
  return <main style={{ font: '18px system-ui', maxWidth: 780, padding: 28, margin: 'auto', background: active ? '#fff' : '#ddd' }}>
    <h1>Voice integration check</h1>
    <p>Development test page · synthetic room only</p>
    <p role="status">Room: {room?.status ?? 'loading'}</p>
    <button onClick={() => {
      setAudioEnabled(true)
      // The gesture primes this same media element using a tiny silent WAV.
      if (player.current) {
        player.current.src = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA=='
        void player.current.play().catch(() => setPlayback('Audio enabled; awaiting message'))
      }
    }}>Enable audio</button>
    <p>Audio: {audioEnabled ? 'enabled' : 'disabled'} · Playback: <span data-testid="playback">{playback}</span></p>
    <audio ref={player} controls onPlaying={() => setPlayback('playing')} onEnded={() => setPlayback('ended')} onPause={() => setPlayback('paused')} />
    <p><button disabled={!active} onClick={() => attempt(send({ roomId, childId, symbols: ['red', 'train'] }))}>Send red train</button>{' '}
    <button onClick={() => attempt(active ? pause({ roomId }) : resume({ roomId }))}>{active ? 'Pause room' : 'Resume room'}</button></p>
    {error && <p role="alert">{error}</p>}
    <ol>{messages?.map(m => <li key={m._id} style={{ padding: 12, borderBottom: '1px solid #ccc' }}>
      <strong>{m.senderChildId === childId ? 'You' : 'Other child'}</strong>: {m.draftText ?? m.symbols.join(' + ')} · <span>{m.status}</span>
      {m.status === 'draft' && m.senderChildId === childId && <p>
        <button disabled={!active} onClick={() => attempt(confirm({ messageId: m._id }))}>Confirm draft</button>{' '}
        <button disabled={!active} onClick={() => attempt(reject({ messageId: m._id }))}>Reject draft</button></p>}
      {m.status === 'spoken' && m.audioUrl && <button disabled={!active} onClick={() => {
        if (player.current) { player.current.src = m.audioUrl!; void player.current.play().catch(() => setError('Playback blocked')) }
      }}>Replay</button>}
    </li>)}</ol>
  </main>
}
const client = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)
createRoot(document.getElementById('root')!).render(<ConvexProvider client={client}><Check /></ConvexProvider>)
