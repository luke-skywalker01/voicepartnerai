import { NextRequest, NextResponse } from 'next/server'

// Helper function to get available files for assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Mock available files (in production, fetch from database)
    const availableFiles = [
      {
        id: 'file_1',
        filename: 'company_info.pdf',
        original_name: 'Unternehmensinformationen.pdf',
        file_type: 'application/pdf',
        file_size: 2456789,
        s3_url: 'https://s3.amazonaws.com/voicepartner/files/company_info.pdf',
        extracted_text: 'Unternehmensinformationen: VoicePartnerAI ist ein führender Anbieter von Voice AI Lösungen...',
        description: 'Allgemeine Unternehmensinformationen für Kundenservice',
        status: 'processed',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'file_2',
        filename: 'product_catalog.pdf',
        original_name: 'Produktkatalog_2024.pdf',
        file_type: 'application/pdf',
        file_size: 5123456,
        s3_url: 'https://s3.amazonaws.com/voicepartner/files/product_catalog.pdf',
        extracted_text: 'Produktkatalog 2024: Unsere Voice AI Lösungen umfassen...',
        description: 'Vollständiger Produktkatalog mit Preisen und Features',
        status: 'processed',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'file_3',
        filename: 'faq_document.txt',
        original_name: 'FAQ_Häufige_Fragen.txt',
        file_type: 'text/plain',
        file_size: 456123,
        s3_url: 'https://s3.amazonaws.com/voicepartner/files/faq_document.txt',
        extracted_text: 'Häufig gestellte Fragen: Q: Wie kann ich einen Termin buchen? A: Sie können...',
        description: 'FAQ-Dokument mit häufig gestellten Kundenfragen',
        status: 'processed',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'file_4',
        filename: 'training_data.json',
        original_name: 'KI_Training_Daten.json',
        file_type: 'application/json',
        file_size: 789456,
        s3_url: 'https://s3.amazonaws.com/voicepartner/files/training_data.json',
        extracted_text: '{"conversations": [{"user": "Hallo", "assistant": "Guten Tag!"}...]}',
        description: 'Trainingsdaten für Konversationsverbesserung',
        status: 'processing',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'file_5',
        filename: 'privacy_policy.pdf',
        original_name: 'Datenschutzerklärung.pdf',
        file_type: 'application/pdf',
        file_size: 1234567,
        s3_url: 'https://s3.amazonaws.com/voicepartner/files/privacy_policy.pdf',
        extracted_text: 'Datenschutzerklärung: Diese Datenschutzerklärung erklärt...',
        description: 'Datenschutzerklärung und rechtliche Hinweise',
        status: 'processed',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: {
        assistantId: id,
        availableFiles,
        totalFiles: availableFiles.length,
        stats: {
          totalSize: availableFiles.reduce((sum, file) => sum + file.file_size, 0),
          byStatus: availableFiles.reduce((acc, file) => {
            acc[file.status] = (acc[file.status] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          byType: availableFiles.reduce((acc, file) => {
            const type = file.file_type.split('/')[0]
            acc[type] = (acc[type] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        }
      }
    })
  } catch (error) {
    console.error('Assistant files GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available files' },
      { status: 500 }
    )
  }
}

// POST - Assign files to assistant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { file_ids } = body
    
    if (!Array.isArray(file_ids)) {
      return NextResponse.json(
        { success: false, error: 'file_ids must be an array' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // In production, update assistant-file relationships in database
    // For now, we'll simulate the update
    
    // Validate that all file_ids exist and belong to user
    const validFileIds = ['file_1', 'file_2', 'file_3', 'file_4', 'file_5'] // Mock validation
    const invalidIds = file_ids.filter(id => !validFileIds.includes(id))
    
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid file IDs: ${invalidIds.join(', ')}` 
        },
        { status: 400 }
      )
    }
    
    // Check file status - only allow processed files
    const processingFiles = file_ids.filter(id => id === 'file_4') // file_4 is processing
    if (processingFiles.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot assign files that are still processing: ${processingFiles.join(', ')}` 
        },
        { status: 400 }
      )
    }
    
    // Mock successful assignment
    const assignedFiles = file_ids.map(fileId => ({
      id: fileId,
      filename: `file_${fileId}.pdf`,
      original_name: `Document ${fileId}.pdf`,
      file_size: Math.floor(Math.random() * 5000000),
      status: 'processed',
      assigned_at: new Date().toISOString()
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        assistantId: id,
        assignedFiles,
        totalAssigned: file_ids.length,
        totalSize: assignedFiles.reduce((sum, file) => sum + file.file_size, 0)
      },
      message: 'Files assigned successfully'
    })
  } catch (error) {
    console.error('Assistant files POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to assign files' },
      { status: 500 }
    )
  }
}

// DELETE - Remove file assignment from assistant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('file_id')
    
    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'file_id parameter is required' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // In production, remove assistant-file relationship from database
    // For now, we'll simulate the removal
    
    return NextResponse.json({
      success: true,
      data: {
        assistantId: id,
        removedFileId: fileId
      },
      message: 'File assignment removed successfully'
    })
  } catch (error) {
    console.error('Assistant files DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove file assignment' },
      { status: 500 }
    )
  }
}

// PUT - Update file assignment (e.g., change priority or usage settings)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { file_id, priority, enabled } = body
    
    if (!file_id) {
      return NextResponse.json(
        { success: false, error: 'file_id is required' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // In production, update assistant-file relationship settings in database
    // For now, we'll simulate the update
    
    const updatedAssignment = {
      assistantId: id,
      fileId: file_id,
      priority: priority || 'normal', // high, normal, low
      enabled: enabled !== undefined ? enabled : true,
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: 'File assignment updated successfully'
    })
  } catch (error) {
    console.error('Assistant files PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update file assignment' },
      { status: 500 }
    )
  }
}