import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Sun,
  Cloud,
  CloudDrizzle,
  CloudSnow,
  Wind,
  Droplet,
  Thermometer,
  Eye,
  Gauge,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';

export function WeatherDashboard() {
  const [currentWeather, setCurrentWeather] = useState({
    temp: 72,
    feelsLike: 70,
    condition: 'partly-cloudy',
    humidity: 65,
    windSpeed: 8,
    windDirection: 'NW',
    pressure: 30.12,
    visibility: 10,
    uvIndex: 6,
    dewPoint: 58,
    precipitation: 0
  });

  const [forecast, setForecast] = useState([
    { day: 'Mon', high: 75, low: 58, condition: 'sunny', precipitation: 0 },
    { day: 'Tue', high: 78, low: 62, condition: 'partly-cloudy', precipitation: 10 },
    { day: 'Wed', high: 71, low: 59, condition: 'rainy', precipitation: 70 },
    { day: 'Thu', high: 68, low: 55, condition: 'rainy', precipitation: 85 },
    { day: 'Fri', high: 73, low: 57, condition: 'partly-cloudy', precipitation: 20 },
    { day: 'Sat', high: 76, low: 60, condition: 'sunny', precipitation: 5 },
    { day: 'Sun', high: 79, low: 63, condition: 'sunny', precipitation: 0 }
  ]);

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'frost',
      severity: 'high',
      title: 'Frost Warning',
      description: 'Temperatures expected to drop below 32°F tonight',
      validUntil: '2024-10-29T06:00:00'
    }
  ]);

  const getWeatherIcon = (condition, size = 6) => {
    const className = `w-${size} h-${size}`;
    switch (condition) {
      case 'sunny':
        return <Sun className={`${className} text-yellow-500`} />;
      case 'partly-cloudy':
        return <Cloud className={`${className} text-gray-400`} />;
      case 'cloudy':
        return <Cloud className={`${className} text-gray-500`} />;
      case 'rainy':
        return <CloudRain className={`${className} text-blue-500`} />;
      case 'drizzle':
        return <CloudDrizzle className={`${className} text-blue-400`} />;
      case 'snow':
        return <CloudSnow className={`${className} text-blue-300`} />;
      default:
        return <Cloud className={`${className} text-gray-400`} />;
    }
  };

  const getConditionText = (condition) => {
    const conditions = {
      'sunny': 'Sunny',
      'partly-cloudy': 'Partly Cloudy',
      'cloudy': 'Cloudy',
      'rainy': 'Rainy',
      'drizzle': 'Light Rain',
      'snow': 'Snow'
    };
    return conditions[condition] || 'Unknown';
  };

  const getUVIndexColor = (uvIndex) => {
    if (uvIndex < 3) return 'green';
    if (uvIndex < 6) return 'yellow';
    if (uvIndex < 8) return 'orange';
    if (uvIndex < 11) return 'red';
    return 'purple';
  };

  const MetricCard = ({ icon: Icon, label, value, unit, color = 'blue', subtitle }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {value}
          {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
        </div>
        <div className="text-sm text-gray-600">{label}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <Card key={alert.id} className="border-l-4 border-l-red-500 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-red-900">{alert.title}</h3>
                      <span className="text-xs text-red-600 font-medium uppercase">
                        {alert.severity} Priority
                      </span>
                    </div>
                    <p className="text-sm text-red-800 mb-2">{alert.description}</p>
                    <p className="text-xs text-red-600">
                      Valid until {new Date(alert.validUntil).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Current Weather */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-medium text-gray-600 mb-1">Current Weather</h2>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              {getWeatherIcon(currentWeather.condition, 16)}
              <div>
                <div className="text-6xl font-bold text-gray-900">{currentWeather.temp}°</div>
                <div className="text-sm text-gray-600">Feels like {currentWeather.feelsLike}°</div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 ml-6">
              <div>
                <p className="text-2xl font-semibold text-gray-900 capitalize">
                  {getConditionText(currentWeather.condition)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {currentWeather.precipitation > 0 ? `${currentWeather.precipitation}% chance of rain` : 'No precipitation'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Wind}
          label="Wind Speed"
          value={currentWeather.windSpeed}
          unit="mph"
          subtitle={`Direction: ${currentWeather.windDirection}`}
          color="cyan"
        />
        <MetricCard
          icon={Droplet}
          label="Humidity"
          value={currentWeather.humidity}
          unit="%"
          color="blue"
        />
        <MetricCard
          icon={Gauge}
          label="Pressure"
          value={currentWeather.pressure}
          unit="in"
          color="indigo"
        />
        <MetricCard
          icon={Eye}
          label="Visibility"
          value={currentWeather.visibility}
          unit="mi"
          color="purple"
        />
        <MetricCard
          icon={Sun}
          label="UV Index"
          value={currentWeather.uvIndex}
          color={getUVIndexColor(currentWeather.uvIndex)}
        />
        <MetricCard
          icon={Thermometer}
          label="Dew Point"
          value={currentWeather.dewPoint}
          unit="°F"
          color="teal"
        />
      </div>

      {/* 7-Day Forecast */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              7-Day Forecast
            </h3>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {forecast.map((day, idx) => (
              <div
                key={idx}
                className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-700 mb-3">{day.day}</p>
                <div className="flex justify-center mb-3">
                  {getWeatherIcon(day.condition, 8)}
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">{day.high}°</p>
                  <p className="text-sm text-gray-500">{day.low}°</p>
                  {day.precipitation > 0 && (
                    <div className="flex items-center justify-center gap-1 text-blue-600 mt-2">
                      <Droplet className="w-3 h-3" />
                      <span className="text-xs">{day.precipitation}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vineyard Insights */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vineyard Weather Insights</h3>

          <div className="space-y-4">
            {/* Spray Conditions */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CloudRain className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-green-900">Good Spray Conditions</h4>
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    FAVORABLE
                  </span>
                </div>
                <p className="text-sm text-green-800">
                  Wind speeds are optimal for spray applications. Low wind conditions expected through the afternoon.
                </p>
              </div>
            </div>

            {/* Irrigation Recommendation */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Droplet className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-blue-900">Irrigation Recommendation</h4>
                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  No significant rainfall expected in the next 3 days. Consider irrigation for blocks with shallow-rooted vines.
                </p>
              </div>
            </div>

            {/* Disease Pressure */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-amber-900">Disease Pressure Alert</h4>
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    MODERATE
                  </span>
                </div>
                <p className="text-sm text-amber-800">
                  High humidity and moderate temperatures increase powdery mildew risk. Monitor susceptible varieties closely.
                </p>
              </div>
            </div>

            {/* Harvest Conditions */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Sun className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-emerald-900">Harvest Window</h4>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                    EXCELLENT
                  </span>
                </div>
                <p className="text-sm text-emerald-800">
                  Dry conditions with moderate temperatures provide excellent harvest conditions for the next 48 hours.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Data */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Trends</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Average Temperature</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">73°F</p>
              <p className="text-xs text-gray-500 mt-1">+3° from last week</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Precipitation</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">0.3"</p>
              <p className="text-xs text-gray-500 mt-1">-0.5" from last week</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Average Humidity</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">68%</p>
              <p className="text-xs text-gray-500 mt-1">+5% from last week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Notice */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Weather data is simulated for demonstration purposes. In production, this would integrate with
          a weather API service.
        </p>
      </div>
    </div>
  );
}
