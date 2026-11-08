import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getGlassSurface, useTheme } from '../../contexts/ThemeContext';
import {
  addDays,
  getDefaultSlot,
  getEventPresentation,
  getEventRange,
  getStartOfWeek,
  isAllDayEvent,
  isAmbientEvent,
  isEventOnDay,
  isSameDay,
  layoutTimedEvents,
} from '../../utils/calendar';
import { formatTime, getCurrentTimeInMinutes, getStartOfDay, isToday } from '../../utils/dateHelpers';
import CalendarHeader from './CalendarHeader';
import EventLabel from './EventLabel';
import { eventToneClass, type CalendarViewProps } from './types';
import { useCalendarEditor } from './useCalendarEditor';

/** The grid is drawn at 1px per minute, so minutes can be used directly as pixels. */
const HOUR_HEIGHT = 60;
const GUTTER_WIDTH = 48;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MOBILE_DAY_COUNT = 3;
const DESKTOP_DAY_COUNT = 7;

const formatHour = (hour: number) => `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
const pad = (value: number) => value.toString().padStart(2, '0');

const formatRangeTitle = (start: Date, end: Date) => {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startLabel = `${startMonth} ${pad(start.getDate())}`;
  return startMonth === endMonth
    ? `${startLabel} – ${pad(end.getDate())}`
    : `${startLabel} – ${endMonth} ${pad(end.getDate())}`;
};

const WeekPlannerView: React.FC<CalendarViewProps> = (props) => {
  const { events, tasks, selectedDate, onSelectedDateChange, isMobile, tasksCollapsed, onToggleTasks } = props;
  const { theme } = useTheme();
  const { isDarkMode, accentColor } = theme;
  const { openCreate, openEvent, popover, draft } = useCalendarEditor(props);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowMinutes, setNowMinutes] = useState(getCurrentTimeInMinutes);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // Phones page through three days. Selecting a day inside the window must not move it.
  const selectedDay = getStartOfDay(selectedDate);
  const [mobileWindowStart, setMobileWindowStart] = useState(selectedDay);
  const isInMobileWindow =
    selectedDay >= mobileWindowStart && selectedDay < addDays(mobileWindowStart, MOBILE_DAY_COUNT);
  if (isMobile && !isInMobileWindow) {
    setMobileWindowStart(selectedDay);
  }

  const dayCount = isMobile ? MOBILE_DAY_COUNT : DESKTOP_DAY_COUNT;
  const rangeStart = !isMobile
    ? getStartOfWeek(selectedDate)
    : isInMobileWindow
      ? mobileWindowStart
      : selectedDay;
  const rangeKey = rangeStart.getTime();

  const days = useMemo(
    () => Array.from({ length: dayCount }, (_, index) => addDays(new Date(rangeKey), index)),
    [dayCount, rangeKey],
  );

  const columns = useMemo(() => {
    const planned = events.filter((event) => !isAmbientEvent(event));
    const ambient = events.filter(isAmbientEvent);
    return days.map((day) => {
      const ambientToday = ambient.filter((event) => isEventOnDay(event, day));
      return {
        day,
        allDay: planned.filter((event) => isAllDayEvent(event) && isEventOnDay(event, day)),
        positioned: layoutTimedEvents(planned, day),
        sunMarkers: ambientToday.filter((event) => event.type !== 'weather'),
        temperature: ambientToday.find((event) => event.type === 'weather')?.metadata?.weather?.temperature,
      };
    });
  }, [days, events]);

  const hasAllDayEvents = columns.some((column) => column.allDay.length > 0);

  const scrollToNow = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, new Date().getHours() - 2) * HOUR_HEIGHT;
    }
  };

  useEffect(scrollToNow, []);

  // The day headers sit outside the scroller, so columns need the scrollbar's width reserved.
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) setScrollbarWidth(scroller.offsetWidth - scroller.clientWidth);
  }, [isMobile]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMinutes(getCurrentTimeInMinutes()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const moveRange = (direction: 1 | -1) => {
    onSelectedDateChange(
      isMobile ? addDays(rangeStart, direction * MOBILE_DAY_COUNT) : addDays(selectedDate, direction * DESKTOP_DAY_COUNT),
    );
  };

  const goToToday = () => {
    onSelectedDateChange(new Date());
    scrollToNow();
  };

  const createAtHour = (day: Date, hour: number, anchorEl: HTMLElement) => {
    openCreate({ date: day, startTime: `${pad(hour)}:00`, endTime: `${pad((hour + 1) % 24)}:00` }, anchorEl);
  };

  const mutedText = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const lineColor = isDarkMode ? 'border-white/[0.07]' : 'border-black/[0.08]';
  const columnLine = isDarkMode ? 'border-white/10' : 'border-black/10';

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${isMobile ? 'rounded-2xl backdrop-blur-3xl' : ''}`}
      style={isMobile ? { backgroundColor: getGlassSurface(accentColor, isDarkMode) } : undefined}
    >
      <CalendarHeader
        title={formatRangeTitle(days[0], days[days.length - 1])}
        isCurrentPeriod={days.some(isToday)}
        periodName={isMobile ? 'days' : 'week'}
        onPrevious={() => moveRange(-1)}
        onToday={goToToday}
        onNext={() => moveRange(1)}
        onCreate={(anchorEl) => openCreate({ date: selectedDate, ...getDefaultSlot(selectedDate) }, anchorEl)}
        tasksCollapsed={tasksCollapsed}
        onToggleTasks={onToggleTasks}
      />

      <div className="shrink-0" style={{ paddingRight: scrollbarWidth }}>
        <div className={`flex border-b ${columnLine}`} style={{ paddingLeft: GUTTER_WIDTH }}>
          {columns.map(({ day, temperature }) => {
            const isTodayDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.getTime()}
                type="button"
                onClick={() => onSelectedDateChange(day)}
                aria-pressed={isSelected}
                aria-label={day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 border-r transition-colors ${columnLine} ${
                  isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                }`}
              >
                <span className={`text-xs ${mutedText}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  {temperature !== undefined && <span className="opacity-70"> · {Math.round(temperature)}°</span>}
                </span>
                <span
                  className={`flex items-center justify-center size-7 rounded-full text-sm font-semibold ${
                    isTodayDay
                      ? 'bg-red-500 text-white'
                      : isSelected
                        ? isDarkMode ? 'bg-white/15 text-white' : 'bg-black/10 text-gray-900'
                        : isDarkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {hasAllDayEvents && (
          <div className={`flex border-b ${columnLine}`} style={{ paddingLeft: GUTTER_WIDTH }}>
            {columns.map(({ day, allDay }) => (
              <div key={day.getTime()} className={`flex-1 min-w-0 p-1 space-y-0.5 border-r ${columnLine}`}>
                {allDay.map((event) => {
                  const { title, kind } = getEventPresentation(event, tasks);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => openEvent(event, e.currentTarget)}
                      className={`block w-full px-1.5 py-0.5 rounded-md text-left text-[11px] font-medium transition-colors ${eventToneClass(kind, isDarkMode)}`}
                    >
                      <EventLabel kind={kind} title={title} />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative overscroll-none">
        <div className="flex" style={{ paddingBottom: isMobile ? 112 : 0 }}>
          <div className="shrink-0" style={{ width: GUTTER_WIDTH }} aria-hidden>
            {HOURS.map((hour) => (
              <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                {hour > 0 && (
                  <span className="absolute right-2 top-0 -translate-y-1/2 text-[10px] whitespace-nowrap text-gray-500">
                    {formatHour(hour)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 flex min-w-0">
            {columns.map(({ day, positioned, sunMarkers }) => {
              const isTodayDay = isToday(day);
              const dayLabel = day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
              const draftHere = draft && isSameDay(draft.date, day) ? draft : null;
              const draftTop = draftHere ? Number(draftHere.startTime.slice(0, 2)) * HOUR_HEIGHT : 0;

              return (
                <div
                  key={day.getTime()}
                  className={`flex-1 min-w-0 relative border-r ${columnLine} ${
                    isTodayDay ? (isDarkMode ? 'bg-white/[0.03]' : 'bg-white/30') : ''
                  }`}
                >
                  {HOURS.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => createAtHour(day, hour, e.currentTarget)}
                      aria-label={`Create event at ${formatHour(hour)} on ${dayLabel}`}
                      style={{ height: HOUR_HEIGHT }}
                      className={`block w-full transition-colors ${hour > 0 ? `border-t ${lineColor}` : ''} ${
                        isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'
                      }`}
                    />
                  ))}

                  {sunMarkers.map((marker) => {
                    const start = getEventRange(marker)?.start;
                    if (!start) return null;
                    return (
                      <div
                        key={marker.id}
                        className="absolute inset-x-0 z-[1] pointer-events-none border-t border-dashed border-amber-400/40"
                        style={{ top: start.getHours() * HOUR_HEIGHT + start.getMinutes() }}
                      >
                        <span className={`absolute right-1 top-0.5 text-[9px] ${isDarkMode ? 'text-amber-200/60' : 'text-amber-700/70'}`}>
                          {marker.type === 'sunrise' ? 'Sunrise' : 'Sunset'}
                        </span>
                      </div>
                    );
                  })}

                  {draftHere && (
                    <div
                      className={`absolute inset-x-0.5 z-[2] rounded-md border border-dashed pointer-events-none ${
                        isDarkMode ? 'border-white/40 bg-white/10' : 'border-black/30 bg-black/5'
                      }`}
                      style={{ top: draftTop, height: HOUR_HEIGHT }}
                    />
                  )}

                  {positioned.map(({ event, top, height, lane, laneCount }) => {
                    const { title, kind } = getEventPresentation(event, tasks);
                    const time = event.start.dateTime ? formatTime(event.start.dateTime) : '';
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={(e) => openEvent(event, e.currentTarget)}
                        aria-label={`${title}, ${time}`}
                        className={`absolute z-[3] flex flex-col overflow-hidden rounded-lg px-1.5 text-left transition-colors ${
                          height < 36 ? 'justify-center' : 'justify-start py-1'
                        } ${eventToneClass(kind, isDarkMode)}`}
                        style={{
                          top,
                          height: height - 2,
                          left: `calc(${(lane / laneCount) * 100}% + 2px)`,
                          width: `calc(${100 / laneCount}% - 4px)`,
                        }}
                      >
                        <span className="block text-[11px] leading-4 font-medium"><EventLabel kind={kind} title={title} /></span>
                        {height >= 40 && <span className="block text-[10px] leading-3 opacity-70 truncate">{time}</span>}
                      </button>
                    );
                  })}

                  {isTodayDay && (
                    <div
                      className="absolute inset-x-0 z-10 pointer-events-none border-t-2 border-red-500"
                      style={{ top: nowMinutes - 1 }}
                      data-testid="now-indicator"
                    >
                      <span className="absolute -left-1 -top-[5px] size-2 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {popover}
    </div>
  );
};

export default WeekPlannerView;
