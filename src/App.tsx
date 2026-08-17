import { useState } from 'react'
import { createPortal } from 'react-dom'
import { BootSequence } from './components/BootSequence'
import { LauncherButton } from './components/LauncherButton'
import { Menu, type MenuItem } from './components/Menu'
import { Modal } from './components/Modal'
import { useMountNode } from './hooks/useMountNode'
import { getPlayerName } from './lib/gameData'

const menuItems: MenuItem[] = [
  { label: 'Automações', onSelect: () => console.log('[awesome-tw-scripts] abrir Automações') },
  { label: 'Utilitários', onSelect: () => console.log('[awesome-tw-scripts] abrir Utilitários') },
  { label: 'Pague um café', onSelect: () => console.log('[awesome-tw-scripts] abrir Pague um café') },
  { label: 'Reportar um problema', onSelect: () => console.log('[awesome-tw-scripts] abrir Reportar um problema') },
]

export function App() {
  const launcherMount = useMountNode('#questlog_new', 'start')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {launcherMount &&
        createPortal(<LauncherButton onClick={() => setIsOpen(true)} />, launcherMount)}

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <BootSequence username={getPlayerName()} activeScripts={0} />
        <Menu items={menuItems} />
      </Modal>
    </>
  )
}
