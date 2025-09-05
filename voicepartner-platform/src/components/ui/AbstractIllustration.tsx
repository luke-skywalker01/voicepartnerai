'use client'

export default function AbstractIllustration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Organic shapes inspired by Anthropic design */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-accent/10 to-accent/5 blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-3/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-bl from-accent/8 to-accent/3 blur-2xl transform translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-3/4 w-32 h-32 rounded-full bg-gradient-to-tr from-accent/6 to-accent/2 blur-xl transform translate-x-1/2 -translate-y-1/2" />
      
      {/* Subtle geometric patterns */}
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-accent/20 rounded-full" />
      <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-accent/30 rounded-full" />
      <div className="absolute top-1/6 right-1/6 w-1.5 h-1.5 bg-accent/25 rounded-full" />
    </div>
  )
}