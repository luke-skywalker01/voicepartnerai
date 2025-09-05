import { NextRequest, NextResponse } from 'next/server'
import { GoogleCalendarService } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, accessToken, calendarId = 'primary', ...params } = body

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Google access token is required' },
        { status: 400 }
      )
    }

    const calendarService = new GoogleCalendarService(accessToken, calendarId)

    switch (action) {
      case 'check_availability':
        const { startDate, endDate, duration = 60 } = params
        
        if (!startDate || !endDate) {
          return NextResponse.json(
            { success: false, error: 'startDate and endDate are required for availability check' },
            { status: 400 }
          )
        }

        const availableSlots = await calendarService.checkAvailability(startDate, endDate, duration)
        
        return NextResponse.json({
          success: true,
          data: {
            availableSlots: availableSlots.slice(0, 10), // Return top 10 slots
            total: availableSlots.length,
            duration,
            searchRange: { startDate, endDate }
          }
        })

      case 'create_event':
        const { event } = params
        
        if (!event) {
          return NextResponse.json(
            { success: false, error: 'Event data is required' },
            { status: 400 }
          )
        }

        const createdEvent = await calendarService.createEvent(event)
        
        return NextResponse.json({
          success: true,
          data: {
            eventId: createdEvent.id,
            htmlLink: createdEvent.htmlLink,
            summary: createdEvent.summary,
            start: createdEvent.start,
            end: createdEvent.end,
            status: createdEvent.status
          },
          message: 'Event created successfully'
        })

      case 'update_event':
        const { eventId, updates } = params
        
        if (!eventId || !updates) {
          return NextResponse.json(
            { success: false, error: 'eventId and updates are required' },
            { status: 400 }
          )
        }

        const updatedEvent = await calendarService.updateEvent(eventId, updates)
        
        return NextResponse.json({
          success: true,
          data: {
            eventId: updatedEvent.id,
            summary: updatedEvent.summary,
            start: updatedEvent.start,
            end: updatedEvent.end,
            status: updatedEvent.status
          },
          message: 'Event updated successfully'
        })

      case 'delete_event':
        const { eventId: deleteEventId } = params
        
        if (!deleteEventId) {
          return NextResponse.json(
            { success: false, error: 'eventId is required' },
            { status: 400 }
          )
        }

        await calendarService.deleteEvent(deleteEventId)
        
        return NextResponse.json({
          success: true,
          message: 'Event deleted successfully'
        })

      case 'get_events':
        const { startTime, endTime } = params
        
        if (!startTime || !endTime) {
          return NextResponse.json(
            { success: false, error: 'startTime and endTime are required' },
            { status: 400 }
          )
        }

        const events = await calendarService.getEvents(startTime, endTime)
        
        return NextResponse.json({
          success: true,
          data: {
            events: events.map(event => ({
              id: event.id,
              summary: event.summary,
              start: event.start,
              end: event.end,
              status: event.status,
              attendees: event.attendees
            })),
            total: events.length,
            range: { startTime, endTime }
          }
        })

      case 'get_next_available':
        const { count = 5, slotDuration = 60 } = params
        
        const nextSlots = await calendarService.getNextAvailableSlots(count, slotDuration)
        
        return NextResponse.json({
          success: true,
          data: {
            availableSlots: nextSlots.map(slot => ({
              start: slot.start,
              end: slot.end,
              formatted: GoogleCalendarService.formatTimeSlot(slot)
            })),
            total: nextSlots.length,
            duration: slotDuration
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Google Calendar API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint for simple availability checks
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const accessToken = url.searchParams.get('access_token')
    const calendarId = url.searchParams.get('calendar_id') || 'primary'
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')
    const duration = parseInt(url.searchParams.get('duration') || '60')

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'access_token parameter is required' },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'start_date and end_date parameters are required' },
        { status: 400 }
      )
    }

    const calendarService = new GoogleCalendarService(accessToken, calendarId)
    const availableSlots = await calendarService.checkAvailability(startDate, endDate, duration)

    return NextResponse.json({
      success: true,
      data: {
        availableSlots: availableSlots.slice(0, 10),
        total: availableSlots.length,
        duration,
        searchRange: { startDate, endDate }
      }
    })
  } catch (error: any) {
    console.error('Google Calendar GET error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}