// Google Calendar API Integration
export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export interface FreeBusyRequest {
  timeMin: string
  timeMax: string
  timeZone?: string
  items: Array<{
    id: string
  }>
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export class GoogleCalendarService {
  private accessToken: string
  private calendarId: string

  constructor(accessToken: string, calendarId: string = 'primary') {
    this.accessToken = accessToken
    this.calendarId = calendarId
  }

  // Check calendar availability for given time range
  async checkAvailability(
    startDate: string, 
    endDate: string, 
    duration: number = 60
  ): Promise<TimeSlot[]> {
    try {
      const freeBusyRequest: FreeBusyRequest = {
        timeMin: startDate,
        timeMax: endDate,
        timeZone: 'Europe/Berlin',
        items: [{ id: this.calendarId }]
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(freeBusyRequest)
      })

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`)
      }

      const data = await response.json()
      const busyTimes = data.calendars[this.calendarId]?.busy || []

      // Generate available time slots
      return this.generateAvailableSlots(startDate, endDate, duration, busyTimes)
    } catch (error) {
      console.error('Calendar availability check failed:', error)
      throw error
    }
  }

  // Generate available time slots excluding busy periods
  private generateAvailableSlots(
    startDate: string, 
    endDate: string, 
    duration: number, 
    busyTimes: Array<{start: string, end: string}>
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    const slotDuration = duration * 60 * 1000 // Convert to milliseconds

    // Business hours: 9 AM to 6 PM, Monday to Friday
    const businessHours = {
      start: 9,
      end: 18
    }

    let current = new Date(start)
    current.setHours(businessHours.start, 0, 0, 0)

    while (current < end) {
      // Skip weekends
      if (current.getDay() === 0 || current.getDay() === 6) {
        current.setDate(current.getDate() + 1)
        current.setHours(businessHours.start, 0, 0, 0)
        continue
      }

      // Skip outside business hours
      if (current.getHours() >= businessHours.end) {
        current.setDate(current.getDate() + 1)
        current.setHours(businessHours.start, 0, 0, 0)
        continue
      }

      const slotEnd = new Date(current.getTime() + slotDuration)
      
      // Check if slot conflicts with busy times
      const isAvailable = !busyTimes.some(busy => {
        const busyStart = new Date(busy.start)
        const busyEnd = new Date(busy.end)
        return (current < busyEnd && slotEnd > busyStart)
      })

      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        available: isAvailable
      })

      // Move to next 30-minute slot
      current.setMinutes(current.getMinutes() + 30)
    }

    return slots.filter(slot => slot.available)
  }

  // Create a new calendar event
  async createEvent(event: CalendarEvent): Promise<any> {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to create event: ${errorData.error?.message || response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to create calendar event:', error)
      throw error
    }
  }

  // Update an existing calendar event
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<any> {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to update calendar event:', error)
      throw error
    }
  }

  // Delete a calendar event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to delete calendar event:', error)
      throw error
    }
  }

  // Get events for a specific date range
  async getEvents(startDate: string, endDate: string): Promise<any[]> {
    try {
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`)
      url.searchParams.set('timeMin', startDate)
      url.searchParams.set('timeMax', endDate)
      url.searchParams.set('singleEvents', 'true')
      url.searchParams.set('orderBy', 'startTime')

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get events: ${response.status}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Failed to get calendar events:', error)
      throw error
    }
  }

  // Format time slots for display
  static formatTimeSlot(slot: TimeSlot): string {
    const start = new Date(slot.start)
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Berlin'
    }
    
    return start.toLocaleDateString('de-DE', options)
  }

  // Get next available slots for quick booking
  async getNextAvailableSlots(count: number = 5, duration: number = 60): Promise<TimeSlot[]> {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const allSlots = await this.checkAvailability(
      now.toISOString(),
      nextWeek.toISOString(),
      duration
    )

    return allSlots.slice(0, count)
  }
}