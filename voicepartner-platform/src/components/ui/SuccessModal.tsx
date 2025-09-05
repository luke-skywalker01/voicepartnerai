'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Sparkles, ArrowRight, Play, Settings } from 'lucide-react'
import Link from 'next/link'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  assistantName: string
  assistantType: 'easy' | 'advanced'
}

export default function SuccessModal({ isOpen, onClose, assistantName, assistantType }: SuccessModalProps) {
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      // Auto-progress through celebration steps
      const timer1 = setTimeout(() => setStep(2), 1000)
      const timer2 = setTimeout(() => setStep(3), 2500)
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-card max-w-md w-full rounded-xl shadow-2xl overflow-hidden">
        {/* Success Animation */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center text-white">
          <div className="relative">
            {step >= 1 && (
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CheckCircle className="w-12 h-12 text-white animate-bounce" />
              </div>
            )}
            
            {step >= 2 && (
              <div className="space-y-2 animate-fade-in">
                <h2 className="text-2xl font-bold">🎉 Erfolgreich erstellt!</h2>
                <p className="text-green-100">Ihr Assistant ist einsatzbereit</p>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {step >= 3 && (
          <div className="p-6 space-y-6 animate-slide-up">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">🤖 {assistantName}</h3>
              <p className="text-muted-foreground">
                Ihr {assistantType === 'easy' ? 'Easy' : 'Fortgeschrittener'} Assistant wurde erfolgreich erstellt und ist sofort einsatzbereit.
              </p>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Nächste Schritte:</h4>
              
              <Link 
                href="/voice-test"
                className="flex items-center p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/5 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Sofort testen</div>
                  <div className="text-sm text-muted-foreground">Probieren Sie Ihren Assistant aus</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link 
                href="/dashboard/assistants"
                className="flex items-center p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/5 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mr-3">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Anpassen</div>
                  <div className="text-sm text-muted-foreground">Feintuning und Konfiguration</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              {assistantType === 'advanced' && (
                <Link 
                  href="/workflow-builder"
                  className="flex items-center p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/5 transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mr-3">
                    <Sparkles className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Workflow erweitern</div>
                    <div className="text-sm text-muted-foreground">Integrationen hinzufügen</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 border border-border rounded-lg px-4 py-2 hover:bg-muted transition-colors"
              >
                Später
              </button>
              <Link
                href="/voice-test"
                className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors text-center"
              >
                Jetzt testen
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// CSS für Animationen (in globals.css hinzufügen)
const styles = `
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out;
}
`