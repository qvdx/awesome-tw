import styles from './LauncherButton.module.css'

type LauncherButtonProps = {
  onClick: () => void
}

function SkullBadgeIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2 27 8.5v15L16 30 5 23.5v-15Z" stroke="currentColor" strokeWidth="1.4" />
      <line x1="16" y1="2" x2="16" y2="-1" stroke="currentColor" strokeWidth="1.4" />
      <line x1="27" y1="8.5" x2="30" y2="7" stroke="currentColor" strokeWidth="1.4" />
      <line x1="27" y1="23.5" x2="30" y2="25" stroke="currentColor" strokeWidth="1.4" />
      <line x1="5" y1="8.5" x2="2" y2="7" stroke="currentColor" strokeWidth="1.4" />
      <line x1="5" y1="23.5" x2="2" y2="25" stroke="currentColor" strokeWidth="1.4" />
      <line x1="16" y1="30" x2="16" y2="33" stroke="currentColor" strokeWidth="1.4" />
      <g transform="translate(8.2 8.5) scale(0.66)">
        <path
          d="M12 2.5C7.6 2.5 5 5.5 5 9.4c0 2.4 1.1 4.2 2.7 5.4.5.4.8.9.8 1.5v1.2c0 .8.6 1.4 1.4 1.4h4.2c.8 0 1.4-.6 1.4-1.4v-1.2c0-.6.3-1.1.8-1.5 1.6-1.2 2.7-3 2.7-5.4 0-3.9-2.6-6.9-7-6.9Z"
          fill="currentColor"
        />
        <circle cx="9.2" cy="9.4" r="1.7" fill="#050505" />
        <circle cx="14.8" cy="9.4" r="1.7" fill="#050505" />
        <path d="M12 10.6 10.7 13.4h2.6Z" fill="#050505" />
      </g>
    </svg>
  )
}

export function LauncherButton({ onClick }: LauncherButtonProps) {
  return (
    <div className={styles.launcher} id="awesome-tw-launcher" title="Abrir Awesome TW Scripts" onClick={onClick}>
      <div className={styles.iconWrap}>
        <span className={`${styles.iconLayer} ${styles.base}`}>
          <SkullBadgeIcon />
        </span>
        <span className={`${styles.iconLayer} ${styles.glitchRed}`} aria-hidden="true">
          <SkullBadgeIcon />
        </span>
        <span className={`${styles.iconLayer} ${styles.glitchCyan}`} aria-hidden="true">
          <SkullBadgeIcon />
        </span>
      </div>
    </div>
  )
}
