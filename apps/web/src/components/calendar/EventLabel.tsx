import React from 'react';
import type { EventKind } from '../../utils/calendar';

/** Card title. Tasks get the list's round check so they read as tasks without colour. */
const EventLabel: React.FC<{ kind: EventKind; title: string }> = ({ kind, title }) => (
  <span className="flex items-center gap-1 min-w-0">
    {kind !== 'event' && (
      <span
        aria-hidden
        className={`shrink-0 size-2 rounded-full border border-current ${kind === 'done' ? 'bg-current opacity-60' : 'opacity-80'}`}
      />
    )}
    <span className={`truncate ${kind === 'done' ? 'line-through' : ''}`}>{title}</span>
  </span>
);

export default EventLabel;
