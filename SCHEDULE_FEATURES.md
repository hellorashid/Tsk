# Schedule Sidebar Feature List

## Core Functionality

### 1. Event Management
- [x] **Draggable Events** ✅
  - [x] Drag events to change their start time
  - [x] Visual feedback during drag (smooth snap animation)
  - [x] Snap to nearest 15-minute interval (configurable)
  - [x] Prevent dragging outside valid time range (12 AM - 11:59 PM)
  - [x] Update event start time on drop
  - [x] Smooth magnetic snapping effect
  - [x] Click offset tracking for accurate positioning

- [x] **Resizable Events** ✅
  - [x] Resize handles at top and bottom of event cards
  - [x] Drag to adjust duration (start time or end time)
  - [x] Minimum duration constraint (15 minutes)
  - [x] Maximum duration constraint (24 hours)
  - [x] Visual feedback during resize (live preview)
  - [x] Smooth snapping during resize

- [x] **Event Interaction** ✅
  - [x] Click event handler (opens in DynamicIsland)
  - [x] Click tasks to open task view in DynamicIsland
  - [x] Click events to open event view in DynamicIsland
  - [ ] Double-click to quick edit
  - [ ] Right-click context menu (edit, delete, duplicate)
  - [x] Delete button on hover
  - [ ] Keyboard shortcuts (Delete key to remove, etc.)

### 2. Generic Schedule Card Component
- [x] **Create `ScheduleCard` component** ✅
  - [x] Reusable component for calendar events, scheduled tasks, and future scheduled items
  - [x] Props interface:
    - [x] `title`: Event/task name
    - [x] `startTime`: Start time (time string format)
    - [x] `endTime`: End time (optional, calculated from duration)
    - [x] `duration`: Duration in minutes
    - [x] `color`: Color theme (supports rgba for transparency)
    - [x] `type`: Type identifier ('event', 'task', etc.)
    - [x] `onDragEnd`, `onResizeEnd`, `onClick`, `onDelete` callbacks
    - [x] `draggable`, `resizable` boolean flags
    - [x] `snapInterval`, `minTime`, `maxTime`, `minDuration`, `maxDuration` constraints
  - [x] Handles drag and resize internally
  - [x] Styling customizable via props (accentColor, isDarkMode)
  - [x] Subtle design with backdrop blur and borders
  - [x] Top-aligned title
  - [x] Invisible resize handles (functional but not visually distracting)

### 3. Event Creation
- [x] **Create Events from Timeline** ✅
  - [x] Click and drag on empty time slot to create new event
  - [x] Visual preview while dragging (dashed border, semi-transparent)
  - [x] Snap to 15-minute intervals
  - [x] Minimum duration (15 minutes)
  - [x] Default duration (30 minutes) when starting drag
  - [x] Requires intentional drag (prevents accidental clicks)
  - [x] Auto-opens newly created event in DynamicIsland
  - [x] Default title "New Event" (can be edited in DynamicIsland)
  - [x] Works correctly at any scroll position

- [x] **Create Events from DynamicIsland** ✅
  - [x] Task/Calendar icon toggle buttons in collapsed state
  - [x] Input field for event title
  - [x] Enter key creates event and opens in island
  - [x] Shift+Enter creates event and opens in island
  - [x] Tab key cycles between task/event modes
  - [x] Default duration (60 minutes)
  - [x] Auto-opens newly created event in island
  - [x] Focus-aware button styling (transparent when unfocused + empty)

- [x] **Create Events from Mobile Drawer** ✅
  - [x] Task/Event toggle buttons at top of drawer
  - [x] Event creation form with title, date, start time, end time, description
  - [x] Default date set to today
  - [x] Default time set to now and 1 hour later
  - [x] Native date/time pickers
  - [x] Create button at bottom (sticky, floats above keyboard)
  - [x] Auto-defaults to event mode when opened from calendar view
  - [x] Auto-defaults to task mode when opened from tasks view
  - [x] Form resets after creation for quick multi-event creation

