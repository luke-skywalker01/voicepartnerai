import { NextRequest, NextResponse } from 'next/server'

// Mock file storage (same as in main route)
interface FileMetadata {
  id: string
  filename: string
  originalName: string
  fileType: string
  fileSize: number
  s3Url?: string
  uploadedAt: string
  ownerId: string
  status: 'uploading' | 'processed' | 'error'
  extractedText?: string
  description?: string
}

// In production, this would be fetched from database
const getFilesStorage = (): FileMetadata[] => [
  {
    id: 'file_1',
    filename: 'company-handbook.pdf',
    originalName: 'Unternehmenshandbuch.pdf',
    fileType: 'application/pdf',
    fileSize: 2048576,
    s3Url: 'https://demo-bucket.s3.amazonaws.com/files/company-handbook.pdf',
    uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    ownerId: 'user_demo',
    status: 'processed',
    extractedText: 'Willkommen bei VoicePartnerAI. Dieses Handbuch enthält alle wichtigen Informationen über unsere Unternehmensrichtlinien, Arbeitsabläufe und Standards. Kapitel 1: Einführung - VoicePartnerAI ist ein innovatives Unternehmen im Bereich der Sprach-KI-Technologie...',
    description: 'Unternehmenshandbuch mit Richtlinien und Verfahren'
  },
  {
    id: 'file_2',
    filename: 'product-catalog.txt',
    originalName: 'Produktkatalog.txt',
    fileType: 'text/plain',
    fileSize: 512000,
    s3Url: 'https://demo-bucket.s3.amazonaws.com/files/product-catalog.txt',
    uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    ownerId: 'user_demo',
    status: 'processed',
    extractedText: 'Produktkatalog 2024\n\n1. Voice AI Solutions\n- Standard Paket: 299€/Monat\n- Premium Paket: 599€/Monat\n- Enterprise Paket: 1299€/Monat\n\n2. Features\n- Spracherkennung in 30+ Sprachen\n- Natürliche Sprachgenerierung\n- Anpassbare Stimmen\n- API-Integration\n- 24/7 Support',
    description: 'Aktueller Produktkatalog mit Preisen und Beschreibungen'
  },
  {
    id: 'file_3',
    filename: 'faq-document.pdf',
    originalName: 'FAQ-Sammlung.pdf',
    fileType: 'application/pdf',
    fileSize: 1024000,
    s3Url: 'https://demo-bucket.s3.amazonaws.com/files/faq-document.pdf',
    uploadedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    ownerId: 'user_demo',
    status: 'processed',
    extractedText: 'Häufig gestellte Fragen\n\nQ: Wie funktioniert Voice AI?\nA: Voice AI kombiniert Spracherkennung mit natürlicher Sprachverarbeitung, um menschenähnliche Konversationen zu ermöglichen.\n\nQ: Welche Sprachen werden unterstützt?\nA: Wir unterstützen über 30 Sprachen, darunter Deutsch, Englisch, Französisch, Spanisch und viele mehr.',
    description: 'Sammlung häufig gestellter Fragen und Antworten'
  }
]

// GET - Get specific file details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Find file
    const filesStorage = getFilesStorage()
    const file = filesStorage.find(f => f.id === id && f.ownerId === userId)
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: { file }
    })
    
  } catch (error: any) {
    console.error('File GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update file metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { description } = body
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Find and update file
    const filesStorage = getFilesStorage()
    const fileIndex = filesStorage.findIndex(f => f.id === id && f.ownerId === userId)
    
    if (fileIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }
    
    // Update file metadata
    const updatedFile = {
      ...filesStorage[fileIndex],
      description: description || filesStorage[fileIndex].description
    }
    
    // In production, update in database
    // filesStorage[fileIndex] = updatedFile
    
    return NextResponse.json({
      success: true,
      data: {
        file: updatedFile,
        message: 'File updated successfully'
      }
    })
    
  } catch (error: any) {
    console.error('File PUT error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Update failed' },
      { status: 500 }
    )
  }
}

// DELETE - Delete specific file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Find file
    const filesStorage = getFilesStorage()
    const fileIndex = filesStorage.findIndex(f => f.id === id && f.ownerId === userId)
    
    if (fileIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }
    
    const deletedFile = filesStorage[fileIndex]
    
    // In production, delete from database and S3
    // filesStorage.splice(fileIndex, 1)
    // await s3Client.deleteObject({ Bucket: bucket, Key: deletedFile.filename })
    
    return NextResponse.json({
      success: true,
      data: {
        deletedFile,
        message: 'File deleted successfully'
      }
    })
    
  } catch (error: any) {
    console.error('File DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    )
  }
}