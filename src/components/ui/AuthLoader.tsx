export const AuthLoader = () => {
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="size-10 rounded-full border-4 border-white/10 border-t-accent animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading ...</p>
      </div>
    </div>
  )
}
