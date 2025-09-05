'use client'

const AbstractIllustration = () => {
  return (
    <div className="w-96 h-96 relative">
      {/* Organic shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-lg animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-2xl animate-pulse"></div>
    </div>
  )
}

export default AbstractIllustration