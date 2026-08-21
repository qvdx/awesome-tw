import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Automations } from './components/Automations'
import { BootSequence } from './components/BootSequence'
import { Coffee } from './components/Coffee'
import { LauncherButton } from './components/LauncherButton'
import { Menu, type MenuItem } from './components/Menu'
import { Modal } from './components/Modal'
import { Report } from './components/Report'
import { Settings } from './components/Settings'
import { Utilities } from './components/Utilities'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useMountNode } from './hooks/useMountNode'
import { useShortcutConfig } from './hooks/useShortcutConfig'
import { loadAutoFarmConfig } from './lib/autoFarmConfig'
import { showAutoFarmBanner } from './lib/autoFarmBanner'
import { resetAutoFarmSchedule, startAutoFarmLoop } from './lib/autoFarmScheduler'
import { countActiveFeatures, featureStorageKey } from './lib/features'
import { getPlayerName, getVillageId } from './lib/gameData'
import { initIncomingFarmingResources } from './lib/incomingFarmingResources'
import { loadScavengeConfig } from './lib/scavengeConfig'
import { startAutoScavengeLoops } from './lib/scavengeScheduler'
import { matchesShortcut } from './lib/shortcut'
import { initTrainingQueueOverlay } from './lib/trainingQueueOverlay'

type Screen = 'menu' | 'settings' | 'coffee' | 'report' | 'automations' | 'utilities'

export function App() {
  const launcherMount = useMountNode('#questlog_new', 'start')
  const [isOpen, setIsOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('menu')
  const [shortcut, setShortcut] = useShortcutConfig()
  const [autoScavengeEnabled, setAutoScavengeEnabled] = useLocalStorage(featureStorageKey('auto-scavenge'), false)
  const [autoFarmEnabled, setAutoFarmEnabled] = useLocalStorage(featureStorageKey('auto-farm'), false)

  // religar manualmente é um sinal claro de "quero rodar do zero" — limpa o
  // agendamento salvo antes de ligar, pra não esperar a execução que já
  // estava marcada de antes de desligar
  function handleChangeAutoFarmEnabled(enabled: boolean) {
    if (enabled) resetAutoFarmSchedule()
    setAutoFarmEnabled(enabled)
  }
  const [trainingQueueOverlayEnabled, setTrainingQueueOverlayEnabled] = useLocalStorage(
    featureStorageKey('overview-training-queue'),
    false,
  )
  const [incomingFarmingResourcesEnabled, setIncomingFarmingResourcesEnabled] = useLocalStorage(
    featureStorageKey('overview-incoming-farming-resources'),
    false,
  )

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

  useEffect(() => {
    if (!autoScavengeEnabled) return

    const config = loadScavengeConfig()
    const villageIds =
      config.villageIds.length > 0 ? config.villageIds : [getVillageId()].filter((id): id is number => id !== null)

    if (villageIds.length === 0) {
      console.error('[awesometw] não achei nenhuma aldeia pra rodar a coleta automática')
      return
    }

    return startAutoScavengeLoops(villageIds)
  }, [autoScavengeEnabled])

  useEffect(() => {
    if (!autoFarmEnabled) return

    const config = loadAutoFarmConfig()
    const villageIds =
      config.villageIds.length > 0 ? config.villageIds : [getVillageId()].filter((id): id is number => id !== null)

    if (villageIds.length === 0) {
      console.error('[awesometw] não achei nenhuma aldeia pra rodar o autofarm')
      return
    }

    const banner = showAutoFarmBanner()
    const stop = startAutoFarmLoop(villageIds, {
      onChecking: () => banner.setChecking(),
      onProgress: (progress) => banner.setProgress(progress.total > 0 ? progress : null),
      onNextRunAt: (timestamp) => banner.setNextRunAt(timestamp),
    })

    return () => {
      stop()
      banner.remove()
    }
  }, [autoFarmEnabled])

  useEffect(() => {
    if (!trainingQueueOverlayEnabled) return
    return initTrainingQueueOverlay()
  }, [trainingQueueOverlayEnabled])

  useEffect(() => {
    if (!incomingFarmingResourcesEnabled) return
    return initIncomingFarmingResources()
  }, [incomingFarmingResourcesEnabled])

  function handleClose() {
    setIsOpen(false)
    setScreen('menu')
  }

  const menuItems: MenuItem[] = [
    { label: 'Automações', onSelect: () => setScreen('automations') },
    { label: 'Utilitários', onSelect: () => setScreen('utilities') },
    { label: 'Configurações', onSelect: () => setScreen('settings') },
    { label: 'Pague um café', onSelect: () => setScreen('coffee') },
    { label: 'Saiba mais', onSelect: () => setScreen('report') },
  ]

  return (
    <>
      {launcherMount &&
        createPortal(<LauncherButton onClick={() => setIsOpen(true)} />, launcherMount)}

      <Modal open={isOpen} onClose={handleClose}>
        {screen === 'menu' && (
          <>
            <BootSequence username={getPlayerName()} activeScripts={countActiveFeatures()} />
            {/* delay casa com o fim da animação escalonada das 3 linhas do boot (2 * 0.18s + 0.4s) */}
            <Menu items={menuItems} revealDelay={0.76} />
          </>
        )}
        {screen === 'settings' && (
          <Settings shortcut={shortcut} onChangeShortcut={setShortcut} onBack={() => setScreen('menu')} />
        )}
        {screen === 'coffee' && <Coffee onBack={() => setScreen('menu')} />}
        {screen === 'report' && <Report onBack={() => setScreen('menu')} />}
        {screen === 'utilities' && (
          <Utilities
            trainingQueueOverlayEnabled={trainingQueueOverlayEnabled}
            onChangeTrainingQueueOverlayEnabled={setTrainingQueueOverlayEnabled}
            incomingFarmingResourcesEnabled={incomingFarmingResourcesEnabled}
            onChangeIncomingFarmingResourcesEnabled={setIncomingFarmingResourcesEnabled}
            onBack={() => setScreen('menu')}
          />
        )}
        {screen === 'automations' && (
          <Automations
            autoScavengeEnabled={autoScavengeEnabled}
            onChangeAutoScavengeEnabled={setAutoScavengeEnabled}
            autoFarmEnabled={autoFarmEnabled}
            onChangeAutoFarmEnabled={handleChangeAutoFarmEnabled}
            onBack={() => setScreen('menu')}
          />
        )}
      </Modal>
    </>
  )
}
