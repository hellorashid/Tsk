# Schedule Event Data Structure

## Overview
The schedule uses a unified `ScheduleCardData` interface for all calendar items, with a `type` field to distinguish between different kinds of items. The structure is designed to be compatible with Google Calendar API format while maintaining app-specific features.

## Data Structure: `ScheduleCardData`

```typescript
interface ScheduleCardData {
  // Core Identification
  id: string;                    // Unique identifier
  
  // Basic Information
  title: string;                 // Display name/title
  description?: string;           // Optional description/notes
  
  // Timing (Google Calendar compatible structure)
  start: {
    dateTime?: string;            // ISO 8601 datetime (e.g., "2024-01-15T09:00:00-08:00")
    date?: string;                // ISO date for all-day events (e.g., "2024-01-15")
    timeZone?: string;            // IANA timezone (e.g., "America/Los_Angeles")
  };
  end: {
    dateTime?: string;            // ISO 8601 datetime
    date?: string;                // ISO date for all-day events
    timeZone?: string;            // IANA timezone
  };
  
  // Visual Styling
  color: string;                  // Background color (RGBA format)
  
  // Type Classification
  type?: 'event' | 'task' | 'other';  // Type discriminator
  
  // Task-specific fields
  taskId?: string;                // If type='task', link to the actual task ID (read task.completed from referenced task)
}
```

**Note:** This is the minimal structure. Additional fields can be added later for Google Calendar integration:
- `summary` (alias for title)
- `allDay` (boolean flag)
- `location`, `recurrence`, `reminders`, `attendees`, `visibility`
- `colorId` (Google Calendar color ID)
- `googleCalendarId`, `googleCalendarEventId`, `synced`
- `createdAt`, `updatedAt`

## Google Calendar Compatibility

### Converting to Google Calendar Format

```typescript
function toGoogleCalendarEvent(event: ScheduleCardData): GoogleCalendarEvent {
  return {
    id: event.id,
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.start.dateTime,
      date: event.start.date,
      timeZone: event.start.timeZone,
    },
    end: {
      dateTime: event.end.dateTime,
      date: event.end.date,
      timeZone: event.end.timeZone,
    },
    // Additional fields can be added when needed:
    // location: event.location,
    // recurrence: event.recurrence,
    // colorId: event.colorId,
    // reminders: event.reminders,
    // visibility: event.visibility,
    // attendees: event.attendees,
  };
}
```

### Converting from Google Calendar Format

```typescript
function fromGoogleCalendarEvent(gcEvent: GoogleCalendarEvent): ScheduleCardData {
  return {
    id: gcEvent.id,
    title: gcEvent.summary || '',
    description: gcEvent.description,
    start: {
      dateTime: gcEvent.start.dateTime,
      date: gcEvent.start.date,
      timeZone: gcEvent.start.timeZone,
    },
    end: {
      dateTime: gcEvent.end.dateTime,
      date: gcEvent.end.date,
      timeZone: gcEvent.end.timeZone,
    },
    color: getColorFromColorId(gcEvent.colorId || 9), // Default to colorId 9 if not provided
    type: 'event',
    // Additional fields can be added when needed:
    // location: gcEvent.location,
    // recurrence: gcEvent.recurrence,
    // colorId: gcEvent.colorId,
    // reminders: gcEvent.reminders,
    // visibility: gcEvent.visibility,
    // attendees: gcEvent.attendees,
  };
}
```

## Event Types

### 1. **`'event'`** - Calendar Events
General calendar events like meetings, appointments, etc.

**Required Fields:**
- `id`, `title`, `start`, `end` (or `startTime`/`endTime` for legacy)
- `type: 'event'`

**Optional Fields:**
- `description`, `location`, `recurrence`, `colorId`, `reminders`, `attendees`, `visibility`

**Features:**
- No checkbox (not completable)
- Displayed as colored blocks on the timeline
- Draggable and resizable
- Can be synced with Google Calendar

**Example:**
```typescript
{
  id: '1',
  title: 'Team Standup',
  start: {
    dateTime: '2024-01-15T09:00:00-08:00',
    timeZone: 'America/Los_Angeles'
  },
  end: {
    dateTime: '2024-01-15T09:30:00-08:00',
    timeZone: 'America/Los_Angeles'
  },
  color: 'rgba(148, 163, 184, 0.08)',
  type: 'event',
  description: 'Daily team sync'
}
```

### 2. **`'task'`** - Scheduled Tasks
Tasks that are scheduled on the calendar, linked to the main task list.

