import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/admin/',
          '/private/',
          '/_next/',
          '/css-test'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/blog/',
          '/insights/',
          '/features',
          '/pricing',
          '/contact',
          '/datenschutz',
          '/impressum',
          '/agb'
        ],
        disallow: [
          '/dashboard/',
          '/api/',
          '/admin/',
          '/private/'
        ],
      }
    ],
    sitemap: 'https://voicepartnerai.com/sitemap.xml',
    host: 'https://voicepartnerai.com'
  }
}