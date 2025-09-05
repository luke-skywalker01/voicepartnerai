import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowRight, Search, Filter, Tag, User, Mic, TrendingUp, Shield, Zap, Globe, Users, Brain, Bot } from 'lucide-react'
import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Loading skeleton component
function BlogCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-muted"></div>
      <div className="p-6 space-y-4">
        <div className="flex space-x-4">
          <div className="h-6 w-16 bg-muted rounded-full"></div>
          <div className="h-6 w-24 bg-muted rounded"></div>
        </div>
        <div className="h-8 bg-muted rounded"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Voice AI Blog - Neueste Trends und Insights | VoicePartnerAI',
  description: 'Bleiben Sie auf dem Laufenden über die neuesten Entwicklungen in Voice AI, Sprachassistenten und KI-Technologie. Expertenwissen für deutsche Unternehmen.',
  keywords: ['Voice AI Blog', 'Sprachassistent Trends', 'KI News', 'Voice Technology', 'Deutschland', 'Artificial Intelligence'],
  openGraph: {
    title: 'Voice AI Blog - Neueste Trends und Insights',
    description: 'Expertenwissen und aktuelle Entwicklungen in Voice AI für deutsche Unternehmen',
    url: 'https://voicepartnerai.com/blog',
    siteName: 'VoicePartnerAI',
    images: [
      {
        url: '/images/blog/voice-ai-trends-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Voice AI Blog - Trends und Insights',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  alternates: {
    canonical: 'https://voicepartnerai.com/blog',
  },
}

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  slug: string
  author: {
    name: string
    avatar: string
    role: string
  }
  publishedAt: string
  readTime: number
  category: string
  tags: string[]
  featured: boolean
  image: string
  seoKeywords: string[]
}

// Performance optimization: Memoize heavy operations
const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Voice AI Revolution: Wie Deutsche Unternehmen 2025 von Sprachassistenten profitieren',
    excerpt: 'Entdecken Sie, wie Voice AI die deutsche Geschäftswelt transformiert und welche konkreten Vorteile Unternehmen bereits heute nutzen können.',
    content: '',
    slug: 'voice-ai-revolution-deutsche-unternehmen-2025',
    author: {
      name: 'Dr. Sarah Mueller',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      role: 'Voice AI Expertin'
    },
    publishedAt: '2025-01-15',
    readTime: 8,
    category: 'Trends',
    tags: ['Voice AI', 'Digitalisierung', 'Unternehmen', 'Innovation'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80',
    seoKeywords: ['Voice AI Deutschland', 'Sprachassistent Unternehmen', 'KI Trends 2025']
  },
  {
    id: '2',
    title: 'DSGVO-konforme Voice AI: Datenschutz bei Sprachassistenten richtig umsetzen',
    excerpt: 'Wie Sie Voice AI-Lösungen DSGVO-konform implementieren und dabei höchste Datenschutzstandards einhalten.',
    content: '',
    slug: 'dsgvo-voice-ai-datenschutz-sprachassistenten',
    author: {
      name: 'Michael Weber',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      role: 'Datenschutz-Experte'
    },
    publishedAt: '2025-01-12',
    readTime: 12,
    category: 'Datenschutz',
    tags: ['DSGVO', 'Datenschutz', 'Compliance', 'Sicherheit'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80',
    seoKeywords: ['DSGVO Voice AI', 'Datenschutz Sprachassistent', 'Voice AI Compliance']
  },
  {
    id: '3',
    title: 'ROI von Voice AI: Konkrete Zahlen und Erfolgsgeschichten aus der Praxis',
    excerpt: 'Echte Fallstudien zeigen: Unternehmen steigern Effizienz um bis zu 40% durch intelligente Sprachassistenten.',
    content: '',
    slug: 'roi-voice-ai-erfolgsgeschichten-praxis',
    author: {
      name: 'Lisa Hoffmann',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      role: 'Business Analyst'
    },
    publishedAt: '2025-01-10',
    readTime: 6,
    category: 'Business',
    tags: ['ROI', 'Fallstudien', 'Effizienz', 'Kostenersparnis'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    seoKeywords: ['Voice AI ROI', 'Sprachassistent Erfolg', 'Voice AI Kostenersparnis']
  },
  {
    id: '4',
    title: 'Multilinguale Voice AI: Perfekte Kommunikation in über 30 Sprachen',
    excerpt: 'Erschließen Sie globale Märkte mit Voice AI, die perfekt Deutsch, Englisch und 30+ weitere Sprachen beherrscht.',
    content: '',
    slug: 'multilinguale-voice-ai-kommunikation-sprachen',
    author: {
      name: 'Dr. Andreas Schmidt',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      role: 'Sprachtechnologie-Experte'
    },
    publishedAt: '2025-01-08',
    readTime: 10,
    category: 'Technologie',
    tags: ['Mehrsprachigkeit', 'Globalisierung', 'Sprachtechnologie', 'International'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&q=80',
    seoKeywords: ['Mehrsprachige Voice AI', 'Voice AI Sprachen', 'Internationale Sprachassistenten']
  },
  {
    id: '5',
    title: 'Voice Commerce: Die Zukunft des E-Commerce liegt in der Stimme',
    excerpt: 'Sprachgesteuerte Einkäufe werden zum Standard. Bereiten Sie Ihren Online-Shop auf die Voice Commerce Revolution vor.',
    content: '',
    slug: 'voice-commerce-zukunft-ecommerce-stimme',
    author: {
      name: 'Jennifer Klein',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
      role: 'E-Commerce Strategin'
    },
    publishedAt: '2025-01-05',
    readTime: 9,
    category: 'E-Commerce',
    tags: ['Voice Commerce', 'E-Commerce', 'Online Shopping', 'Zukunft'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
    seoKeywords: ['Voice Commerce Deutschland', 'Sprachgesteuertes Shopping', 'Voice E-Commerce']
  },
  {
    id: '6',
    title: 'Voice AI im Gesundheitswesen: Revolutionäre Anwendungen für Praxen und Kliniken',
    excerpt: 'Wie Voice AI die medizinische Dokumentation vereinfacht und Ärzten mehr Zeit für Patienten verschafft.',
    content: '',
    slug: 'voice-ai-gesundheitswesen-praxen-kliniken',
    author: {
      name: 'Dr. med. Thomas Richter',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&h=100&fit=crop&crop=face',
      role: 'Medizin-Informatiker'
    },
    publishedAt: '2025-01-03',
    readTime: 11,
    category: 'Gesundheitswesen',
    tags: ['Healthcare', 'Medizin', 'Digitalisierung', 'Patientenversorgung'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
    seoKeywords: ['Voice AI Gesundheitswesen', 'Sprachassistent Medizin', 'Voice AI Arztpraxis']
  }
]

const categories = [
  { name: 'Alle', count: blogPosts.length, slug: 'alle' },
  { name: 'Trends', count: blogPosts.filter(p => p.category === 'Trends').length, slug: 'trends' },
  { name: 'Technologie', count: blogPosts.filter(p => p.category === 'Technologie').length, slug: 'technologie' },
  { name: 'Business', count: blogPosts.filter(p => p.category === 'Business').length, slug: 'business' },
  { name: 'Datenschutz', count: blogPosts.filter(p => p.category === 'Datenschutz').length, slug: 'datenschutz' },
  { name: 'E-Commerce', count: blogPosts.filter(p => p.category === 'E-Commerce').length, slug: 'ecommerce' },
  { name: 'Gesundheitswesen', count: blogPosts.filter(p => p.category === 'Gesundheitswesen').length, slug: 'gesundheitswesen' }
]

const featuredPosts = blogPosts.filter(post => post.featured)
const regularPosts = blogPosts.filter(post => !post.featured)

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Blog Hero Section */}
      <div className="bg-gradient-to-br from-background via-background to-secondary/10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 text-accent mb-6">
              <Mic className="w-6 h-6" />
              <span className="text-sm font-medium uppercase tracking-wider">Voice AI Blog</span>
            </div>
            <h1 className="anthropic-heading mb-6">
              Neueste Insights zu Voice AI und{" "}
              <span className="text-accent">Sprachassistenten</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              Bleiben Sie auf dem Laufenden über die neuesten Entwicklungen in Voice AI, 
              Sprachassistenten und KI-Technologie. Expertenwissen für österreichische Unternehmen.
            </p>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Blog-Artikel durchsuchen..."
                  className="w-full pl-12 pr-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                />
              </div>
              <button className="flex items-center justify-center space-x-2 px-6 py-3 border border-input rounded-lg bg-background hover:bg-muted transition-colors whitespace-nowrap">
                <Filter className="w-5 h-5" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-1">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center space-x-3 mb-8">
                  <TrendingUp className="w-6 h-6 text-accent" />
                  <h2 className="text-3xl font-bold text-foreground">Empfohlene Artikel</h2>
                </div>
                
                <Suspense fallback={
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <BlogCardSkeleton />
                    <BlogCardSkeleton />
                  </div>
                }>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {featuredPosts.map((post) => (
                    <article key={post.id} className="group">
                      <Link href={`/blog/${post.slug}`}>
                        <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 group-hover:-translate-y-2 anthropic-fade">
                          <div className="aspect-[16/10] relative overflow-hidden">
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority={post.featured}
                              loading={post.featured ? "eager" : "lazy"}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          
                          <div className="p-8">
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                              <span className="inline-flex items-center px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                                {post.category}
                              </span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(post.publishedAt).toLocaleDateString('de-DE')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{post.readTime} Min. Lesezeit</span>
                              </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-accent transition-colors leading-tight">
                              {post.title}
                            </h3>
                            
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                              {post.excerpt}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-accent/20">
                                  <Image
                                    src={post.author.avatar}
                                    alt={post.author.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
                                  <p className="text-xs text-muted-foreground">{post.author.role}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-accent group-hover:translate-x-2 transition-transform duration-300">
                                <span className="text-sm font-medium mr-2">Lesen</span>
                                <ArrowRight className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                  </div>
                </Suspense>
              </section>
            )}

            {/* Regular Posts */}
            <section>
              <h2 className="text-3xl font-bold text-foreground mb-8">Alle Artikel</h2>
              
              <div className="space-y-6">
                {regularPosts.map((post) => (
                  <article key={post.id} className="group">
                    <Link href={`/blog/${post.slug}`}>
                      <div className="flex flex-col lg:flex-row gap-8 p-8 bg-card border border-border rounded-2xl hover:shadow-lg transition-all duration-500 group-hover:-translate-y-1 anthropic-fade">
                        <div className="lg:w-64 aspect-[4/3] rounded-xl flex-shrink-0 relative overflow-hidden">
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 256px"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                              <span className="inline-flex items-center px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                                {post.category}
                              </span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(post.publishedAt).toLocaleDateString('de-DE')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{post.readTime} Min. Lesezeit</span>
                              </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-accent transition-colors leading-tight">
                              {post.title}
                            </h3>
                            
                            <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
                              {post.excerpt}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-accent/20">
                                <Image
                                  src={post.author.avatar}
                                  alt={post.author.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
                                <p className="text-xs text-muted-foreground">{post.author.role}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 text-accent group-hover:translate-x-2 transition-transform duration-300">
                              <span className="text-sm font-semibold">Artikel lesen</span>
                              <ArrowRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            <div className="sticky top-8 space-y-8">
              {/* Categories */}
              <div className="bg-card border border-border rounded-2xl p-8">
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
                  <Tag className="w-6 h-6 mr-3 text-accent" />
                  Kategorien
                </h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/blog/category/${category.slug}`}
                      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted transition-all duration-300 group"
                    >
                      <span className="text-foreground group-hover:text-accent transition-colors font-medium">
                        {category.name}
                      </span>
                      <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-semibold">
                        {category.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Voice AI Newsletter
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Erhalten Sie die neuesten Voice AI Trends und Insights direkt in Ihr Postfach.
                </p>
                <form className="space-y-4">
                  <input
                    type="email"
                    placeholder="Ihre E-Mail-Adresse"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-3 px-4 rounded-lg transition-colors font-semibold"
                  >
                    Abonnieren
                  </button>
                </form>
              </div>

              {/* Popular Tags */}
              <div className="bg-card border border-border rounded-2xl p-8">
                <h3 className="text-xl font-bold text-foreground mb-6">
                  Beliebte Tags
                </h3>
                <div className="flex flex-wrap gap-3">
                  {['Voice AI', 'Sprachassistent', 'DSGVO', 'ROI', 'E-Commerce', 'Healthcare', 'Trends', 'Innovation', 'Datenschutz', 'KI'].map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tag.toLowerCase().replace(' ', '-')}`}
                      className="px-4 py-2 bg-muted hover:bg-accent/10 hover:text-accent text-sm rounded-full transition-all duration-300 font-medium"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}