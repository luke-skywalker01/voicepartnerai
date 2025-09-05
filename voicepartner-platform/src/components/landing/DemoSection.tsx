'use client'

import { motion } from 'framer-motion'
import { Play, Mic, MessageCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function DemoSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-6"
          >
            Sehen Sie VoicePartnerAI in Aktion
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Erleben Sie selbst, wie natürlich und intelligent unsere Voice AI Assistenten sind. 
            Probieren Sie es direkt in Ihrem Browser aus.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Demo Video/Interface */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Card className="p-8 bg-gradient-to-br from-card to-card/80 border-border shadow-lg">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent text-accent-foreground mb-6">
                  <Play className="h-10 w-10 ml-1" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Live Demo starten
                </h3>
                <p className="text-muted-foreground mb-6">
                  Sprechen Sie mit unserem Massage-Salon Bot und erleben Sie, 
                  wie er Termine vereinbart und Fragen beantwortet.
                </p>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3">
                  <Mic className="h-5 w-5 mr-2" />
                  Demo starten
                </Button>
              </div>
            </Card>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/10 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
          </motion.div>

          {/* Demo Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-start space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Natürliche Gespräche
                </h4>
                <p className="text-muted-foreground">
                  Unser Bot versteht Kontext, merkt sich Details und führt 
                  fließende Unterhaltungen wie ein echter Mitarbeiter.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600 flex-shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Intelligente Aktionen
                </h4>
                <p className="text-muted-foreground">
                  Automatische Terminbuchung, Weiterleitung an Experten und 
                  Integration in Ihre bestehenden Systeme.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex-shrink-0">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Perfekte Spracherkennung
                </h4>
                <p className="text-muted-foreground">
                  Versteht deutsche Dialekte, Umgangssprache und selbst 
                  bei schlechter Verbindung oder Hintergrundgeräuschen.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6">
              <Button variant="outline" className="w-full">
                Vollständige Demo anfordern
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">98%</div>
            <div className="text-sm text-muted-foreground">Erfolgsrate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">2.4s</div>
            <div className="text-sm text-muted-foreground">Antwortzeit</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">50k+</div>
            <div className="text-sm text-muted-foreground">Gespräche/Monat</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Verfügbarkeit</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}