import { NextRequest, NextResponse } from 'next/server'
import { VapiAssistant } from '../route'

// Mock database - in production, use your actual database
const assistants: VapiAssistant[] = []

// GET /api/vapi/assistants/[id] - Get specific assistant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const assistant = assistants.find(a => a.id === id)
    
    if (!assistant) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(assistant)
  } catch (error) {
    console.error('Error fetching assistant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/assistants/[id] - Update assistant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const assistantIndex = assistants.findIndex(a => a.id === id)
    
    if (assistantIndex === -1) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      )
    }
    
    // Update assistant
    const updatedAssistant: VapiAssistant = {
      ...assistants[assistantIndex],
      ...body,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }
    
    assistants[assistantIndex] = updatedAssistant
    
    return NextResponse.json(updatedAssistant)
  } catch (error) {
    console.error('Error updating assistant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/assistants/[id] - Delete assistant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const assistantIndex = assistants.findIndex(a => a.id === id)
    
    if (assistantIndex === -1) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      )
    }
    
    // Remove assistant
    const deletedAssistant = assistants.splice(assistantIndex, 1)[0]
    
    return NextResponse.json(deletedAssistant)
  } catch (error) {
    console.error('Error deleting assistant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}