import { useSelector } from "react-redux"
import { Toaster } from "sonner"

import { CategoryTabs } from "@/components/layout/CategoryTabs"
import { Navbar } from "@/components/layout/Navbar"
import { AuthLoader } from "@/components/ui/AuthLoader"
import { selectUserLoading } from "@/features/auth/authSlice"

const Event = () => {
  const userLoading = useSelector(selectUserLoading)
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30  md:mx-20">
      <Toaster richColors position="top-center" />
      {userLoading && <AuthLoader />}
      <Navbar />
      <CategoryTabs />

      <main className="container mx-auto px-4 pb-20">event page</main>
    </div>
  )
}

export default Event
