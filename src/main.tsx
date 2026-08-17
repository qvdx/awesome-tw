import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

function mount() {
  const container = document.createElement('div')
  container.id = 'awesome-tw-scripts-root'
  document.body.append(container)

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

mount()
