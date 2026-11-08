import React, { useMemo, useState } from 'react';
import { getGlassSurface, useTheme } from '../../contexts/ThemeContext';
import {
  getDefaultSlot,
  getEventPresentation,
  getEventRange,
  getMonthGridDays,
  isAllDayEvent,
  isAmbientEvent,
  isEventOnDay,
  isSameDay,
  shiftMonth,
} from '../../utils/calendar';
import { formatTime, getStartOfDay, isToday } from '../../utils/dateHelpers';
import type { ScheduleCardData } from '../../utils/schedule';
import CalendarHeader from './CalendarHeader';
import EventLabel from './EventLabel';
import CalendarPopover from './CalendarPopover';
import { eventToneClass, type CalendarViewProps } from './types';
import { useCalendarEditor } from './useCalendarEditor';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_CHIPS = 3;
const MAX_VISIBLE_DOTS = 3;
const DEFAULT_EVENT_SLOT = { startTime: '09:00', endTime: '10:00' };

const sortByStart = (a: ScheduleCardData, b: ScheduleCardData) => {
  if (isAllDayEvent(a) !== isAllDayEvent(b)) return isAllDayEvent(a) ? -1 : 1;
  return (getEventRange(a)?.start.getTime() ?? 0) - (getEventRange(b)?.start.getTime() ?? 0);
};

