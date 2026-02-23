import "./styles/globals.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"

import { AppProviders } from "@/app/providers"
import { router } from "@/routes"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found. Ensure index.html has a div with id 'root'.")
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
