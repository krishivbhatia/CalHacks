// PLACEHOLDER owned by Person C. Replace this file with the real kid view.
// Keep the default export name so App.tsx keeps working.
export default function KidView() {
  const child = new URLSearchParams(window.location.search).get('child')
  return (
    <main style={{ padding: 32 }}>
      <h1>Kid view for {child ?? '(no ?child=)'}</h1>
      <p>Person C builds this screen.</p>
    </main>
  )
}
