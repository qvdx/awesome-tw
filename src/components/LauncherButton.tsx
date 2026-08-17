import styles from './LauncherButton.module.css'

type LauncherButtonProps = {
  onClick: () => void
}

export function LauncherButton({ onClick }: LauncherButtonProps) {
  return (
    <div
      className={`quest ${styles.launcher}`}
      id="awesome-tw-launcher"
      title="Abrir Awesome TW Scripts"
      onClick={onClick}
    >
      <span className={styles.icon}>☠</span>
    </div>
  )
}
