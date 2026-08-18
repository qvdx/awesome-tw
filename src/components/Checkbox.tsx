import styles from './Checkbox.module.css'

type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className={styles.wrapper}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className={`${styles.box} ${checked ? styles.checked : ''}`}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className={styles.check} fill="none">
            <polyline
              points="3,8 6.5,11.5 13,4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
}