- [x] **Create Events from Tasks** ✅
  - [x] "Add to Schedule" button in DynamicIsland
  - [x] "Add to Schedule" button in Mobile Task Drawer
  - [x] Adds tasks to schedule at current time
  - [x] Default duration (60 minutes)
  - [x] Convert task to scheduled event
  - [x] Maintain task reference/link (via taskId)
  - [ ] Drag task onto timeline to schedule (future enhancement)

### 4. Event Editing
- [x] **Edit Event Details** ✅
  - [x] Event view in DynamicIsland
  - [x] Event view in Mobile Drawer (EventModal)
  - [x] Fields: title, description, start time, end time
  - [x] Compact time input layout (start time – end time)
  - [x] Inline editing in DynamicIsland
  - [x] Inline editing in Mobile Drawer with clickable date/time sections
  - [x] Native date/time pickers (one-click to open, auto-save on selection)
  - [x] Delete button (icon, left-aligned, matching task view)
  - [x] Sticky delete button in mobile drawer (bottom left)
  - [x] Consistent styling with task view
  - [x] Persist changes to database (title, description, times) ✅
  - [ ] Color picker (pending)
  - [ ] Category selection (pending)

### 5. Data Management
- [x] **Event Storage** ✅
  - [x] Store events in database (`schedule` collection)
  - [x] Event schema (Google Calendar compatible):
    - `id`: Unique identifier (auto-generated by DB)
    - `title`: Event name
    - `description`: Optional description
    - `start`: Object with `dateTime`, `date`, `timeZone`
    - `end`: Object with `dateTime`, `date`, `timeZone`
    - `color`: Color theme (rgba format)
    - `type`: 'event', 'task', etc.
    - `taskId`: Optional reference to task if scheduled task
  - [ ] `allDay`: Boolean for all-day events (pending)
  - [ ] `recurring`: Optional recurrence pattern (pending)

- [x] **CRUD Operations** ✅
  - [x] Create: Add new events (via timeline drag, DynamicIsland, or "Add to Schedule")
  - [x] Read: Fetch and display events using `useQuery`
  - [x] Update: Modify event properties, drag/resize updates, inline edits
  - [x] Delete: Remove events from database

### 6. Timeline Enhancements
- [x] **Current Time Indicator** ✅
  - [x] Red line showing current time
  - [x] Update in real-time (every minute)
  - [x] Positioned at correct hour/minute
  - [x] Circle indicator on left side

- [ ] **Time Range Options**
  - Configurable start/end times (not just 12 AM - 11 PM)
  - Business hours view (e.g., 6 AM - 8 PM)
  - Custom range selection

- [ ] **Time Interval Display**
  - Show 15-minute or 30-minute markers (optional)
  - Visual grid lines for intervals
  - Configurable granularity

- [ ] **Hour Height Scaling**
  - Adjustable zoom level
  - More/less detail view
  - Preserve event positioning

### 7. Visual & UX
- [ ] **Overlapping Events**
  - Handle multiple events at same time
  - Stacking/layering algorithm
  - Width adjustment for overlapping events
  - Visual grouping indicator

- [x] **Event Color Coding** (Basic Implementation)
  - [x] Subtle, muted color system (low opacity slate grays)
  - [x] Color supports rgba for transparency
  - [ ] Color picker for events (pending)
  - [ ] Category-based colors (pending)
  - [ ] Task-specific colors if linked (pending)

- [x] **Scroll Behavior** (Partially Complete)
  - [x] Scrollable timeline container
  - [x] Auto-scroll to current time on load ✅
  - [x] Positions current time at 1/3 from top of viewport
  - [x] Hidden scrollbar for cleaner UI
  - [ ] Smooth scrolling optimizations (pending)
  - [ ] Scroll position memory (pending)
  - [ ] Keyboard navigation (arrow keys to scroll) (pending)

- [x] **Hover States** ✅
  - [x] Subtle highlight on hover (shadow enhancement)
  - [x] Show delete button on hover
  - [ ] Show time range tooltip (pending)

