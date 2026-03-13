import "./styles/globals.css"

import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"

import { AppProviders } from "@/app/providers"
import { router } from "@/routes"

import MagicProvider from "./features/auth/lib/magic"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found. Ensure index.html has a div with id 'root'.")
}

createRoot(rootElement).render(
  <MagicProvider>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </MagicProvider>,
)