const MonthBoardView: React.FC<CalendarViewProps> = (props) => {
  const { events, tasks, selectedDate, onSelectedDateChange, isMobile, tasksCollapsed, onToggleTasks } = props;
  const { theme } = useTheme();
  const { isDarkMode, accentColor } = theme;
  const { openCreate, openEvent, popover } = useCalendarEditor(props);
  const [dayPopover, setDayPopover] = useState<{ day: Date; anchorEl: HTMLElement } | null>(null);

  const monthKey = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getTime();
  const days = useMemo(() => getMonthGridDays(new Date(monthKey)), [monthKey]);
  const visibleMonth = new Date(monthKey).getMonth();

  const dayData = useMemo(() => {
    const planned = events.filter((event) => !isAmbientEvent(event)).sort(sortByStart);
    const weather = events.filter((event) => event.type === 'weather');
    return new Map(
      days.map((day) => [
        day.getTime(),
        {
          items: planned.filter((event) => isEventOnDay(event, day)),
          temperature: weather.find((event) => isEventOnDay(event, day))?.metadata?.weather?.temperature,
        },
      ]),
    );
  }, [days, events]);

  const today = getStartOfDay(new Date());
  const now = new Date();
  const isCurrentMonth = now.getMonth() === visibleMonth && now.getFullYear() === new Date(monthKey).getFullYear();
  const rowCount = days.length / 7;

  const createOnDay = (day: Date, anchorEl: HTMLElement) => {
    setDayPopover(null);
    openCreate({ date: day, ...DEFAULT_EVENT_SLOT }, anchorEl);
  };

  const handleCellClick = (day: Date, itemCount: number, anchorEl: HTMLElement) => {
    onSelectedDateChange(day);
    if (day.getMonth() !== visibleMonth) return;
    if (itemCount === 0) {
      createOnDay(day, anchorEl);
    } else {
      setDayPopover({ day, anchorEl });
    }
  };

  const renderTime = (event: ScheduleCardData) =>
    isAllDayEvent(event) || !event.start.dateTime ? 'All day' : formatTime(event.start.dateTime);

  const quietText = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const dayPopoverData = dayPopover ? dayData.get(dayPopover.day.getTime()) : undefined;

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${isMobile ? 'rounded-2xl backdrop-blur-3xl' : ''}`}
      style={isMobile ? { backgroundColor: getGlassSurface(accentColor, isDarkMode) } : undefined}
    >
      <CalendarHeader
        title={new Date(monthKey).toLocaleDateString('en-US', { month: isMobile ? 'short' : 'long', year: 'numeric' })}
        isCurrentPeriod={isCurrentMonth}
        periodName="month"
        onPrevious={() => onSelectedDateChange(shiftMonth(selectedDate, -1))}
        onToday={() => onSelectedDateChange(new Date())}
        onNext={() => onSelectedDateChange(shiftMonth(selectedDate, 1))}
        onCreate={(anchorEl) => openCreate({ date: selectedDate, ...getDefaultSlot(selectedDate) }, anchorEl)}
        tasksCollapsed={tasksCollapsed}
        onToggleTasks={onToggleTasks}
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto px-2 md:px-4 pb-2 md:pb-4" style={{ paddingBottom: isMobile ? 112 : undefined }}>
        <div className="grid grid-cols-7 gap-1 md:gap-1.5 shrink-0">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className={`text-center text-xs font-semibold py-2 ${quietText}`}>
              {isMobile ? weekday[0] : weekday}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-1 md:gap-1.5 flex-1"
          style={{ gridTemplateRows: `repeat(${rowCount}, minmax(${isMobile ? 56 : 104}px, 1fr))` }}
        >
          {days.map((day) => {
            const { items = [], temperature } = dayData.get(day.getTime()) ?? {};
            const isTodayDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate) && !isTodayDay;
            const isOutsideMonth = day.getMonth() !== visibleMonth;
            const isPast = day < today;
            const overflowCount = items.length - MAX_VISIBLE_CHIPS;
            const dateLabel = day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const itemsLabel = items.length === 1 ? '1 item' : `${items.length} items`;

            return (
              <div
                key={day.getTime()}
                className={`group relative min-w-0 overflow-hidden rounded-lg border transition-colors ${
                  isSelected
                    ? isDarkMode ? 'border-white/40' : 'border-black/40'
                    : isDarkMode ? 'border-white/[0.07]' : 'border-black/[0.07]'
                } ${
                  isTodayDay
                    ? isDarkMode ? 'bg-white/[0.08]' : 'bg-white/70'
                    : isDarkMode ? 'bg-white/[0.03] hover:bg-white/[0.07]' : 'bg-white/35 hover:bg-white/55'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => handleCellClick(day, items.length, e.currentTarget)}
                  aria-label={`${dateLabel}, ${itemsLabel}`}
                  className="absolute inset-0 w-full h-full rounded-lg"
                />

                <div
                  className={`relative h-full flex flex-col gap-1 p-1 md:p-1.5 pointer-events-none ${
                    isOutsideMonth ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`flex items-center justify-center size-6 rounded-full text-xs font-semibold ${
                        isTodayDay ? 'bg-red-500 text-white' : isDarkMode ? 'text-gray-200' : 'text-gray-900'
                      } ${isPast && !isOutsideMonth ? 'opacity-50' : ''}`}
                    >
                      {day.getDate()}
                    </span>
                    {!isMobile && temperature !== undefined && (
                      <span className={`text-[10px] ${quietText}`}>{Math.round(temperature)}°</span>
                    )}
                  </div>

                  {isMobile ? (
                    items.length > 0 && (
                      <div className="flex gap-1 pl-1.5" aria-hidden>
                        {items.slice(0, MAX_VISIBLE_DOTS).map((event) => (
                          <span key={event.id} className={`size-1 rounded-full ${isDarkMode ? 'bg-white/70' : 'bg-gray-800/70'}`} />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="space-y-0.5 min-h-0">
                      {items.slice(0, MAX_VISIBLE_CHIPS).map((event) => {
                        const { title, kind } = getEventPresentation(event, tasks);
                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={(e) => openEvent(event, e.currentTarget)}
                            className={`block w-full pointer-events-auto px-1.5 rounded-md text-left text-[11px] leading-[18px] font-medium transition-colors ${eventToneClass(kind, isDarkMode)}`}
                          >
                            <EventLabel kind={kind} title={title} />
                          </button>
                        );
                      })}
                      {overflowCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => setDayPopover({ day, anchorEl: e.currentTarget })}
                          className={`pointer-events-auto px-1.5 text-[10px] leading-4 rounded transition-colors ${quietText} ${
                            isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                          }`}
                        >
                          +{overflowCount} more
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!isMobile && !isOutsideMonth && (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                    title="New event"
                    onClick={(e) => createOnDay(day, e.currentTarget)}
                    className={`absolute top-1 right-1 size-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDarkMode ? 'text-gray-300 hover:bg-white/15' : 'text-gray-600 hover:bg-black/10'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {dayPopover && (
        <CalendarPopover
          key={dayPopover.day.getTime()}
          anchorEl={dayPopover.anchorEl}
          label={dayPopover.day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          onClose={() => setDayPopover(null)}
        >
          <div className="p-3.5 space-y-2">
            <h2 className="text-sm font-semibold">
              {dayPopover.day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h2>
            <div className="space-y-1">
              {(dayPopoverData?.items ?? []).map((event) => {
                const { title, kind } = getEventPresentation(event, tasks);
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      const anchorEl = dayPopover.anchorEl;
                      setDayPopover(null);
                      openEvent(event, anchorEl);
                    }}
                    className={`flex items-center justify-between gap-2 w-full px-2 py-1.5 rounded-lg text-left text-sm font-medium transition-colors ${eventToneClass(kind, isDarkMode)}`}
                  >
                    <EventLabel kind={kind} title={title} />
                    <span className="shrink-0 text-[11px] font-normal opacity-70">{renderTime(event)}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => createOnDay(dayPopover.day, dayPopover.anchorEl)}
              className={`text-sm transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Add event
            </button>
          </div>
        </CalendarPopover>
      )}

      {popover}
    </div>
  );
};

export default MonthBoardView;
