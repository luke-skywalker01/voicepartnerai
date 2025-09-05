export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">VoicePartnerAI</h1>
      <p className="text-xl mb-8">Deutsche Voice AI Plattform</p>
      <div className="space-y-4">
        <a href="/dashboard" className="block p-4 border rounded hover:bg-gray-50">
          → Dashboard
        </a>
        <a href="/workflows" className="block p-4 border rounded hover:bg-gray-50">
          → Workflows
        </a>
        <a href="/dashboard/assistants" className="block p-4 border rounded hover:bg-gray-50">
          → Assistants
        </a>
      </div>
    </div>
  )
}