### 8. Integration Features
- [x] **Task Integration** ✅
  - [x] Display scheduled tasks from task list
  - [x] Link tasks to events (via taskId)
  - [x] Sync completion status (checkbox on task cards)
  - [x] Show task-specific styling (task type, completion status)
  - [x] Click scheduled task to open in DynamicIsland
  - [x] Click scheduled task to open in Mobile Drawer
  - [x] Schedule section in TaskModal showing linked events
  - [x] Editable schedule items directly in task drawer (date, start, end times)
  - [ ] Show task priority in schedule (pending)

- [x] **Mobile Integration** ✅
  - [x] Mobile navigation bar (Tasks/Calendar/Create New buttons)
  - [x] Mobile calendar view (full-height schedule sidebar)
  - [x] Mobile task drawer (SilkTaskDrawer component)
  - [x] Mobile event drawer (EventModal in drawer)
  - [x] Task/Event creation in mobile drawer with toggle
  - [x] Backdrop overlay for drawer (full viewport coverage)
  - [x] Schedule editing in mobile task drawer
  - [x] Sticky delete button in mobile drawers
  - [x] Keyboard-aware layout (buttons float above keyboard)

- [x] **Date Navigation** ✅
  - [x] Today/Previous/Next day buttons
  - [x] Compact navigation bar (buttons on same row as date)
  - [x] Calendar icon for "Today" button
  - [x] Current time indicator only shows on today's view
  - [x] Date display updates with navigation
  - [x] Events filter by selected date (only show events for the viewed date)
  - [ ] Date picker for specific date (pending)
  - [ ] Week view option (future)

### 9. Validation & Constraints
- [ ] **Time Validation**
  - Prevent invalid time ranges (end before start)
  - Prevent events outside day range
  - Handle midnight crossover
  - Validate drag/resize boundaries

- [ ] **Conflict Detection**
  - Warn about overlapping events (optional)
  - Visual indication of conflicts
  - Option to auto-adjust or suggest alternatives

### 10. Performance Optimizations
- [ ] **Rendering**
  - Virtual scrolling for long timelines
  - Event memoization
  - Efficient re-renders on drag/resize
  - Debounce database updates

- [ ] **State Management**
  - Optimistic updates during drag/resize
  - Batch database writes
  - Local state for drag preview

## Technical Implementation Notes

### Libraries/Tools to Consider
- **React DnD** or **@dnd-kit/core** for drag and drop
- **React Resizable** or custom resize handlers
- **date-fns** or **dayjs** for date/time manipulation
- **framer-motion** for smooth animations (already in use)

### Component Structure
```
ScheduleSidebar
  ├── ScheduleHeader (date navigation, today button)
  ├── TimelineContainer (scrollable)
  │   ├── HourMarkers (24 hour slots)
  │   ├── CurrentTimeIndicator
  │   └── EventLayer
  │       └── ScheduleCard[] (draggable, resizable)
  └── ScheduleCard (reusable component)
      ├── DragHandle
      ├── ResizeHandle (top)
      ├── ResizeHandle (bottom)
      └── Content
```

### State Management
- Events stored in database (BasicDB collection)
- Local state for drag/resize preview
- React Query for event fetching/caching
- Optimistic updates for smooth UX

