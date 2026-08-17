export function waitForElement(selector: string): Promise<HTMLElement> {
  const existing = document.querySelector<HTMLElement>(selector)
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) {
        observer.disconnect()
        resolve(el)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}
