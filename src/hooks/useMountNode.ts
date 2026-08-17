import { useEffect, useState } from 'react'
import { waitForElement } from '../lib/waitForElement'

/**
 * Cria e insere um <div> vazio dentro do elemento encontrado por `selector`,
 * sem tocar nos filhos que já existem lá (evita o React "roubar" um
 * container do jogo e apagar o conteúdo original dele).
 */
export function useMountNode(selector: string, position: 'start' | 'end' = 'end') {
  const [node, setNode] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let wrapper: HTMLElement | null = null
    let cancelled = false

    waitForElement(selector).then((container) => {
      if (cancelled) return
      wrapper = document.createElement('div')
      wrapper.style.display = 'contents'
      if (position === 'start') {
        container.prepend(wrapper)
      } else {
        container.append(wrapper)
      }
      setNode(wrapper)
    })

    return () => {
      cancelled = true
      wrapper?.remove()
      setNode(null)
    }
  }, [selector, position])

  return node
}
