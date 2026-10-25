// Pick dark or white lettering so the initial stays readable on any child's colour.
function inkFor(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.62 ? '#2a2112' : '#ffffff'
}

export default function Avatar({
  name,
  color,
  size = 28,
  online,
}: {
  name: string
  color: string
  size?: number
  online?: boolean
}) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        ['--av' as string]: color,
        ['--av-ink' as string]: inkFor(color),
      }}
    >
      {name[0]}
      {online && <span className="online-dot" />}
    </span>
  )
}
