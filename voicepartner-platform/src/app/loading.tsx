export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground text-lg">VoicePartnerAI wird geladen...</p>
        <p className="text-muted-foreground text-sm mt-2">Bitte haben Sie einen Moment Geduld</p>
      </div>
    </div>
  )
}