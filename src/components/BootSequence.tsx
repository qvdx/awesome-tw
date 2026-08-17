import styles from './BootSequence.module.css'

type BootSequenceProps = {
  username: string
  activeScripts: number
}

export function BootSequence({ username, activeScripts }: BootSequenceProps) {
  const lines = [username, `SCRIPTS ATIVOS: ${activeScripts}`, 'TIER: FREE']

  return (
    <div>
      {lines.map((line, index) => (
        <p key={index} className={styles.line} style={{ animationDelay: `${index * 0.18}s` }}>
          {line}
        </p>
      ))}
    </div>
  )
}
