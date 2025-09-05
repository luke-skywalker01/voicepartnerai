'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar, Clock, User, Mic, Zap, Shield, TrendingUp, Scale, Lightbulb, Search } from 'lucide-react'

const blogPosts = [
  {
    id: 'zukunft-sprachinteraktion',
    title: 'Die Zukunft der Sprachinteraktion',
    excerpt: 'Wie Voice AI die Art verändert, wie wir mit Technologie interagieren und welche Möglichkeiten sich dadurch eröffnen.',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzM5NzNkYztzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MzMzZWE7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZ3JhZDEpIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InJnYmEoMCwwLDAsMC4zKSIvPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iNjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zNzAgMjMwIEw0MTAgMjQ1IEwzNzAgMjYwIFoiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiLz48dGV4dCB4PSI0MDAiIHk9IjM1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSI2MDAiPkZ1dHVyZSBvZiBWb2ljZSBBSTwvdGV4dD48L3N2Zz4=',
    imageAlt: 'Futuristische Visualisierung von Sprachinteraktion mit KI',
    gradient: 'bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700',
    icon: <Mic className="w-10 h-10 text-white" />,
    category: 'KI-Trends',
    categoryColor: 'bg-blue-600',
    date: '15. Dezember 2024',
    readTime: '8 min',
    author: 'Dr. Sarah Weber',
    featured: true
  },
  {
    id: 'voice-ai-gesundheitswesen',
    title: 'Voice AI im Gesundheitswesen',
    excerpt: 'Erfolgsgeschichten und praktische Anwendungen von Sprachassistenten in medizinischen Einrichtungen.',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzEwYjk4MTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwZDk0ODg7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZ3JhZDIpIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InJnYmEoMCwwLDAsMC4zKSIvPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iNjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zNzAgMjMwIEwzOTAgMjMwIEwzOTAgMjcwIEwzNzAgMjcwIFogTTQxMCAyMzAgTDQzMCAyMzAgTDQzMCAyNzAgTDQxMCAyNzAgWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9IjYwMCI+SGVhbHRoY2FyZSBWb2ljZSBBSTwvdGV4dD48L3N2Zz4=',
    imageAlt: 'Arzt verwendet Voice AI-System in moderner Klinik',
    gradient: 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600',
    icon: <Calendar className="w-10 h-10 text-white" />,
    category: 'Use Cases',
    categoryColor: 'bg-green-600',
    date: '10. Dezember 2024',
    readTime: '6 min',
    author: 'Prof. Michael Schmidt',
    featured: true
  },
  {
    id: 'latenz-optimierung-voice-ai',
    title: 'Latenz-Optimierung in Voice AI',
    excerpt: 'Technische Insights zur Minimierung von Antwortzeiten und Verbesserung der Benutzerexperience.',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2Y5N2MxNjtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlYzQ4OTk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZ3JhZDMpIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InJnYmEoMCwwLDAsMC4zKSIvPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iNjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zNzAgMjQwIEwzODAgMjMwIEwzOTAgMjQwIEw0MDAgMjMwIEw0MTAgMjQwIEw0MjAgMjMwIEw0MzAgMjQwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuOCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9IjYwMCI+TGF0ZW5jeSBPcHRpbWl6YXRpb248L3RleHQ+PC9zdmc+',
    imageAlt: 'Netzwerk-Performance-Dashboard mit Echtzeit-Latenz-Metriken',
    gradient: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600',
    icon: <Zap className="w-10 h-10 text-white" />,
    category: 'Technologie',
    categoryColor: 'bg-orange-600',
    date: '5. Dezember 2024',
    readTime: '10 min',
    author: 'Elena Rodriguez',
    featured: false
  },
  {
    id: 'voice-ai-customer-service',
    title: 'Revolution im Kundenservice durch Voice AI',
    excerpt: 'Wie intelligente Sprachbots die Kundenerfahrung verbessern und Supportkosten reduzieren.',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkNCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzYzNjZmMTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlYzQ4OTk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZ3JhZDQpIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InJnYmEoMCwwLDAsMC4zKSIvPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iNjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zNzAgMjMwIEwzODAgMjQwIEwzOTAgMjMwIEw0MDAgMjQ1IEw0MTAgMjMwIEw0MjAgMjQwIEw0MzAgMjMwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuOCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9IjYwMCI+Q3VzdG9tZXIgU2VydmljZSBBSTwvdGV4dD48L3N2Zz4=',
    imageAlt: 'Kundenservice-Mitarbeiterin mit Voice AI-Interface',
    gradient: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    icon: <TrendingUp className="w-10 h-10 text-white" />,
    category: 'Business',
    categoryColor: 'bg-indigo-600',
    date: '28. November 2024',
    readTime: '7 min',
    author: 'Tom Wagner',
    featured: false
  },
  {
    id: 'voice-ai-datenschutz',
    title: 'Datenschutz und Voice AI: Ein Leitfaden',
    excerpt: 'Wichtige Aspekte des Datenschutzes bei der Implementierung von Voice AI-Lösungen in Deutschland.',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkNSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzY0NzQ4YjtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM0Yjc5YTU7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZ3JhZDUpIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InJnYmEoMCwwLDAsMC4zKSIvPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iNjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zODAgMjMwIEwzODAgMjUwIEw0MjAgMjUwIEw0MjAgMjMwIEwzODAgMjMwIE0zOTAgMjMwIEwzOTAgMjIwIEM0MDAsMjIwIDQxMCwyMjAgNDEwLDIzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBvcGFjaXR5PSIwLjgiLz48dGV4dCB4PSI0MDAiIHk9IjM1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSI2MDAiPlByaXZhY3kgJiBTZWN1cml0eTwvdGV4dD48L3N2Zz4=',
    imageAlt: 'Digitale Sicherheit und DSGVO-Compliance Symbolik',
    gradient: 'bg-gradient-to-br from-slate-600 via-gray-700 to-zinc-800',
    icon: <Shield className="w-10 h-10 text-white" />,
    category: 'Rechtliches',
    categoryColor: 'bg-slate-600',
    date: '20. November 2024',
    readTime: '12 min',
    author: 'Dr. Anna Müller',
    featured: false
  },
  {
    id: 'voice-ai-zukunftstechnologien',
    title: 'Voice AI und Zukunftstechnologien',
    excerpt: 'Ein Blick auf kommende Entwicklungen: Multimodal AI, Emotion Recognition und Neural Voice Synthesis.',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkNiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZiYmYyNDtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmOTczMTY7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZ3JhZDYpIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InJnYmEoMCwwLDAsMC4zKSIvPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iNjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iMjAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiLz48dGV4dCB4PSI0MDAiIHk9IjM1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSI2MDAiPkZ1dHVyZSBUZWNobm9sb2dpZXM8L3RleHQ+PC9zdmc+',
    imageAlt: 'Futuristische KI-Technologien und neuronale Netzwerke',
    gradient: 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600',
    icon: <Lightbulb className="w-10 h-10 text-white" />,
    category: 'Innovation',
    categoryColor: 'bg-yellow-600',
    date: '15. November 2024',
    readTime: '9 min',
    author: 'Dr. Lisa Chen',
    featured: false
  }
]

