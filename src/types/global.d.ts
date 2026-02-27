interface Window {
  ethereum?: {
    request: (args: { method: string; params?: string[] }) => Promise<string[]>
    on: (event: string, handler: (...args: string[]) => void) => void
    removeListener: (event: string, handler: (...args: string[]) => void) => void
  }
}
