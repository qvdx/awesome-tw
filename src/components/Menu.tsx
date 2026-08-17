import { useEffect, useState } from 'react'
import styles from './Menu.module.css'

export type MenuItem = {
  label: string
  onSelect: () => void
}

type MenuProps = {
  items: MenuItem[]
}

export function Menu({ items }: MenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        event.stopPropagation()
        setSelectedIndex((index) => (index + 1) % items.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        setSelectedIndex((index) => (index - 1 + items.length) % items.length)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        items[selectedIndex]?.onSelect()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [items, selectedIndex])

  return (
    <ul className={styles.menu} role="listbox">
      {items.map((item, index) => {
        const isSelected = index === selectedIndex
        return (
          <li
            key={item.label}
            role="option"
            aria-selected={isSelected}
            className={`${styles.item} ${isSelected ? styles.selected : ''}`}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={item.onSelect}
          >
            <span className={styles.marker}>{isSelected ? '>' : ''}</span>
            {item.label}
          </li>
        )
      })}
    </ul>
  )
}
