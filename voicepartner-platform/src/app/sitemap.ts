import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://voicepartnerai.com'
  
  // Blog articles for SEO
  const blogPosts = [
    {
      slug: 'voice-ai-revolution-deutsche-unternehmen-2025',
      lastModified: '2025-01-15',
      priority: 0.9
    },
    {
      slug: 'dsgvo-voice-ai-datenschutz-sprachassistenten',
      lastModified: '2025-01-12',
      priority: 0.9
    },
    {
      slug: 'roi-voice-ai-erfolgsgeschichten-praxis',
      lastModified: '2025-01-10',
      priority: 0.8
    },
    {
      slug: 'multilinguale-voice-ai-kommunikation-sprachen',
      lastModified: '2025-01-08',
      priority: 0.8
    },
    {
      slug: 'voice-commerce-zukunft-ecommerce-stimme',
      lastModified: '2025-01-05',
      priority: 0.8
    },
    {
      slug: 'voice-ai-gesundheitswesen-praxen-kliniken',
      lastModified: '2025-01-03',
      priority: 0.9
    }
  ]
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Blog articles
    ...blogPosts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.lastModified),
      changeFrequency: 'monthly' as const,
      priority: post.priority,
    })),
    {
      url: `${baseUrl}/insights`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/insights/zukunft-sprachinteraktion`,
      lastModified: new Date('2024-12-15'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/insights/voice-ai-gesundheitswesen`,
      lastModified: new Date('2024-12-10'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/insights/latenz-optimierung-voice-ai`,
      lastModified: new Date('2024-12-05'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/datenschutz`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/impressum`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/agb`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}