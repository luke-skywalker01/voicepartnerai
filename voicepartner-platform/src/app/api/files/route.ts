import { NextRequest, NextResponse } from 'next/server'

// File metadata structure for demo purposes
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

// In-memory storage for demo (in production, use a database)
let filesStorage: FileMetadata[] = [
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
    extractedText: 'Willkommen bei VoicePartnerAI. Dieses Handbuch enthält alle wichtigen Informationen...',
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
    extractedText: 'Produktkatalog 2024\n\n1. Voice AI Solutions\n- Standard Paket: 299€/Monat\n- Premium Paket: 599€/Monat...',
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
    extractedText: 'Häufig gestellte Fragen\n\nQ: Wie funktioniert Voice AI?\nA: Voice AI kombiniert Spracherkennung...',
    description: 'Sammlung häufig gestellter Fragen und Antworten'
  }
]

// GET - List all files for the user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const fileType = searchParams.get('type')
    const status = searchParams.get('status')
    
    // In production, get user ID from authentication
    const userId = 'user_demo' // Mock user ID
    
    // Filter files by user and optional filters
    let userFiles = filesStorage.filter(file => file.ownerId === userId)
    
    if (fileType) {
      userFiles = userFiles.filter(file => file.fileType.includes(fileType))
    }
    
    if (status) {
      userFiles = userFiles.filter(file => file.status === status)
    }
    
    // Apply pagination
    const paginatedFiles = userFiles.slice(offset, offset + limit)
    
    // Calculate file statistics
    const stats = {
      totalFiles: userFiles.length,
      totalSize: userFiles.reduce((sum, file) => sum + file.fileSize, 0),
      byType: userFiles.reduce((acc, file) => {
        const type = file.fileType.split('/')[0]
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byStatus: userFiles.reduce((acc, file) => {
        acc[file.status] = (acc[file.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        files: paginatedFiles,
        pagination: {
          total: userFiles.length,
          limit,
          offset,
          hasMore: offset + limit < userFiles.length
        },
        stats
      }
    })
    
  } catch (error: any) {
    console.error('Files GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Upload new file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file size (max 10MB for demo)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not supported' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Generate file metadata
    const fileId = `file_${Date.now()}`
    const filename = `${fileId}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // Simulate file upload to S3 (in production, use AWS SDK)
    const s3Url = `https://demo-bucket.s3.amazonaws.com/files/${filename}`
    
    // Extract text content (simulation)
    const buffer = await file.arrayBuffer()
    let extractedText = ''
    
    if (file.type === 'text/plain') {
      extractedText = new TextDecoder().decode(buffer)
    } else if (file.type === 'application/pdf') {
      extractedText = `[PDF Content from ${file.name}] - Simulated extraction of PDF content...`
    } else {
      extractedText = `[${file.type}] - Content extracted and processed`
    }
    
    // Create file metadata
    const newFile: FileMetadata = {
      id: fileId,
      filename,
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      s3Url,
      uploadedAt: new Date().toISOString(),
      ownerId: userId,
      status: 'processed',
      extractedText: extractedText.substring(0, 1000), // Limit for demo
      description: description || `Uploaded file: ${file.name}`
    }
    
    // Store file metadata
    filesStorage.push(newFile)
    
    return NextResponse.json({
      success: true,
      data: {
        file: newFile,
        message: 'File uploaded and processed successfully'
      }
    })
    
  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

// DELETE - Remove file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')
    
    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID required' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Find file
    const fileIndex = filesStorage.findIndex(
      file => file.id === fileId && file.ownerId === userId
    )
    
    if (fileIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }
    
    // Remove file from storage
    const deletedFile = filesStorage.splice(fileIndex, 1)[0]
    
    // In production, also delete from S3
    // await s3Client.deleteObject({
    //   Bucket: process.env.S3_BUCKET,
    //   Key: deletedFile.filename
    // })
    
    return NextResponse.json({
      success: true,
      data: {
        deletedFile,
        message: 'File deleted successfully'
      }
    })
    
  } catch (error: any) {
    console.error('File delete error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    )
  }
}