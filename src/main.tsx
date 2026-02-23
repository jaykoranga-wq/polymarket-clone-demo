import "./styles/globals.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { AppProviders } from "@/app/providers"
import { AppRoutes } from "@/routes"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found. Ensure index.html has a div with id 'root'.")
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </StrictMode>,
)