## Priority Order (Progress)
1. ✅ **ScheduleCard component** (foundation) - **COMPLETED**
2. ✅ **Draggable events** (core feature) - **COMPLETED**
3. ✅ **Resizable events** (core feature) - **COMPLETED**
4. ✅ **Current time indicator** - **COMPLETED**
5. ✅ **Task integration** - **COMPLETED**
6. ✅ **Create events from tasks** - **COMPLETED**
7. ✅ **Event interaction** (DynamicIsland) - **COMPLETED**
8. ✅ **Event creation from DynamicIsland** - **COMPLETED**
9. ✅ **DynamicIsland integration** - **COMPLETED**
10. ✅ **Event creation from timeline** - **COMPLETED**
11. ✅ **Database integration** - **COMPLETED**
12. ✅ **Persist event edits** - **COMPLETED**
13. ✅ **Date navigation** - **COMPLETED**
14. ✅ **Auto-scroll to current time** - **COMPLETED**
15. ✅ **Date-based event filtering** - **COMPLETED**
16. ✅ **Timeline drag-to-create fixes** - **COMPLETED**
17. ✅ **Mobile navigation and views** - **COMPLETED**
18. ✅ **Mobile task/event drawers** - **COMPLETED**
19. ✅ **Mobile event creation** - **COMPLETED**
20. ✅ **Schedule editing in mobile drawer** - **COMPLETED**
21. **Overlapping events handling** - Next priority
22. **Time range options** - Future enhancement



## Completed Features Summary

### ✅ DynamicIsland Integration (Completed)
- Task and event creation unified in DynamicIsland
- Task/Calendar icon toggle buttons (right-aligned)
- Tab key cycles between task/event modes
- Enter creates task/event based on mode
- Shift+Enter creates and opens task/event
- Focus-aware button styling (transparent when unfocused + empty)
- Event creation opens event in island automatically
- Consistent styling between task and event views

### ✅ Event View Improvements (Completed)
- Compact time input layout (start time – end time)
- Removed duration input, replaced with end time
- Delete button icon, left-aligned (matching task view)
- Removed focus border from description textarea
- Minimal, compact design

### ✅ Timeline Event Creation (Completed)
- Click and drag on empty timeline space to create new events
- Visual preview with dashed border while dragging
- Snaps to 15-minute intervals for precise scheduling
- Default duration of 30 minutes when starting drag
- Requires intentional drag (minimum 15 minutes) to prevent accidental creation
- Automatically opens newly created event in DynamicIsland for immediate editing
- Smart click detection prevents interference with existing event cards and hour labels
- Works correctly at any scroll position (fixed positioning calculation)

### ✅ Date-Based Event Filtering (Completed)
- Events automatically filter to show only those on the selected date
- Date comparison handles timezone differences correctly
- Updates in real-time when navigating between dates
- Efficient filtering using useMemo for performance

### ✅ Mobile Experience (Completed)
- **Mobile Navigation Bar**
  - Floating bottom navigation with Tasks/Calendar/Create New buttons
  - Icon-only design (no labels) for compact UI
  - Sticky positioning with safe area insets
  - Smooth transitions and rounded selected states

- **Mobile Calendar View**
  - Full-height schedule sidebar on mobile
  - Seamless integration with mobile navigation
  - Proper padding to account for navigation bar

- **Mobile Task Drawer**
  - Sheet-based drawer component (SilkTaskDrawer)
  - Task viewing and editing
  - Event viewing and editing (EventModal)
  - Task/Event creation with toggle buttons
  - Backdrop overlay (full viewport coverage)
  - Keyboard-aware layout

- **Mobile Event Creation**
  - Dedicated event creation form in drawer
  - Native date/time pickers (one-click to open)
  - Auto-save on selection (no cancel button needed)
  - Defaults to event mode when opened from calendar view
  - Defaults to task mode when opened from tasks view
  - Sticky create button (floats above keyboard)

- **Schedule Editing in Task Drawer**
  - Schedule section showing linked events
  - Clickable date, start time, and end time sections
  - Native pickers for each field
  - Auto-save on selection
  - Individual delete buttons per event
  - Sticky delete button for task (bottom left)

- **Event Editing in Mobile Drawer**
  - Full event editing (title, description, date, times)
  - Clickable date/time sections with native pickers
  - Auto-save on change
  - Sticky delete button (bottom left)
  - Prevented auto-focus on title (checkbox focus trap)

## Major Features Remaining

### ✅ Recently Completed
1. ~~**Database Integration**~~ ✅ **COMPLETED**
   - ✅ Store schedule events in database (`schedule` collection)
   - ✅ CRUD operations for events
   - ✅ Sync events across sessions via `useQuery`
   - ✅ Google Calendar compatible data structure

