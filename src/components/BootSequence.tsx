import styles from './BootSequence.module.css'

const LINES = ['SYSTEM ONLINE', 'MODULES LOADED: 0', 'STATUS: STANDBY', 'AGUARDANDO INSTRUÇÕES_']

export function BootSequence() {
  return (
    <div>
      {LINES.map((line, index) => (
        <p key={line} className={styles.line} style={{ animationDelay: `${index * 0.18}s` }}>
          {line}
        </p>
      ))}
    </div>
  )
}
