import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { BootSequence } from './components/BootSequence'
import { Coffee } from './components/Coffee'
import { LauncherButton } from './components/LauncherButton'
import { Menu, type MenuItem } from './components/Menu'
import { Modal } from './components/Modal'
import { Report } from './components/Report'
import { Settings } from './components/Settings'
import { useMountNode } from './hooks/useMountNode'
import { useShortcutConfig } from './hooks/useShortcutConfig'
import { getPlayerName } from './lib/gameData'
import { matchesShortcut } from './lib/shortcut'

type Screen = 'menu' | 'settings' | 'coffee' | 'report'

export function App() {
  const launcherMount = useMountNode('#questlog_new', 'start')
  const [isOpen, setIsOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('menu')
  const [shortcut, setShortcut] = useShortcutConfig()

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (!matchesShortcut(event, shortcut)) return
      event.preventDefault()
      setIsOpen((open) => {
        if (open) setScreen('menu')
        return !open
      })
    }

    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [shortcut])

  function handleClose() {
    setIsOpen(false)
    setScreen('menu')
  }

  const menuItems: MenuItem[] = [
    { label: 'Automações', onSelect: () => console.log('[awesome-tw-scripts] abrir Automações') },
    { label: 'Utilitários', onSelect: () => console.log('[awesome-tw-scripts] abrir Utilitários') },
    { label: 'Configurações', onSelect: () => setScreen('settings') },
    { label: 'Pague um café', onSelect: () => setScreen('coffee') },
    { label: 'Reportar um problema', onSelect: () => setScreen('report') },
  ]

  return (
    <>
      {launcherMount &&
        createPortal(<LauncherButton onClick={() => setIsOpen(true)} />, launcherMount)}

      <Modal open={isOpen} onClose={handleClose}>
        {screen === 'menu' && (
          <>
            <BootSequence username={getPlayerName()} activeScripts={0} />
            {/* delay casa com o fim da animação escalonada das 3 linhas do boot (2 * 0.18s + 0.4s) */}
            <Menu items={menuItems} revealDelay={0.76} />
          </>
        )}
        {screen === 'settings' && (
          <Settings shortcut={shortcut} onChangeShortcut={setShortcut} onBack={() => setScreen('menu')} />
        )}
        {screen === 'coffee' && <Coffee onBack={() => setScreen('menu')} />}
        {screen === 'report' && <Report onBack={() => setScreen('menu')} />}
      </Modal>
    </>
  )
}
