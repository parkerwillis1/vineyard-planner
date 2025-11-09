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
  Calendar,
  MapPin,
  Loader
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { supabase } from '@/shared/lib/supabaseClient';
import {
  fetchFieldRainfall,
  fetchFieldForecast,
  getFieldWeatherSummary
} from '@/shared/lib/fieldWeatherService';
import { listVineyardBlocks } from '@/shared/lib/vineyardApi';

export function WeatherDashboard() {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Load vineyard blocks
  useEffect(() => {
    loadBlocks();
  }, []);

  // Load weather data when block is selected
  useEffect(() => {
    if (selectedBlock && selectedBlock.lat && selectedBlock.lng) {
      loadWeatherData();
    }
  }, [selectedBlock]);

  async function loadBlocks() {
    setLoading(true);
    try {
      console.log('🔍 WeatherDashboard: Loading blocks...');

      const { data, error } = await listVineyardBlocks();

      if (error) {
        console.error('❌ Error loading blocks:', error);
        return;
      }

      console.log('📦 Received blocks:', data);
      console.log('📦 Total blocks:', data?.length || 0);

      // Transform blocks to include extracted coordinates from geom (like IrrigationManagement does)
      const transformedBlocks = (data || []).map(block => {
        let lat = null;
        let lng = null;

        // Extract center coordinates from GeoJSON polygon
        if (block.geom && block.geom.coordinates && block.geom.coordinates[0]) {
          const coords = block.geom.coordinates[0];
          // Calculate centroid of polygon
          const lats = coords.map(c => c[1]);
          const lngs = coords.map(c => c[0]);
          lat = lats.reduce((sum, l) => sum + l, 0) / lats.length;
          lng = lngs.reduce((sum, l) => sum + l, 0) / lngs.length;
        }

        return { ...block, lat, lng };
      });

      console.log('🔄 Transformed blocks with calculated coordinates');

      // Filter to only blocks with coordinates
      const blocksWithCoords = transformedBlocks.filter(b => b.lat && b.lng);
      console.log('🗺️ Blocks WITH coordinates:', blocksWithCoords.length);
      console.log('⚠️ Blocks WITHOUT coordinates:', transformedBlocks.length - blocksWithCoords.length);

      if (blocksWithCoords.length > 0) {
        console.log('✅ Blocks with coords:', blocksWithCoords.map(b => ({
          name: b.name,
          lat: b.lat?.toFixed(6),
          lng: b.lng?.toFixed(6)
        })));
      }

      setBlocks(blocksWithCoords);

      // Auto-select first block if available
      if (blocksWithCoords.length > 0 && !selectedBlock) {
        console.log('✅ Auto-selecting first block:', blocksWithCoords[0].name);
        setSelectedBlock(blocksWithCoords[0]);
      } else if (blocksWithCoords.length === 0) {
        console.warn('⚠️ No blocks with coordinates found');
      }
    } catch (error) {
      console.error('❌ Error loading blocks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadWeatherData() {
    if (!selectedBlock || !selectedBlock.lat || !selectedBlock.lng) return;

    setLoadingWeather(true);
    try {
      console.log(`Loading weather for ${selectedBlock.name} at ${selectedBlock.lat}, ${selectedBlock.lng}`);

      const summary = await getFieldWeatherSummary(selectedBlock.lat, selectedBlock.lng, 7);

      setWeatherData(summary);
      console.log('Weather data loaded:', summary);
    } catch (error) {
      console.error('Error loading weather:', error);
      setWeatherData(null);
    } finally {
      setLoadingWeather(false);
    }
  }

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
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-700" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading vineyard fields...</p>
        </div>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fields with Coordinates</h3>
            <p className="text-gray-600">
              Map your vineyard fields to see weather data for each location.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rainfall = weatherData?.historical;
  const forecast = weatherData?.forecast;

  // Parse wind speed from NWS format (e.g., "5 to 10 mph" -> 10)
  const parseWindSpeed = (windSpeedStr) => {
    if (!windSpeedStr) return 0;
    // Extract all numbers from the string
    const numbers = windSpeedStr.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 0;
    // Return the highest number (for ranges like "5 to 10 mph")
    return Math.max(...numbers.map(Number));
  };

  // Calculate dynamic insights based on real weather data
  const calculateSprayConditions = () => {
    if (!forecast?.periods) return { status: 'UNKNOWN', color: 'gray', message: 'Loading forecast data...' };

    // Check next 2 days (4 periods) for rain probability and wind
    const next48Hours = forecast.periods.slice(0, 4);
    const maxPrecipProb = Math.max(...next48Hours.map(p => p.precipitationProbability || 0));

    // Get wind speeds for daytime periods (when spraying would occur)
    const daytimePeriods = next48Hours.filter(p => !p.name.toLowerCase().includes('night'));
    const windSpeeds = daytimePeriods.map(p => parseWindSpeed(p.windSpeed)).filter(w => w > 0);
    const maxWindSpeed = windSpeeds.length > 0 ? Math.max(...windSpeeds) : 0;
    const avgWindSpeed = windSpeeds.length > 0 ? windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length : 0;

    // Determine wind suitability for spraying
    // Ideal: 3-10 mph, Caution: 10-15 mph, Unfavorable: >15 mph or <3 mph
    let windStatus = 'good';
    let windMessage = '';

    if (maxWindSpeed === 0) {
      windStatus = 'unknown';
      windMessage = 'Wind data unavailable.';
    } else if (maxWindSpeed > 15) {
      windStatus = 'poor';
      windMessage = `High winds (up to ${maxWindSpeed} mph) - excessive drift risk.`;
    } else if (maxWindSpeed > 10) {
      windStatus = 'caution';
      windMessage = `Moderate winds (${avgWindSpeed.toFixed(0)}-${maxWindSpeed} mph) - some drift possible.`;
    } else if (avgWindSpeed < 3 && maxWindSpeed < 5) {
      windStatus = 'caution';
      windMessage = `Very light winds (${avgWindSpeed.toFixed(0)}-${maxWindSpeed} mph) - watch for inversions.`;
    } else {
      windStatus = 'good';
      windMessage = `Good winds (${avgWindSpeed.toFixed(0)}-${maxWindSpeed} mph) - ideal for spraying.`;
    }

    // Combine precipitation and wind conditions
    if (maxPrecipProb < 20 && windStatus === 'good') {
      return {
        status: 'FAVORABLE',
        color: 'green',
        message: `Excellent spray conditions. ${windMessage} Low rain risk (${maxPrecipProb}% max).`
      };
    } else if (maxPrecipProb < 20 && windStatus === 'caution') {
      return {
        status: 'CAUTION',
        color: 'yellow',
        message: `Proceed with caution. ${windMessage} Low rain risk (${maxPrecipProb}% max).`
      };
    } else if (maxPrecipProb < 20 && windStatus === 'poor') {
      return {
        status: 'UNFAVORABLE',
        color: 'red',
        message: `Wind conditions unfavorable for spraying. ${windMessage} Rain risk low (${maxPrecipProb}% max).`
      };
    } else if (maxPrecipProb < 50 && windStatus === 'good') {
      return {
        status: 'CAUTION',
        color: 'yellow',
        message: `${windMessage} However, moderate rain risk (${maxPrecipProb}% max) - monitor forecast closely.`
      };
    } else if (maxPrecipProb < 50) {
      return {
        status: 'UNFAVORABLE',
        color: 'red',
        message: `Unfavorable conditions. ${windMessage} Moderate rain risk (${maxPrecipProb}% max).`
      };
    } else {
      return {
        status: 'UNFAVORABLE',
        color: 'red',
        message: `Poor spray conditions. High rain risk (${maxPrecipProb}% max). ${windMessage.replace('ideal for spraying', 'conditions not suitable')}`
      };
    }
  };

  const calculateIrrigationNeed = () => {
    if (!rainfall || !forecast) return { status: 'UNKNOWN', color: 'gray', message: 'Loading weather data...' };

    const totalRainMm = (rainfall.totalMm || 0) + (forecast.predictedRainfallMm || 0);
    const recentRainMm = rainfall.totalMm || 0;
    const daysSinceRain = rainfall.lastRainEvent?.date
      ? Math.floor((Date.now() - new Date(rainfall.lastRainEvent.date).getTime()) / (1000 * 60 * 60 * 24))
      : 7;

    if (totalRainMm < 5 && daysSinceRain > 5) {
      return {
        status: 'URGENT',
        color: 'red',
        message: `Only ${totalRainMm.toFixed(1)}mm total moisture in 7+7 day window. ${daysSinceRain} days since last rain. Irrigation strongly recommended.`
      };
    } else if (totalRainMm < 12 && daysSinceRain > 3) {
      return {
        status: 'RECOMMENDED',
        color: 'blue',
        message: `Low rainfall (${totalRainMm.toFixed(1)}mm total). ${daysSinceRain} days since last rain. Consider irrigation for shallow-rooted blocks.`
      };
    } else if (totalRainMm > 25) {
      return {
        status: 'NOT NEEDED',
        color: 'green',
        message: `Adequate rainfall (${totalRainMm.toFixed(1)}mm total). Soil moisture should be sufficient.`
      };
    } else {
      return {
        status: 'MONITOR',
        color: 'yellow',
        message: `Moderate rainfall (${totalRainMm.toFixed(1)}mm total). Monitor soil moisture levels.`
      };
    }
  };

  const calculateDiseasePressure = () => {
    if (!forecast?.periods || !rainfall) return { status: 'UNKNOWN', color: 'gray', message: 'Loading weather data...' };

    const recentRainMm = rainfall.totalMm || 0;
    const avgTemp = forecast.periods.slice(0, 6).reduce((sum, p) => sum + (p.temperature || 70), 0) / 6;

    // High disease risk: recent rain + moderate temps (60-80°F)
    if (recentRainMm > 10 && avgTemp >= 60 && avgTemp <= 80) {
      return {
        status: 'HIGH',
        color: 'red',
        message: `High risk: ${recentRainMm.toFixed(1)}mm recent rain + ${avgTemp.toFixed(0)}°F avg temp. Ideal for powdery mildew and botrytis. Monitor closely.`
      };
    } else if (recentRainMm > 5 && avgTemp >= 50 && avgTemp <= 85) {
      return {
        status: 'MODERATE',
        color: 'amber',
        message: `Moderate risk: ${recentRainMm.toFixed(1)}mm recent rain + ${avgTemp.toFixed(0)}°F avg temp. Watch for disease symptoms in susceptible varieties.`
      };
    } else if (recentRainMm < 2 && (avgTemp < 50 || avgTemp > 85)) {
      return {
        status: 'LOW',
        color: 'green',
        message: `Low risk: Dry conditions (${recentRainMm.toFixed(1)}mm rain) and temperature (${avgTemp.toFixed(0)}°F) not favorable for disease development.`
      };
    } else {
      return {
        status: 'MODERATE',
        color: 'yellow',
        message: `Moderate risk: Continue routine monitoring. ${recentRainMm.toFixed(1)}mm recent rain, ${avgTemp.toFixed(0)}°F avg temp.`
      };
    }
  };

  const calculateHarvestWindow = () => {
    if (!forecast?.periods) return { status: 'UNKNOWN', color: 'gray', message: 'Loading forecast data...' };

    // Check next 3 days (6 periods)
    const next72Hours = forecast.periods.slice(0, 6);
    const maxPrecipProb = Math.max(...next72Hours.map(p => p.precipitationProbability || 0));
    const avgTemp = next72Hours.reduce((sum, p) => sum + (p.temperature || 70), 0) / next72Hours.length;
    const anyRainPredicted = next72Hours.some(p => p.estimatedRainfallMm > 0);

    // Check wind conditions - high winds can damage equipment and make harvest difficult
    const daytimePeriods = next72Hours.filter(p => !p.name.toLowerCase().includes('night'));
    const windSpeeds = daytimePeriods.map(p => parseWindSpeed(p.windSpeed)).filter(w => w > 0);
    const maxWindSpeed = windSpeeds.length > 0 ? Math.max(...windSpeeds) : 0;

    // High winds (>20 mph) can make harvest operations difficult and damage vines/equipment
    const highWinds = maxWindSpeed > 20;
    const moderateWinds = maxWindSpeed > 15 && maxWindSpeed <= 20;

    if (maxPrecipProb < 20 && avgTemp >= 50 && avgTemp <= 85 && !highWinds && !moderateWinds) {
      return {
        status: 'EXCELLENT',
        color: 'emerald',
        message: `Optimal conditions: Low precipitation risk (${maxPrecipProb}% max), moderate temps (${avgTemp.toFixed(0)}°F), calm winds (${maxWindSpeed} mph max). Excellent 72-hour harvest window.`
      };
    } else if (maxPrecipProb < 40 && !anyRainPredicted && !highWinds) {
      return {
        status: 'GOOD',
        color: 'green',
        message: `Good conditions: Moderate precipitation risk (${maxPrecipProb}% max), winds ${maxWindSpeed} mph max. ${moderateWinds ? 'Watch wind conditions closely.' : 'Favorable for harvest operations.'}`
      };
    } else if (highWinds && maxPrecipProb < 40) {
      return {
        status: 'FAIR',
        color: 'yellow',
        message: `High winds (${maxWindSpeed} mph max) may impact operations. Precipitation risk ${maxPrecipProb}%. Proceed with caution.`
      };
    } else if (maxPrecipProb < 60 && !highWinds) {
      return {
        status: 'FAIR',
        color: 'yellow',
        message: `Fair conditions: ${maxPrecipProb}% precipitation risk, winds ${maxWindSpeed} mph max. Monitor forecast before scheduling harvest.`
      };
    } else {
      return {
        status: 'POOR',
        color: 'red',
        message: `Unfavorable conditions: ${highWinds ? `High winds (${maxWindSpeed} mph).` : ''} ${maxPrecipProb >= 60 ? `High precipitation risk (${maxPrecipProb}% max).` : ''} Delay harvest if possible.`
      };
    }
  };

  const sprayInsight = calculateSprayConditions();
  const irrigationInsight = calculateIrrigationNeed();
  const diseaseInsight = calculateDiseasePressure();
  const harvestInsight = calculateHarvestWindow();

  return (
    <div className="space-y-6">
      {/* Field Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-gray-700" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vineyard Field
              </label>
              <select
                value={selectedBlock?.id || ''}
                onChange={(e) => {
                  const block = blocks.find(b => b.id === e.target.value);
                  setSelectedBlock(block);
                }}
                className="w-full max-w-2xl px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {blocks.map(block => (
                  <option key={block.id} value={block.id}>
                    {block.name} {block.variety ? `(${block.variety})` : ''} • {block.acres} acres
                  </option>
                ))}
              </select>
            </div>
            {loadingWeather && (
              <div className="flex items-center gap-2">
                <Loader className="w-5 h-5 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Rainfall Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {selectedBlock?.name}
              </h2>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {rainfall?.stationName && (
              <div className="text-right bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                <p className="text-xs text-gray-500">NWS Station</p>
                <p className="font-medium text-gray-900 text-sm">{rainfall.stationName}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Last 7 Days */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CloudRain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Historical</div>
                  <div className="text-sm font-semibold text-gray-900">Last 7 Days</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {rainfall ? rainfall.totalInches.toFixed(2) : '0.00'}<span className="text-xl text-gray-500 ml-1">"</span>
              </div>
              {rainfall && rainfall.totalMm > 0 && (
                <div className="text-sm text-gray-500 mt-1">{rainfall.totalMm.toFixed(1)} mm</div>
              )}
            </div>

            {/* Predicted Rainfall */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Forecast</div>
                  <div className="text-sm font-semibold text-gray-900">Next 7 Days</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {forecast ? (forecast.predictedRainfallInches || 0).toFixed(2) : '0.00'}<span className="text-xl text-gray-500 ml-1">"</span>
              </div>
              {forecast && forecast.predictedRainfallMm > 0 && (
                <div className="text-sm text-gray-500 mt-1">{forecast.predictedRainfallMm.toFixed(1)} mm</div>
              )}
            </div>

            {/* Last Rain Event */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Last Event</div>
                  <div className="text-sm font-semibold text-gray-900">Recent Rain</div>
                </div>
              </div>
              {rainfall?.lastRainEvent?.date ? (
                <>
                  <div className="text-3xl font-bold text-gray-900">
                    {new Date(rainfall.lastRainEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {(rainfall.lastRainEvent.amount / 25.4).toFixed(2)}" ({rainfall.lastRainEvent.amount.toFixed(1)}mm)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-400">No Rain</div>
                  <div className="text-sm text-gray-500 mt-1">Past 7 days</div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Weather Forecast */}
      {forecast && forecast.periods && forecast.periods.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                7-Day Forecast
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {forecast.periods.slice(0, 14).map((period, idx) => {
                const isDay = !period.name.toLowerCase().includes('night');
                return (
                  <div
                    key={idx}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                      isDay
                        ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-400'
                        : 'bg-gradient-to-br from-indigo-50 to-slate-100 border-indigo-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{period.name}</p>
                        <p className="text-xs text-gray-500 font-medium">
                          {new Date(period.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {period.temperature && (
                        <div className={`text-right ${isDay ? 'text-orange-600' : 'text-blue-600'}`}>
                          <p className="text-3xl font-black">{period.temperature}°</p>
                          <p className="text-xs font-semibold">F</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 font-medium leading-snug">{period.shortForecast}</p>

                      <div className="space-y-1">
                        {period.precipitationProbability > 0 && (
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${
                            period.precipitationProbability > 50
                              ? 'bg-blue-100 border border-blue-300'
                              : 'bg-blue-50 border border-blue-200'
                          }`}>
                            <Droplet className={`w-4 h-4 ${
                              period.precipitationProbability > 50 ? 'text-blue-700' : 'text-blue-600'
                            }`} />
                            <div className="flex-1">
                              <span className={`text-sm font-bold ${
                                period.precipitationProbability > 50 ? 'text-blue-900' : 'text-blue-700'
                              }`}>
                                {period.precipitationProbability}%
                              </span>
                              {period.estimatedRainfallMm > 0 && (
                                <span className="text-xs text-gray-600 ml-1">
                                  (~{(period.estimatedRainfallMm / 25.4).toFixed(2)}")
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {period.windSpeed && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                            <Wind className="w-4 h-4 text-gray-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">
                                {period.windSpeed}
                              </span>
                              {period.windDirection && (
                                <span className="text-xs text-gray-500 ml-1">
                                  {period.windDirection}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vineyard Insights */}
      <Card className="border-0 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Vineyard Weather Insights</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Spray Conditions */}
            <div className={`flex items-start gap-4 p-5 rounded-xl bg-${sprayInsight.color}-50 border-2 border-${sprayInsight.color}-200 shadow-md hover:shadow-lg transition-shadow`}>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${sprayInsight.color}-400 to-${sprayInsight.color}-600 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <CloudRain className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold text-${sprayInsight.color}-900 text-lg`}>Spray Conditions</h4>
                  <span className={`text-xs font-bold text-white bg-gradient-to-r from-${sprayInsight.color}-500 to-${sprayInsight.color}-600 px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wide`}>
                    {sprayInsight.status}
                  </span>
                </div>
                <p className={`text-sm text-${sprayInsight.color}-800 leading-relaxed font-medium`}>
                  {sprayInsight.message}
                </p>
              </div>
            </div>

            {/* Irrigation Recommendation */}
            <div className={`flex items-start gap-4 p-5 rounded-xl bg-${irrigationInsight.color}-50 border-2 border-${irrigationInsight.color}-200 shadow-md hover:shadow-lg transition-shadow`}>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${irrigationInsight.color}-400 to-${irrigationInsight.color}-600 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <Droplet className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold text-${irrigationInsight.color}-900 text-lg`}>Irrigation</h4>
                  <span className={`text-xs font-bold text-white bg-gradient-to-r from-${irrigationInsight.color}-500 to-${irrigationInsight.color}-600 px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wide`}>
                    {irrigationInsight.status}
                  </span>
                </div>
                <p className={`text-sm text-${irrigationInsight.color}-800 leading-relaxed font-medium`}>
                  {irrigationInsight.message}
                </p>
              </div>
            </div>

            {/* Disease Pressure */}
            <div className={`flex items-start gap-4 p-5 rounded-xl bg-${diseaseInsight.color}-50 border-2 border-${diseaseInsight.color}-200 shadow-md hover:shadow-lg transition-shadow`}>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${diseaseInsight.color}-400 to-${diseaseInsight.color}-600 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold text-${diseaseInsight.color}-900 text-lg`}>Disease Pressure</h4>
                  <span className={`text-xs font-bold text-white bg-gradient-to-r from-${diseaseInsight.color}-500 to-${diseaseInsight.color}-600 px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wide`}>
                    {diseaseInsight.status}
                  </span>
                </div>
                <p className={`text-sm text-${diseaseInsight.color}-800 leading-relaxed font-medium`}>
                  {diseaseInsight.message}
                </p>
              </div>
            </div>

            {/* Harvest Conditions */}
            <div className={`flex items-start gap-4 p-5 rounded-xl bg-${harvestInsight.color}-50 border-2 border-${harvestInsight.color}-200 shadow-md hover:shadow-lg transition-shadow`}>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${harvestInsight.color}-400 to-${harvestInsight.color}-600 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <Sun className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold text-${harvestInsight.color}-900 text-lg`}>Harvest Window</h4>
                  <span className={`text-xs font-bold text-white bg-gradient-to-r from-${harvestInsight.color}-500 to-${harvestInsight.color}-600 px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wide`}>
                    {harvestInsight.status}
                  </span>
                </div>
                <p className={`text-sm text-${harvestInsight.color}-800 leading-relaxed font-medium`}>
                  {harvestInsight.message}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Rainfall Data */}
      {rainfall && rainfall.dailyRainfall && Object.keys(rainfall.dailyRainfall).length > 0 && (
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <CloudRain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Daily Rainfall (Last 7 Days)</h3>
            </div>

            <div className="space-y-3">
              {Object.entries(rainfall.dailyRainfall)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .map(([date, amount]) => (
                  <div key={date} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <CloudRain className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-900">
                        {(amount / 25.4).toFixed(2)}"
                      </p>
                      <p className="text-xs text-gray-500">{amount.toFixed(1)} mm</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total (7 days):</span>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    {rainfall.totalInches.toFixed(2)}"
                  </p>
                  <p className="text-xs text-gray-500">{rainfall.totalMm.toFixed(1)} mm</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Source Notice */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <CloudRain className="w-6 h-6 text-white" />
            </div>
            <p className="font-bold text-xl">Real-Time Weather Data</p>
          </div>
          <p className="text-blue-50 text-center text-sm mb-3">
            Weather data provided by the <strong className="text-white">National Weather Service (NWS)</strong>
          </p>
          {rainfall?.stationName && (
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 text-center">
                <p className="text-xs text-blue-100 mb-1">NWS Station</p>
                <p className="font-semibold text-white text-sm">{rainfall.stationName}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
