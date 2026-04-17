import { NETWORK } from "@/libs/contracts"

export const switchToAmoy = async () => {
  try {
    await window?.ethereum?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13882" }],
    })
  } catch (err: unknown) {
    if ((err as { code: number }).code === 4902) {
      await window?.ethereum?.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x13882",
            chainName: "Polygon Amoy Testnet",
            nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
            rpcUrls: [NETWORK.rpcUrl],
            blockExplorerUrls: ["https://amoy.polygonscan.com"],
          },
        ],
      })
    }
  }
}