2. ~~**Event Creation from Timeline**~~ ✅ **COMPLETED**
   - ✅ Click and drag on timeline to create events
   - ✅ Opens in DynamicIsland for immediate editing

3. ~~**Persist Event Edits**~~ ✅ **COMPLETED**
   - ✅ Save event title, description, start time, end time changes to database
   - ✅ All edits (drag, resize, inline) saved automatically

4. ~~**Date Navigation**~~ ✅ **COMPLETED**
   - ✅ Today/Previous/Next day buttons
   - ✅ Compact navigation UI

### High Priority (Next Steps)

1. **Overlapping Events Handling**
   - Stack overlapping events
   - Width adjustment algorithm
   - Visual grouping
   - Side-by-side layout with width constraints

2. **Date Picker Enhancement**
   - Calendar popup for selecting specific dates
   - Jump to arbitrary date
   - Quick date shortcuts (Today, Tomorrow, This Week, etc.)

3. **Task Completion in Schedule**
   - Show task completion status from linked tasks
   - Update task completion via checkbox in schedule view
   - Sync between task list and schedule
   - Visual indication of completed tasks in schedule

4. **Mobile Timeline Interaction**
   - Drag events on mobile timeline
   - Resize events on mobile timeline
   - Create events by dragging on mobile timeline
   - Touch-optimized drag/resize handles

### Medium Priority
5. **Time Range Options**
   - Configurable start/end times
   - Business hours view
   - Custom range selection

6. **Color Picker for Events**
   - Add color selection in event edit view
   - Visual color palette
   - Save color preference per event

7. **Mobile Timeline Improvements**
   - Optimize touch interactions for timeline
   - Better visual feedback for mobile drag/resize
   - Long-press context menu for events

### Low Priority / Future Enhancements
8. **Conflict Detection** - Warn about overlapping events
9. **Time Interval Display** - 15/30-minute markers
10. **Hour Height Scaling** - Adjustable zoom level
11. **Keyboard shortcuts** for event management
12. **Recurring events** support
13. **All-day events** support
14. **Multi-day events** spanning across dates
15. **Week/Month view** for calendar
16. **Event search and filtering** - Search events by title/description
17. **Event templates** - Quick create from templates
18. **Event sharing** - Share events with others

## Summary of Completed Work

### Mobile Experience - Fully Implemented ✅
The mobile experience has been completely built out with:
- **Navigation**: Floating bottom nav bar with Tasks/Calendar/Create buttons
- **Views**: Seamless switching between tasks and calendar views
- **Drawers**: Full-featured task and event drawers with creation, editing, and deletion
- **Editing**: Native date/time pickers with one-click access and auto-save
- **UX**: Keyboard-aware layouts, backdrop overlays, sticky buttons, and focus management

### Schedule Integration - Fully Implemented ✅
- Tasks can be added to schedule from mobile drawer
- Schedule items editable directly in task drawer
- Events viewable and editable in mobile drawer
- Full CRUD operations for events in mobile interface

### Next Recommended Steps

**Immediate Priority:**
1. **Overlapping Events Handling** - This is the most impactful missing feature. Currently, overlapping events will visually overlap each other, making them hard to read and interact with. Implementing a stacking/layering algorithm with width adjustment would significantly improve usability.

2. **Mobile Timeline Interaction** - Enable drag/resize on mobile timeline. Currently mobile users can view and edit events, but cannot drag/resize them directly on the timeline. This would complete the mobile feature parity with desktop.

**Short-term Enhancements:**
3. **Date Picker** - Add a calendar popup for quick date navigation
4. **Task Completion Sync** - Show and update task completion status in schedule view

**Long-term Enhancements:**
5. **Color Picker** - Allow users to customize event colors
6. **Time Range Options** - Configurable timeline ranges (business hours, etc.)
7. **Conflict Detection** - Warn about overlapping events

