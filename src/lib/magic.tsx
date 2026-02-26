import { OAuthExtension } from "@magic-ext/oauth2"
import { Magic as MagicBase } from "magic-sdk"
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react"

export type Magic = MagicBase<[OAuthExtension]>

type MagicContextType = {
  magic: Magic | null
}

const MagicContext = createContext<MagicContextType>({ magic: null })

// eslint-disable-next-line react-refresh/only-export-components
export const useMagic = () => useContext(MagicContext)

const MagicProvider = ({ children }: { children: ReactNode }) => {
  const [magic, setMagic] = useState<Magic | null>(null)

  useEffect(() => {
    if (import.meta.env.VITE_MAGIC_API_KEY) {
      const magicInstance = new MagicBase(import.meta.env.VITE_MAGIC_API_KEY, {
        network: {
          rpcUrl: "https://rpc2.sepolia.org/",
          chainId: 11155111,
        },
        extensions: [new OAuthExtension()], // 👈 ADD THIS
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMagic(magicInstance as Magic)
    }
  }, [])

  const value = useMemo(() => ({ magic }), [magic])

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>
}

export default MagicProvider