const categories = ['Alle', 'KI-Trends', 'Use Cases', 'Technologie', 'Business', 'Rechtliches', 'Innovation']

const VoiceAILogo = () => (
  <div className="flex items-center space-x-2">
    <div className="relative">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Mic className="w-5 h-5 text-white" />
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
    </div>
    <span className="text-xl font-semibold text-foreground tracking-tight">
      VoicePartnerAI
    </span>
  </div>
)

export default function InsightsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'Alle' || post.category === selectedCategory
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredPosts = filteredPosts.filter(post => post.featured)
  const regularPosts = filteredPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <VoiceAILogo />
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Home
            </Link>
            <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Features
            </Link>
            <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Preise
            </Link>
            <Link href="/insights" className="text-foreground font-medium text-sm border-b-2 border-accent">
              Insights
            </Link>
            <Link href="/#contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Kontakt
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Anmelden
            </Link>
            <Link href="/dashboard" className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 text-sm rounded-md transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-background via-background to-secondary/10 py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Voice AI Insights
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Entdecken Sie die neuesten Trends, Best Practices und Expertenwissen rund um Voice AI-Technologien
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Artikel durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedCategory === category
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredPosts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Empfohlene Artikel</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {featuredPosts.map((post) => (
                <Link key={post.id} href={`/insights/${post.id}`} className="group">
                  <article className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                    <div className="h-64 relative overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={post.featured}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <span className={`text-sm font-medium ${post.categoryColor} backdrop-blur-sm px-3 py-1 rounded-full text-white border border-white/20`}>
                          {post.category}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="bg-accent text-accent-foreground text-xs font-medium px-2 py-1 rounded-full">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{post.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{post.author}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Articles */}
      <section className="py-16 bg-secondary/5">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            {selectedCategory === 'Alle' ? 'Alle Artikel' : `${selectedCategory} Artikel`}
          </h2>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Keine Artikel gefunden für "{searchTerm}" in der Kategorie "{selectedCategory}"</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('Alle') }}
                className="mt-4 text-accent hover:text-accent/80 font-medium"
              >
                Alle Artikel anzeigen
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {regularPosts.map((post) => (
                <Link key={post.id} href={`/insights/${post.id}`} className="group">
                  <article className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                    <div className="h-48 relative overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <span className={`text-xs font-medium ${post.categoryColor} backdrop-blur-sm px-2 py-1 rounded-full text-white border border-white/20`}>
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                        {post.excerpt.length > 100 ? post.excerpt.substring(0, 100) + '...' : post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{post.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{post.author}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-r from-accent/10 to-primary/5">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Bleiben Sie auf dem Laufenden
            </h3>
            <p className="text-muted-foreground mb-6">
              Erhalten Sie die neuesten Voice AI Insights direkt in Ihr Postfach
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Ihre E-Mail-Adresse"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
              />
              <button className="bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap">
                Abonnieren
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Kostenlos und jederzeit abbestellbar. Keine Spam-Garantie.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-2">
              <VoiceAILogo />
              <p className="text-muted-foreground mt-4 max-w-md leading-relaxed">
                Innovative Voice AI-Lösungen für moderne Unternehmen. 
                Natürliche Gesprächstechnologie, die zuhört und versteht.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-medium text-foreground mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link></li>
                <li><Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preise</Link></li>
                <li><Link href="/insights" className="text-muted-foreground hover:text-foreground transition-colors">Insights</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-medium text-foreground mb-4">Rechtliches</h4>
              <ul className="space-y-2">
                <li><Link href="/impressum" className="text-muted-foreground hover:text-foreground transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="text-muted-foreground hover:text-foreground transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="text-muted-foreground hover:text-foreground transition-colors">AGB</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/30 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-xs text-muted-foreground">
                © 2024 VoicePartnerAI GmbH. Alle Rechte vorbehalten.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Link href="/dashboard" className="text-sm text-accent hover:text-accent/80 transition-colors">
                  Dashboard
                </Link>
                <Link href="/#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}