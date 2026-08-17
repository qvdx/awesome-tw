import { useState } from 'react'
import { createPortal } from 'react-dom'
import { BootSequence } from './components/BootSequence'
import { LauncherButton } from './components/LauncherButton'
import { Modal } from './components/Modal'
import { useMountNode } from './hooks/useMountNode'

export function App() {
  const launcherMount = useMountNode('#questlog_new', 'start')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {launcherMount &&
        createPortal(<LauncherButton onClick={() => setIsOpen(true)} />, launcherMount)}

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <BootSequence />
      </Modal>
    </>
  )
}