**Required Fields:**
- `id`, `title`, `start`, `end`
- `type: 'task'`
- `taskId`: Must be provided to link to the actual task

**Optional Fields:**
- `description`, `location`

**Features:**
- **Has a checkbox** on the left side
- Completion status is read from the referenced task via `taskId` (not stored in event)
- When completed, shows strikethrough and reduced opacity
- Draggable and resizable
- Should sync with the main task list via `taskId`
- Typically NOT synced with Google Calendar (app-specific)

**Example:**
```typescript
{
  id: 'task-1',
  title: 'Review pull requests',
  start: {
    dateTime: '2024-01-15T10:00:00-08:00',
    timeZone: 'America/Los_Angeles'
  },
  end: {
    dateTime: '2024-01-15T11:00:00-08:00',
    timeZone: 'America/Los_Angeles'
  },
  color: 'rgba(148, 163, 184, 0.08)',
  type: 'task',
  taskId: 'abc123'  // Read task.completed from tasks collection using this ID
}
```

**Note:** The `completed` status is not stored in the event. Instead, read the task directly using `taskId` to get the current completion status.

### 3. **All-Day Events**

**Example:**
```typescript
{
  id: '2',
  title: 'Holiday',
  start: {
    date: '2024-01-15'
  },
  end: {
    date: '2024-01-15'
  },
  color: 'rgba(148, 163, 184, 0.08)',
  type: 'event'
}
```

**Note:** All-day events use the `date` field instead of `dateTime` in both `start` and `end`.

## Time Format

- **ISO 8601 DateTime**: `"2024-01-15T09:00:00-08:00"` or `"2024-01-15T09:00:00Z"`
- **ISO Date** (all-day): `"2024-01-15"`
- **Timezone**: IANA timezone identifier (e.g., `"America/Los_Angeles"`)
- **Duration**: Calculated from `start` and `end` in minutes

## Helper Functions

```typescript
// Extract date from ISO datetime
function getDateFromDateTime(dateTime: string): string {
  return dateTime.split('T')[0];
}

// Extract time from ISO datetime
function getTimeFromDateTime(dateTime: string): string {
  return dateTime.split('T')[1]?.substring(0, 5) || '00:00';
}

// Calculate duration in minutes from start and end
function calculateDuration(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
}

// Calculate duration from ScheduleCardData
function getEventDuration(event: ScheduleCardData): number {
  if (!event.start.dateTime || !event.end.dateTime) {
    return 0; // Can't calculate without dateTime fields
  }
  return calculateDuration(event.start.dateTime, event.end.dateTime);
}

// Get task completion status for scheduled tasks
function getTaskCompletionStatus(event: ScheduleCardData, tasks: Task[]): boolean {
  if (event.type === 'task' && event.taskId) {
    const task = tasks.find(t => t.id === event.taskId);
    return task?.completed || false;
  }
  return false;
}
```

## Visual Differences

### Events (`type: 'event'`)
- No checkbox
- Simple colored block
- Title only
- Can have location, attendees, etc.

### Tasks (`type: 'task'`)
- **Checkbox on the left** (size: sm)
- Completion status read from referenced task via `taskId`
- Can show strikethrough when task is completed
- Reduced opacity (60%) when task is completed
- Should sync with main task list via `taskId`

## Current Implementation

**Location**: `src/components/ScheduleCard.tsx`

Currently using placeholder data in state. Future integration:
1. Store events in a database collection (e.g., `scheduled_events` or `calendar_events`)
2. Link to tasks via `taskId` for type='task'
3. Google Calendar sync can be added when needed

## Future Enhancements

Fields that can be added when needed:
- [ ] `summary` - Alias for title (Google Calendar field name)
- [ ] `allDay` - Boolean flag for all-day events
- [ ] `location` - Event location/venue
- [ ] `recurrence` - RFC5545 recurrence rules
- [ ] `colorId` - Google Calendar color ID (1-11)
- [ ] `reminders` - Array of reminder settings
- [ ] `attendees` - Array of attendee information
- [ ] `visibility` - Event visibility level
- [ ] `googleCalendarId` - Google Calendar sync fields
- [ ] `createdAt` / `updatedAt` - Timestamp fields

Features:
- [ ] Full Google Calendar API integration
- [ ] Recurring event support
- [ ] Timezone handling UI
- [ ] All-day event UI
- [ ] Attendee management
- [ ] Reminder system
- [ ] Location mapping
