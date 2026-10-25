// Tiny pathname router: no dependency needed for 2 routes.
// Kid view (Person C) lives in src/kid/, parent view (Person D) in src/parent/.
import KidView from './kid/KidView.tsx'
import ParentView from './parent/ParentView.tsx'

function App() {
  const path = window.location.pathname
  if (path.startsWith('/kid')) return <KidView />
  if (path.startsWith('/parent')) return <ParentView />

  return (
    <main style={{ padding: 32, maxWidth: 520, margin: '0 auto' }}>
      <h1>Hangout (demo)</h1>
      <p>All profiles are synthetic.</p>
      <h2>Kids</h2>
      <ul>
        <li><a href="/kid?child=maya">Maya</a></li>
        <li><a href="/kid?child=leo">Leo</a></li>
      </ul>
      <h2>Parents</h2>
      <ul>
        {['maya', 'leo', 'aiden', 'sam', 'priya'].map((p) => (
          <li key={p}>
            <a href={`/parent?parent=${p}`}>{p[0].toUpperCase() + p.slice(1)}'s parent</a>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
