'use client'

import { motion } from 'framer-motion'
import { Bot, MessageCircle, Clock, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatsCardsProps {
  stats: {
    totalBots: number
    activeConversations: number
    totalMinutes: number
    successRate: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Voice Bots',
      value: stats.totalBots.toString(),
      subtitle: 'Aktive Bots',
      icon: Bot,
      color: 'bg-blue-100 text-blue-600',
      trend: '+12%'
    },
    {
      title: 'Gespräche',
      value: stats.activeConversations.toString(),
      subtitle: 'Heute aktiv',
      icon: MessageCircle,
      color: 'bg-green-100 text-green-600',
      trend: '+8%'
    },
    {
      title: 'Gesprächszeit',
      value: `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`,
      subtitle: 'Diesen Monat',
      icon: Clock,
      color: 'bg-purple-100 text-purple-600',
      trend: '+23%'
    },
    {
      title: 'Erfolgsrate',
      value: `${stats.successRate}%`,
      subtitle: 'Durchschnitt',
      icon: TrendingUp,
      color: 'bg-accent/10 text-accent',
      trend: '+2%'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {card.subtitle}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-2`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {card.trend}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}