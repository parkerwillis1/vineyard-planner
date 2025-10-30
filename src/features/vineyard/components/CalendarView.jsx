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
  Grape
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

    // Get current year for harvest data
    const currentYear = new Date().getFullYear();

    // Load tasks, blocks, and harvests from Supabase
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

    // TODO: Load sprays from Supabase when that API is ready
    setsprays([]);

    // Combine all events
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

  const handleTaskClick = async (event) => {
    if (event.type === 'task' && event.taskId) {
      console.log('Opening task:', event.taskId);
      // Find the task in our tasks array
      const task = tasks.find(t => t.id === event.taskId);
      if (task) {
        setSelectedTask(task);
        setShowTaskDrawer(true);
      }
    } else if (event.type === 'harvest' && onNavigate) {
      // Navigate to harvest tab
      console.log('Navigating to harvest tab');
      onNavigate('harvest');
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const EventBadge = ({ event }) => (
    <div
      onClick={() => handleTaskClick(event)}
      className={`text-xs px-2 py-1 rounded mb-1 bg-${event.color}-100 text-${event.color}-700 border border-${event.color}-200 truncate flex items-center gap-1 cursor-pointer hover:bg-${event.color}-200 transition-colors`}
    >
      {event.type === 'task' && (
        event.status === 'done' ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : (
          <AlertCircle className="w-3 h-3" />
        )
      )}
      {event.type === 'harvest' && <Grape className="w-3 h-3" />}
      <span className="truncate">{event.title}</span>
    </div>
  );

  const EventsList = ({ date }) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;

    return (
      <div className="mt-1 space-y-1">
        {dayEvents.slice(0, 3).map(event => (
          <EventBadge key={event.id} event={event} />
        ))}
        {dayEvents.length > 3 && (
          <div className="text-xs text-gray-500 font-medium px-2">
            +{dayEvents.length - 3} more
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-900 min-w-[200px] text-center">
              {monthNames[month]} {year}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors capitalize ${
                  view === v
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <Button className="bg-vine-green-500 hover:bg-vine-green-600">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-sm font-semibold text-gray-700"
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
                  } hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => setSelectedDate(dayData.date)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-semibold ${
                        today
                          ? 'w-7 h-7 bg-vine-green-500 text-white rounded-full flex items-center justify-center'
                          : !dayData.isCurrentMonth
                          ? 'text-gray-400'
                          : 'text-gray-900'
                      }`}
                    >
                      {dayData.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-xs text-gray-500 font-medium">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <EventsList date={dayData.date} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Event Types</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-100 border border-indigo-200 rounded"></div>
              <span className="text-sm text-gray-600">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
              <span className="text-sm text-gray-600">Harvest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-100 border border-cyan-200 rounded"></div>
              <span className="text-sm text-gray-600">Spray Applications</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events Summary */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming This Week</h3>
          <div className="space-y-3">
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
                  onClick={() => handleTaskClick(event)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full bg-${event.color}-500`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    {event.blockName && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.blockName}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{event.type}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
