# Contributing to tsk

Hey! Thanks for wanting to contribute. This guide should help you figure out how the codebase works and get you up and running.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Key Components](#key-components)
- [Data Models](#data-models)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Common Tasks](#common-tasks)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Basic.tech account (for database access)
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tsk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Basic.tech**
   - We use Basic.tech for data storage
   - The project ID is in `basic.config.ts`
   - For making changes to this repo, you don't need to setup a Basic account. 
   - Check out the [Basic.tech docs](https://docs.basic.tech) for more

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
tsk/
├── src/
│   ├── components/          # React components
│   │   ├── AgendaView.tsx   # Agenda view for schedule
│   │   ├── DynamicIsland.tsx # Desktop task/event editor
│   │   ├── FocusView.tsx    # Full-screen focus mode
│   │   ├── FoldersBar.tsx   # Folder navigation
│   │   ├── ListItem.tsx     # Individual task item
│   │   ├── PomodoroTimer.tsx # Stopwatch timer
│   │   ├── ScheduleSidebar.tsx # Schedule sidebar
│   │   ├── SilkTaskDrawer.tsx # Mobile task drawer
│   │   └── ...              # Other components
│   ├── contexts/
│   │   └── ThemeContext.tsx # Theme management
│   ├── hooks/
│   │   └── useModalHistory.ts # Modal navigation hook
│   ├── utils/
│   │   ├── db.js            # Database utilities (legacy)
│   │   ├── types.ts         # TypeScript type definitions
│   │   └── weather.ts       # Weather API integration
│   ├── App.tsx              # Main app component
│   └── main.tsx             # App entry point
├── basic.config.ts          # Basic.tech schema configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json             # Dependencies and scripts
```

## Architecture Overview

### Data Layer

We use **Basic.tech** as the backend. The schema lives in `basic.config.ts` and has three main collections:

1. **tasks** - Your tasks with name, description, completion status, labels, and parent relationships
2. **filters** - Folder definitions (yeah, they're called "filters" in the schema for historical reasons)
3. **schedule** - Calendar events, scheduled tasks, weather data, and activity records

### State Management

- **React Hooks** - Local component state with `useState` and `useEffect`
- **Basic.tech React Hooks** - `useQuery` for reactive data fetching
- **Context API** - `ThemeContext` for global theme settings
- **LocalStorage** - Persists theme preferences and UI state

### UI Architecture

- **Desktop**: Three-column layout (tasks | dynamic island | schedule)
- **Mobile**: Tab-based navigation between tasks and calendar views
- **Responsive**: Uses Tailwind breakpoints (`md:`) for desktop/mobile differences

## Key Components

### App.tsx

This is the big one - it handles:
- Fetching data from Basic.tech
- Managing global state (selected task, event, folders, etc.)
- Keyboard shortcuts and navigation
- Switching between mobile/desktop views
- Fetching weather data

**Key State:**
- `tasks` - All your tasks from the database
- `scheduleEvents` - All schedule items
- `folders` - Folder definitions
- `selectedTask` / `selectedEvent` - What's currently selected
- `activeFolder` - Which folder is active
- `focusedTask` - Task that's in focus mode
- `islandMode` - Dynamic Island mode (default/task/event/command)

### DynamicIsland.tsx

Desktop-only expandable thing that handles:
- Creating new tasks/events
- Editing selected tasks/events
- Command palette (hit `/`)
- Switching between task/event modes (Tab key)

**Modes:**
- `default` - Just a collapsed input field
- `task` - Creating or editing a task
- `event` - Creating or editing an event
- `command` - Command palette mode

### FocusView.tsx

The full-screen focus mode that:
- Shows your task front and center
- Displays subtasks
- Has a stopwatch timer
- Lets you edit the task
- Tracks how long you've been focusing (and saves it to your schedule)

### ScheduleSidebar.tsx & AgendaView.tsx

Two different ways to view your schedule:
- **TimelineView** - Hour-by-hour timeline with visual blocks
- **AgendaView** - Simple list of events

Both can:
- Schedule tasks
- Create/edit events
- Show weather
- Display task completion events
- Show focus session events

### ThemeContext.tsx

Handles all the theme stuff:
- Accent color
- Dark/light mode
- Font style (mono/sans/serif)
- Location (for weather)

Saves everything to localStorage and applies it to the document root.

## Data Models

### Task

```typescript
type Task = {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  parentTaskId?: string;  // For subtasks
  labels?: string;        // Comma-separated, includes "folder:name"
};
```

### Folder

```typescript
type Folder = {
  id: string;
  name: string;
  labels: string;         // Comma-separated labels to match
  color?: string;
};
```

### Schedule Event

```typescript
type ScheduleCardData = {
  id: string;
  title: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  color: string;
  type: 'task' | 'event' | 'task:completed' | 'weather' | 'sunrise' | 'sunset' | 'other';
  taskId?: string;        // For scheduled tasks
  description?: string;
  metadata?: {
    taskSnapshot?: {...};  // For deleted tasks
    weather?: {...};       // For weather events
  };
};
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Try to follow existing patterns
   - Add TypeScript types where it makes sense
   - Test on both desktop and mobile

3. **Test it out**
   ```bash
   npm run dev
   ```
   - Make sure keyboard shortcuts work
   - Check that it looks good on mobile
   - Verify your data actually persists

4. **Build and check for errors**
   ```bash
   npm run build
   npm run lint
   ```

### Common Patterns

#### Adding a New Component

1. Create component in `src/components/`
2. Use TypeScript interfaces for props
3. Support `accentColor` and `isDarkMode` props for theming
4. Use Tailwind classes with dark mode variants

#### Modifying Database Schema

1. Update `basic.config.ts` schema
2. Increment schema version
3. Handle migration if needed (Basic.tech handles some automatically)

#### Adding Keyboard Shortcuts

Add handlers in `App.tsx` within the `useEffect` for `keydown` events:

```typescript
if (e.key === 'your-key' && !isInputFocused) {
  e.preventDefault();
  // Your logic
}
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define interfaces for component props
- Use type imports: `import type { Task } from './types'`

### React

- Use functional components with hooks
- Prefer `useState` and `useEffect` for local state
- Use `useQuery` from `@basictech/react` for data fetching
- Keep components focused and composable

### Styling

- Use Tailwind CSS utility classes
- Support dark mode with `dark:` variants
- Use theme context for accent colors
- Mobile-first responsive design

### Naming Conventions

- Components: PascalCase (`TaskItem.tsx`)
- Functions: camelCase (`handleTaskSelect`)
- Types/Interfaces: PascalCase (`Task`, `ScheduleCardData`)
- Constants: UPPER_SNAKE_CASE or camelCase

## Common Tasks

### Adding a New View Mode

1. Add mode to state in `App.tsx`
2. Create conditional rendering based on mode
3. Add UI controls to switch modes
4. Persist preference to localStorage if needed

### Integrating a New API

1. Create utility file in `src/utils/`
2. Add error handling
3. Consider caching strategy
4. Update types if needed

### Adding a New Schedule Event Type

1. Add type to `ScheduleCardData` type union
2. Update rendering logic in `ScheduleSidebar.tsx` or `AgendaView.tsx`
3. Add creation logic if needed
4. Update filtering/display logic

### Debugging

- Use React DevTools for component inspection
- Check Basic.tech dashboard for database state
- Use browser console for runtime errors
- Check Network tab for API calls (weather, etc.)

## Testing Considerations

We don't have a formal test suite yet, but when you're testing:

1. **Test data persistence** - Create some tasks, refresh the page, make sure they're still there
2. **Test keyboard shortcuts** - Make sure they work in different contexts
3. **Test mobile responsiveness** - Resize your browser or use device emulation
4. **Test theme changes** - Change themes and make sure they stick around
5. **Test folder filtering** - Create folders, assign tasks, make sure filtering works

## Questions?

- Look at existing code to see how things are done
- Check out the Basic.tech docs: https://docs.basic.tech
- Find similar components and use them as reference

Happy coding! 🚀

