import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Grape,
  Menu
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { listTasks, getTask, listVineyardBlocks, listHarvestTracking } from '@/shared/lib/vineyardApi';
import { TaskDrawer } from './TaskDrawer';

export function CalendarView({ onNavigate }) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [sprays, setsprays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [blocks, setBlocks] = useState([]);

  // Load all calendar data from Supabase
  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user]);

  const loadCalendarData = async () => {
    setLoading(true);
    console.log('Loading calendar data...');

    const currentYear = new Date().getFullYear();

    const [tasksRes, blocksRes, harvestsRes] = await Promise.all([
      listTasks(),
      listVineyardBlocks(),
      listHarvestTracking(currentYear)
    ]);

    if (tasksRes.error) {
      console.error('Error loading tasks:', tasksRes.error);
      setLoading(false);
      return;
    }

    console.log('Loaded tasks:', tasksRes.data);
    console.log('Loaded harvests:', harvestsRes.data);
    setTasks(tasksRes.data || []);
    setBlocks(blocksRes.data || []);
    setHarvests(harvestsRes.data || []);

    setsprays([]);

    const allEvents = [
      ...(tasksRes.data || []).map(t => ({
        id: `task-${t.id}`,
        taskId: t.id,
        type: 'task',
        title: t.title,
        date: t.due_date,
        start_date: t.start_date,
        status: t.status,
        priority: t.priority,
        color: getTaskColor(t.status)
      })),
      ...(harvestsRes.data || []).map(h => ({
        id: `harvest-${h.id}`,
        harvestId: h.id,
        type: 'harvest',
        title: `Harvest: ${h.vineyard_blocks?.name || 'Unknown Block'}`,
        date: h.target_pick_date,
        status: h.status,
        blockName: h.vineyard_blocks?.name,
        variety: h.vineyard_blocks?.variety,
        color: 'amber'
      }))
    ];

    console.log('All events:', allEvents);
    setEvents(allEvents);
    setLoading(false);
  };

  const handleEventClick = (event) => {
    if (event.type === 'task' && event.taskId) {
      console.log('Opening task:', event.taskId);
      const task = tasks.find(t => t.id === event.taskId);
      if (task) {
        setSelectedTask(task);
        setShowTaskDrawer(true);
      }
    } else if (event.type === 'harvest' && onNavigate) {
      console.log('Navigating to harvest tab');
      onNavigate('harvest');
    } else {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  };

  const handleTaskUpdate = async () => {
    await loadCalendarData();
  };

  const getTaskColor = (status) => {
    const colors = {
      'draft': 'gray',
      'scheduled': 'blue',
      'in_progress': 'yellow',
      'needs_review': 'orange',
      'done': 'green',
      'blocked': 'red',
      'archived': 'gray'
    };
    return colors[status] || 'indigo';
  };

  // Calendar calculations
  const { year, month } = useMemo(() => ({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth()
  }), [currentDate]);

  const daysInMonth = useMemo(() =>
    new Date(year, month + 1, 0).getDate(),
    [year, month]
  );

  const firstDayOfMonth = useMemo(() =>
    new Date(year, month, 1).getDay(),
    [year, month]
  );

  const calendarDays = useMemo(() => {
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth]);

  // Week view calculations
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [currentDate]);

  const getEventsForDate = (date) => {
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDateRangeText = () => {
    if (view === 'month') {
      return `${monthNames[month]} ${year}`;
    } else if (view === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${monthNames[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
      }
    } else {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const navigate = (direction) => {
    if (view === 'month') navigateMonth(direction);
    else if (view === 'week') navigateWeek(direction);
    else navigateDay(direction);
  };

  const EventBadge = ({ event, compact = false }) => (
    <div
      onClick={(e) => {
        e.stopPropagation();
        handleEventClick(event);
      }}
      className={`${compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-2'} rounded-lg mb-1 bg-${event.color}-100 text-${event.color}-700 border border-${event.color}-200 truncate flex items-center gap-1.5 cursor-pointer hover:bg-${event.color}-200 transition-all duration-150 hover:shadow-sm`}
    >
      {event.type === 'task' && (
        event.status === 'done' ? (
          <CheckCircle2 className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
        ) : (
          <AlertCircle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
        )
      )}
      {event.type === 'harvest' && <Grape className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />}
      <span className="truncate font-medium">{event.title}</span>
    </div>
  );

  const EventsList = ({ date, compact = false }) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;

    const maxDisplay = compact ? 2 : 3;

    return (
      <div className="mt-1 space-y-1">
        {dayEvents.slice(0, maxDisplay).map(event => (
          <EventBadge key={event.id} event={event} compact={compact} />
        ))}
        {dayEvents.length > maxDisplay && (
          <div className="text-xs text-[#4b5563] font-semibold px-2 cursor-pointer hover:text-[#1f2937]">
            +{dayEvents.length - maxDisplay} more
          </div>
        )}
      </div>
    );
  };

  // Month View
  const MonthView = () => (
    <Card className="overflow-hidden border border-gray-200 shadow-lg">
      <CardContent className="p-0">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b-2 border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-bold text-[#1f2937]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((dayData, idx) => {
            const dayEvents = getEventsForDate(dayData.date);
            const today = isToday(dayData.date);

            return (
              <div
                key={idx}
                className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                  !dayData.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } hover:bg-gray-50 transition-colors duration-150 cursor-pointer`}
                onClick={() => setSelectedDate(dayData.date)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-bold ${
                      today
                        ? 'w-7 h-7 bg-slate-700 text-white rounded-full flex items-center justify-center'
                        : !dayData.isCurrentMonth
                        ? 'text-gray-400'
                        : 'text-[#1f2937]'
                    }`}
                  >
                    {dayData.day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs text-[#4b5563] font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <EventsList date={dayData.date} compact={true} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  // Week View
  const WeekView = () => (
    <Card className="overflow-hidden border border-gray-200 shadow-lg">
      <CardContent className="p-0">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b-2 border-gray-200">
          {weekDays.map((date, idx) => {
            const today = isToday(date);
            return (
              <div
                key={idx}
                className={`py-4 text-center border-r last:border-r-0 border-gray-200 ${
                  today ? 'bg-slate-50' : ''
                }`}
              >
                <div className="text-xs font-semibold text-[#4b5563] mb-1">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${
                  today
                    ? 'w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center mx-auto'
                    : 'text-[#1f2937]'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slots (simplified - showing all-day events) */}
        <div className="grid grid-cols-7">
          {weekDays.map((date, idx) => (
            <div
              key={idx}
              className="min-h-[400px] border-r last:border-r-0 border-gray-200 p-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedDate(date)}
            >
              <EventsList date={date} compact={false} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Day View
  const DayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const today = isToday(currentDate);

    return (
      <Card className="overflow-hidden border border-gray-200 shadow-lg">
        <CardContent className="p-6">
          {/* Day Header */}
          <div className={`mb-6 pb-6 border-b-2 border-gray-200 ${today ? 'bg-slate-50 -m-6 p-6 mb-6' : ''}`}>
            <div className="flex items-center gap-4">
              {today && (
                <div className="w-2 h-12 bg-slate-700 rounded-full"></div>
              )}
              <div>
                <div className="text-sm font-semibold text-[#4b5563] mb-1">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
                <div className="text-3xl font-bold text-[#1f2937]">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Events List */}
          {dayEvents.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#1f2937] mb-4">
                Events ({dayEvents.length})
              </h3>
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-150 cursor-pointer bg-white"
                >
                  <div className={`w-1 h-full min-h-[60px] bg-${event.color}-500 rounded-full`}></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-[#1f2937] text-lg">{event.title}</h4>
                      {event.type === 'task' && event.status === 'done' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-[#4b5563]">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="capitalize">{event.type}</span>
                      </div>
                      {event.blockName && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{event.blockName}</span>
                        </div>
                      )}
                      {event.priority && (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" />
                          <span className="capitalize">{event.priority}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-[#4b5563] font-medium">No events scheduled for this day</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <h2 className="text-xl md:text-2xl font-bold text-[#1f2937] min-w-[200px] md:min-w-[280px] text-center">
                {getDateRangeText()}
              </h2>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(1)}
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold hidden md:flex"
              >
                Today
              </Button>
            </div>

            {/* View Toggle & Actions */}
            <div className="flex items-center gap-3">
              {/* Desktop View Toggle */}
              <div className="hidden md:flex gap-1 bg-gray-100 rounded-lg p-1">
                {['month', 'week', 'day'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-150 capitalize ${
                      view === v
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'text-[#4b5563] hover:text-[#1f2937] hover:bg-gray-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Mobile View Dropdown */}
              <div className="md:hidden flex-1">
                <select
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-[#1f2937] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="month">Month View</option>
                  <option value="week">Week View</option>
                  <option value="day">Day View</option>
                </select>
              </div>

              <Button
                className="bg-slate-700 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all font-bold"
                size="sm"
                onClick={() => onNavigate && onNavigate('tasks')}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New Event</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Content */}
      <div className="transition-opacity duration-200">
        {view === 'month' && <MonthView />}
        {view === 'week' && <WeekView />}
        {view === 'day' && <DayView />}
      </div>

      {/* Legend & Upcoming Events - Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legend */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">Event Types</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-100 border border-indigo-200 rounded"></div>
                <span className="text-sm font-medium text-[#4b5563]">Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
                <span className="text-sm font-medium text-[#4b5563]">Harvest</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-100 border border-cyan-200 rounded"></div>
                <span className="text-sm font-medium text-[#4b5563]">Spray Applications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-sm font-medium text-[#4b5563]">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Summary */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">Upcoming This Week</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {events
                .filter(e => {
                  if (!e.date) return false;
                  const eventDate = new Date(e.date);
                  const weekFromNow = new Date();
                  weekFromNow.setDate(weekFromNow.getDate() + 7);
                  return eventDate >= new Date() && eventDate <= weekFromNow;
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5)
                .map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-150 cursor-pointer bg-white"
                  >
                    <div className={`w-2 h-2 rounded-full bg-${event.color}-500 flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1f2937] truncate">{event.title}</p>
                      {event.blockName && (
                        <p className="text-sm text-[#4b5563] flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {event.blockName}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#1f2937]">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-[#4b5563] capitalize">{event.type}</p>
                    </div>
                  </div>
                ))}
              {events.filter(e => {
                if (!e.date) return false;
                const eventDate = new Date(e.date);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return eventDate >= new Date() && eventDate <= weekFromNow;
              }).length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-[#4b5563] font-medium">No upcoming events this week</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Event Details</h2>
              <button
                type="button"
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-[#1f2937] mb-2">{selectedEvent.title}</h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${selectedEvent.color}-100 text-${selectedEvent.color}-700 text-sm font-semibold`}>
                  <span className="capitalize">{selectedEvent.type}</span>
                </div>
              </div>

              <div className="space-y-3 text-[#4b5563]">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-slate-700" />
                  <span className="font-medium">
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {selectedEvent.blockName && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-700" />
                    <span className="font-medium">{selectedEvent.blockName}</span>
                  </div>
                )}

                {selectedEvent.variety && (
                  <div className="flex items-center gap-3">
                    <Grape className="w-5 h-5 text-slate-700" />
                    <span className="font-medium">{selectedEvent.variety}</span>
                  </div>
                )}

                {selectedEvent.status && (
                  <div className="flex items-center gap-3">
                    {selectedEvent.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-700" />
                    )}
                    <span className="font-medium capitalize">{selectedEvent.status.replace('_', ' ')}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setShowEventModal(false);
                    handleEventClick(selectedEvent);
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold"
                >
                  View Full Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Drawer */}
      {showTaskDrawer && selectedTask && (
        <TaskDrawer
          task={selectedTask}
          blocks={blocks}
          onClose={() => {
            setShowTaskDrawer(false);
            setSelectedTask(null);
          }}
          onUpdate={handleTaskUpdate}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 150ms ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 150ms ease-out;
        }
      `}</style>
    </div>
  );
}
