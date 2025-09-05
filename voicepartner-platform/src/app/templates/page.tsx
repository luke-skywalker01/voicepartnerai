'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FileText, 
  Download, 
  Star, 
  Eye, 
  Copy,
  Filter,
  Search,
  Bot,
  Phone,
  Calendar,
  ShoppingCart,
  Heart,
  Briefcase,
  GraduationCap,
  Home as HomeIcon,
  ArrowLeft
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  rating: number
  downloads: number
  preview: string
  tags: string[]
  icon: any
}

const templates: Template[] = [
  {
    id: '1',
    name: 'Termin-Buchungs-Agent',
    description: 'Ein intelligenter Agent für die automatische Terminbuchung mit Kalender-Integration',
    category: 'Business',
    difficulty: 'Beginner',
    rating: 4.8,
    downloads: 1234,
    preview: 'Guten Tag! Ich bin Ihr Termin-Assistant. Für welchen Service möchten Sie einen Termin vereinbaren?',
    tags: ['Terminbuchung', 'Kalender', 'Business'],
    icon: Calendar
  },
  {
    id: '2',
    name: 'Kunden-Support-Agent',
    description: 'Umfassender Kundenservice-Agent mit FAQ-Integration und Ticket-System',
    category: 'Support',
    difficulty: 'Intermediate',
    rating: 4.9,
    downloads: 892,
    preview: 'Hallo! Ich bin hier, um Ihnen bei Ihren Fragen zu helfen. Was kann ich für Sie tun?',
    tags: ['Support', 'FAQ', 'Tickets'],
    icon: Bot
  },
  {
    id: '3',
    name: 'E-Commerce-Verkaufs-Agent',
    description: 'Verkaufsassistent für Online-Shops mit Produktberatung und Bestellabwicklung',
    category: 'E-Commerce',
    difficulty: 'Advanced',
    rating: 4.7,
    downloads: 567,
    preview: 'Willkommen in unserem Shop! Kann ich Ihnen bei der Produktauswahl helfen?',
    tags: ['E-Commerce', 'Verkauf', 'Produkte'],
    icon: ShoppingCart
  },
  {
    id: '4',
    name: 'Arztpraxis-Rezeption',
    description: 'Spezialisierter Agent für Arztpraxen mit Terminvergabe und Patientenbetreuung',
    category: 'Healthcare',
    difficulty: 'Intermediate',
    rating: 4.6,
    downloads: 423,
    preview: 'Guten Tag! Praxis Dr. Müller. Wie kann ich Ihnen behilflich sein?',
    tags: ['Gesundheit', 'Termine', 'Praxis'],
    icon: Heart
  },
  {
    id: '5',
    name: 'Immobilien-Berater',
    description: 'Immobilien-Agent für Besichtigungstermine und Objektinformationen',
    category: 'Real Estate',
    difficulty: 'Beginner',
    rating: 4.5,
    downloads: 345,
    preview: 'Hallo! Ich helfe Ihnen gerne bei der Suche nach Ihrer Traumimmobilie.',
    tags: ['Immobilien', 'Besichtigung', 'Beratung'],
    icon: HomeIcon
  },
  {
    id: '6',
    name: 'Restaurant-Reservierung',
    description: 'Restaurantbuchungs-Agent mit Tischreservierung und Menü-Information',
    category: 'Hospitality',
    difficulty: 'Beginner',
    rating: 4.4,
    downloads: 289,
    preview: 'Willkommen im Restaurant Zum Goldenen Hirsch! Möchten Sie einen Tisch reservieren?',
    tags: ['Restaurant', 'Reservierung', 'Gastronomie'],
    icon: Briefcase
  },
  {
    id: '7',
    name: 'Bildungs-Assistent',
    description: 'Lern-Agent für Bildungseinrichtungen mit Kursanmeldung und Informationen',
    category: 'Education',
    difficulty: 'Intermediate',
    rating: 4.3,
    downloads: 234,
    preview: 'Hallo! Ich bin Ihr Bildungsassistent. Welche Kurse interessieren Sie?',
    tags: ['Bildung', 'Kurse', 'Anmeldung'],
    icon: GraduationCap
  }
]

const categories = ['Alle', 'Business', 'Support', 'E-Commerce', 'Healthcare', 'Real Estate', 'Hospitality', 'Education']

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'Alle' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const useTemplate = (template: Template) => {
    // In einer echten App würde dies zur Agent-Builder-Seite weiterleiten
    alert(`Template "${template.name}" wird geladen...`)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-muted rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Agent Templates</h1>
                <p className="text-muted-foreground">Starten Sie schnell mit vorgefertigten Voice Agent Templates</p>
              </div>
            </div>
            <Link
              href="/agent-builder"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Eigenen Agent erstellen
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Templates suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <template.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      template.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                      template.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {template.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{template.rating}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Preview */}
              <div className="bg-muted/50 rounded-md p-3 mb-4">
                <p className="text-sm italic text-muted-foreground">
                  "{template.preview}"
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <Download className="h-4 w-4" />
                  <span>{template.downloads.toLocaleString('de-DE')} Downloads</span>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {template.category}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => useTemplate(template)}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm flex items-center justify-center"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Template verwenden
                </button>
                <button className="p-2 border border-border rounded-md hover:bg-muted">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Keine Templates gefunden</h3>
            <p className="text-muted-foreground mb-6">
              Versuchen Sie andere Suchbegriffe oder Kategorien.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('Alle')
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}

        {/* Template Request CTA */}
        <div className="mt-12 bg-card border border-border rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Vermissen Sie ein Template?</h3>
          <p className="text-muted-foreground mb-6">
            Lassen Sie uns wissen, welche Art von Voice Agent Template Sie benötigen, 
            und wir erstellen es für Sie.
          </p>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Template vorschlagen
          </button>
        </div>
      </div>
    </div>
  )
}