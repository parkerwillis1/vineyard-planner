import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutGrid,
  TrendingUp,
  DollarSign,
  BarChart3,
  MapPin,
  Thermometer,
  Calendar,
  Sprout,
  FileText,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Droplet,
  Wind,
  Tractor,
  Activity,
  Package,
  Wrench,
  Satellite
} from "lucide-react";

export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    "/images/Vineyard1.jpg",
    "/images/Vineyard2.jpg",
    "/images/Vineyard3.jpg",
    "/images/Vineyard4.jpg",
  ];

  // Preload first hero image for faster LCP
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = images[0];
    link.fetchPriority = 'high';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative">
      {/* Hero Section with Slideshow */}
      <section className="relative overflow-hidden bg-gradient-to-b from-vine-green-50 to-white">
        {/* Background Slideshow - Optimized: Only render current and next image */}
        <div className="absolute inset-0 z-0" style={{ minHeight: '70vh' }}>
          {images.map((image, index) => {
            const isCurrent = index === currentImage;
            const isNext = index === (currentImage + 1) % images.length;
            const isPrev = index === (currentImage - 1 + images.length) % images.length;

            // Only render current, next, and previous images to reduce memory
            if (!isCurrent && !isNext && !isPrev) return null;

            return (
              <img
                key={index}
                src={image}
                alt={`Vineyard scene ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  isCurrent ? 'opacity-90' : 'opacity-0'
                }`}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'low'}
              />
            );
          })}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-32 md:py-40 lg:py-48">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
              Plan. Grow. Prosper.
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-6 sm:leading-8 text-white font-bold px-4 sm:px-0" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
              From financial planning to daily operations—design your vineyard, manage your team, track activities, and monitor vineyard health with satellite data. All in one powerful platform.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4 sm:px-0">
              <Link
                to="/signup"
                className="w-full sm:w-auto text-center rounded-md bg-vine-green-500 px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-white hover:text-vine-green-500 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vine-green-500"
              >
                Get Started Free
              </Link>
              <Link
                to="/products"
                className="text-sm sm:text-base font-semibold leading-7 text-white hover:text-vine-green-500"
              >
                View Products <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Slideshow Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentImage(index)}
              className={`w-2.5 h-2.5 rounded-full p-0 m-0 border-0 appearance-none leading-none shrink-0 outline-none focus:outline-none transition-all duration-300
                ${index === currentImage
                  ? 'bg-white opacity-100 scale-110'
                  : 'bg-white/30 hover:opacity-70'}
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Product Showcase - Zendesk Style */}
      <section className="relative bg-white py-20 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          {/* Title */}
          <div className="text-center mb-10 mt-4">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-4">
              Plan smarter. Operate better.
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to design your vineyard, forecast financials, and manage daily operations—all in one platform.
            </p>
          </div>

          {/* Main content with software mockup and people */}
          <div className="relative flex items-center justify-center min-h-[600px]">
            {/* Background layer - furthest back (z-index: 1) */}
            {/* Far left - small and receded */}
            <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-56 h-80 rounded-3xl overflow-hidden shadow-lg" style={{zIndex: 1}}>
              <img
                src="/farmer-1.jpg"
                alt="Vineyard worker"
                className="w-full h-full object-cover object-[50%_35%] scale-110 opacity-90"
              />
            </div>

            {/* Far right - small and receded */}
            <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-56 h-80 rounded-3xl overflow-hidden shadow-lg" style={{zIndex: 1}}>
              <img
                src="/farmer-4.png"
                alt="Vineyard team"
                className="w-full h-full object-cover object-[50%_35%] scale-110 opacity-90"
              />
            </div>

            {/* Middle layer - closer to viewer (z-index: 2) */}
            {/* Left center - taller, closer */}
            <div className="hidden lg:block absolute left-20 top-1/2 -translate-y-1/2 w-64 h-96 rounded-3xl overflow-hidden shadow-xl" style={{zIndex: 2}}>
              <img
                src="/farmer-2.jpg"
                alt="Vineyard operations"
                className="w-full h-full object-cover object-[50%_35%] scale-110"
              />
            </div>

            {/* Right center - taller, closer */}
            <div className="hidden lg:block absolute right-20 top-1/2 -translate-y-1/2 w-64 h-96 rounded-3xl overflow-hidden shadow-xl" style={{zIndex: 2}}>
              <img
                src="/farmer-3.png"
                alt="Vineyard management"
                className="w-full h-full object-cover object-[50%_35%] scale-110"
              />
            </div>

            {/* Software Interface Mockup - IN FRONT (z-index: 10) */}
            <div className="relative z-10 mx-auto max-w-[52rem] w-full">
              {/* Browser-style mockup frame */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 max-w-md">
                      vinepioneer.com/planner
                    </div>
                  </div>
                </div>

                {/* Interface content - Planner view with sidebar */}
                <div className="bg-gray-50 flex">
                  {/* Sidebar */}
                  <div className="w-40 bg-white border-r border-gray-200 p-2.5 flex flex-col">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sprout className="w-4 h-4 text-vine-green-600" />
                        <span className="font-bold text-sm text-gray-900">Planner</span>
                      </div>
                      <div className="bg-teal-600 text-white text-xs font-semibold px-2 py-1 rounded text-center">
                        Saved
                      </div>
                    </div>

                    <nav className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Vineyard Design</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Financial Inputs</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700">
                        <Sprout className="w-3.5 h-3.5" />
                        <span>Vineyard Setup</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-900 font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>10-Year Plan</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Business Plan</span>
                      </div>
                    </nav>

                    {/* Bottom section */}
                    <div className="mt-auto pt-3 border-t border-gray-200 space-y-2">
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Project Years</div>
                        <div className="text-2xl font-bold text-gray-900">10</div>
                      </div>
                      <div className="bg-purple-50 rounded p-2 text-center">
                        <div className="text-xs text-gray-600 mb-0.5">Total Est. Cost</div>
                        <div className="text-lg font-bold text-purple-600">$220,883</div>
                      </div>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-5">
                    {/* Header */}
                    <div className="mb-3">
                      <h2 className="text-xl font-bold text-gray-900 mb-0.5">10-Year Plan</h2>
                      <p className="text-xs text-gray-600">Financial forecast showing revenue, expenses, and profitability</p>
                    </div>

                    {/* Key metrics cards */}
                    <div className="grid grid-cols-3 gap-2.5 mb-3">
                      <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200 text-center">
                        <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-xl font-bold text-blue-600">Year 7</div>
                        <div className="text-xs text-gray-600">Break Even</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200 text-center">
                        <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-1">
                          <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                        </div>
                        <div className="text-xl font-bold text-teal-600">$1.09M</div>
                        <div className="text-xs text-gray-600">Total Revenue</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200 text-center">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-600">210%</div>
                        <div className="text-xs text-gray-600">Annual ROI</div>
                      </div>
                    </div>

                    {/* Revenue projection chart */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-900">10-Year Revenue Projection</h3>
                        <BarChart3 className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Year 1-3</span>
                          <span className="font-semibold text-gray-900">$0</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5"></div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Year 4-5</span>
                          <span className="font-semibold text-gray-900">$90,890/yr</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-yellow-500 h-1.5 rounded-full" style={{width: '60%'}}></div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Year 6-10</span>
                          <span className="font-semibold text-gray-900">$181,780/yr</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-teal-500 h-1.5 rounded-full" style={{width: '100%'}}></div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">Break-Even</span>
                        <span className="text-sm font-bold text-teal-600">Year 7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Moving Ticker - Trusted Vineyards */}
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wide mb-8">
              Trusted by vineyard operations across North America
            </p>

            {/* Ticker Animation */}
            <div className="relative overflow-hidden">
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes ticker-scroll {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .ticker-animate {
                  animation: ticker-scroll 30s linear infinite;
                }
                .ticker-animate:hover {
                  animation-play-state: paused;
                }
              `}} />
              <div className="flex ticker-animate whitespace-nowrap">
                {/* First set of names */}
                <div className="flex items-center gap-12 px-6">
                  <span className="text-gray-400 font-bold text-lg">Napa Valley Estates</span>
                  <span className="text-gray-400 font-bold text-lg">Willamette Vintners</span>
                  <span className="text-gray-400 font-bold text-lg">Sonoma Vineyards</span>
                  <span className="text-gray-400 font-bold text-lg">Central Coast Wines</span>
                  <span className="text-gray-400 font-bold text-lg">Paso Robles Growers</span>
                  <span className="text-gray-400 font-bold text-lg">Santa Barbara Viticulture</span>
                  <span className="text-gray-400 font-bold text-lg">Oregon Wine Co.</span>
                  <span className="text-gray-400 font-bold text-lg">Finger Lakes Vineyard</span>
                </div>
                {/* Duplicate set for seamless loop */}
                <div className="flex items-center gap-12 px-6">
                  <span className="text-gray-400 font-bold text-lg">Napa Valley Estates</span>
                  <span className="text-gray-400 font-bold text-lg">Willamette Vintners</span>
                  <span className="text-gray-400 font-bold text-lg">Sonoma Vineyards</span>
                  <span className="text-gray-400 font-bold text-lg">Central Coast Wines</span>
                  <span className="text-gray-400 font-bold text-lg">Paso Robles Growers</span>
                  <span className="text-gray-400 font-bold text-lg">Santa Barbara Viticulture</span>
                  <span className="text-gray-400 font-bold text-lg">Oregon Wine Co.</span>
                  <span className="text-gray-400 font-bold text-lg">Finger Lakes Vineyard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planning Tools Section - Clean & Balanced */}
      <section className="bg-gradient-to-br from-vine-green-500 to-emerald-600 pt-16 pb-24 sm:pt-20 sm:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 mb-3 border border-white/30">
              <LayoutGrid className="w-4 h-4 text-white" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-white">Vineyard Planner</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Build your vineyard with real numbers
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Model your complete financial picture with tools that show lenders you've done the homework.
            </p>
          </div>

          {/* 2x2 grid with more substance */}
          <div className="grid md:grid-cols-2 gap-12 text-white">
            {/* Configure Layout */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold">Configure Your Layout</h3>
              </div>
              <p className="text-base text-white/90 leading-relaxed">
                Set vine spacing, define plot dimensions, and calculate total vines, trellis materials, irrigation components, and fencing costs.
              </p>
            </div>

            {/* Cash Flow */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold">Project Your Cash Flow</h3>
              </div>
              <p className="text-base text-white/90 leading-relaxed">
                Create 10-30 year forecasts with revenue, expenses, and liquidity analysis. Choose bottled wine or bulk grape sales.
              </p>
            </div>

            {/* Structure Debt */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold">Structure Your Debt</h3>
              </div>
              <p className="text-base text-white/90 leading-relaxed">
                Evaluate USDA FSA loans and commercial financing with precise payment calculations, loan-to-value ratios, and equity requirements.
              </p>
            </div>

            {/* Scenarios */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold">Analyze Scenarios</h3>
              </div>
              <p className="text-base text-white/90 leading-relaxed">
                Test different strategies by adjusting key variables and instantly see how they impact profitability and break-even timeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Power of All Platforms */}
      <section className="relative bg-gradient-to-br from-gray-50 to-white py-24 sm:py-32 overflow-hidden">
        {/* Decorative background patterns - Topography */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url('/topo.png')`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
          }}></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 px-4 py-2 mb-6 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-bold text-teal-700">Your Complete Journey</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              From concept to harvest in one platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A seamless workflow that takes you from your initial vineyard vision all the way through to managing daily operations and analyzing performance.
            </p>
          </div>

          {/* Journey Timeline */}
          <div className="relative mx-auto max-w-6xl">
            {/* Connecting line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-200 via-emerald-300 to-vine-green-400 transform -translate-x-1/2"></div>

            {/* Phase 1: Planning */}
            <div className="relative mb-16 lg:mb-24">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                {/* Left side - Step 1 */}
                <div className="lg:w-1/2 lg:pr-12 lg:text-right">
                  <div className="group relative bg-gradient-to-br from-teal-50 to-white rounded-2xl border-2 border-teal-200 p-8 shadow-lg hover:shadow-2xl hover:border-teal-400 transition-all hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white font-bold text-2xl mb-4 shadow-md group-hover:scale-110 transition-transform lg:float-right lg:ml-4">
                      1
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2 lg:justify-end">
                      <LayoutGrid className="w-6 h-6 text-teal-600" />
                      Design Your Vineyard
                    </h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Set spacing, plot dimensions, and row orientation. Instantly calculate materials, trellis systems, and irrigation needs.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">Layout Tools</span>
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">Auto Calculations</span>
                    </div>
                  </div>
                </div>

                {/* Center badge */}
                <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 w-20 h-20 items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center border-4 border-white shadow-xl">
                    <Sprout className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Right side - Step 2 */}
                <div className="lg:w-1/2 lg:pl-12">
                  <div className="group relative bg-gradient-to-br from-teal-50 to-white rounded-2xl border-2 border-teal-200 p-8 shadow-lg hover:shadow-2xl hover:border-teal-400 transition-all hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white font-bold text-2xl mb-4 shadow-md group-hover:scale-110 transition-transform lg:float-left lg:mr-4">
                      2
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-teal-600" />
                      Build Financial Projections
                    </h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Create 10-30 year projections with revenue models, cost breakdowns, and ROI calculations. Compare different financing scenarios to find what works.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">Cash Flow</span>
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">Loan Planning</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2: Operations */}
            <div className="relative">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                {/* Left side - Step 3 */}
                <div className="lg:w-1/2 lg:pr-12 lg:text-right">
                  <div className="group relative bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-emerald-200 p-8 shadow-lg hover:shadow-2xl hover:border-emerald-400 transition-all hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-2xl mb-4 shadow-md group-hover:scale-110 transition-transform lg:float-right lg:ml-4">
                      3
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2 lg:justify-end">
                      <MapPin className="w-6 h-6 text-emerald-600" />
                      Map Your Fields
                    </h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Draw field boundaries on satellite maps, track vegetation health with NDVI data, and monitor field performance throughout the season.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Satellite NDVI</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Field Mapping</span>
                    </div>
                  </div>
                </div>

                {/* Center badge */}
                <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 w-20 h-20 items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center border-4 border-white shadow-xl">
                    <Satellite className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Right side - Step 4 */}
                <div className="lg:w-1/2 lg:pl-12">
                  <div className="group relative bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-emerald-200 p-8 shadow-lg hover:shadow-2xl hover:border-emerald-400 transition-all hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-2xl mb-4 shadow-md group-hover:scale-110 transition-transform lg:float-left lg:mr-4">
                      4
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-emerald-600" />
                      Manage Daily Operations
                    </h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Assign tasks to your team, log spray and irrigation events, track harvest quality data, and make data-driven decisions with real-time analytics.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Task Management</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vineyard Operations Section - Redesigned */}
      <section className="relative bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 overflow-hidden py-16 sm:py-24 lg:py-32">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white mb-4 shadow-sm border border-white/30">
              <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Available Now
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 mb-4 border border-white/30">
              <Sprout className="w-4 h-4 text-white" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-white">Vineyard Operations</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white px-4 sm:px-0">
              Run operations with complete visibility
            </p>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-white/90 px-4 sm:px-0">
              Once planted, seamlessly transition from planning to execution with tools built for daily management.
              Log activities, monitor conditions, and make informed decisions across every block.
            </p>
          </div>

          {/* Zigzag Feature Layout */}
          <div className="space-y-20 sm:space-y-32">
            {/* Feature 1 - Field Mapping (Image Left, Text Right) */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Mockup/Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white p-4">
                  {/* Field Mapping Mockup */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 rounded-2xl overflow-hidden relative">
                    {/* Simulated satellite/map view */}
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px), repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
                    }}></div>

                    {/* Field blocks with NDVI colors */}
                    <div className="absolute top-12 left-8 w-32 h-24 bg-green-400 opacity-70 rounded-lg transform -rotate-12 border-2 border-white/30"></div>
                    <div className="absolute top-16 right-12 w-28 h-20 bg-yellow-400 opacity-70 rounded-lg transform rotate-6 border-2 border-white/30"></div>
                    <div className="absolute bottom-16 left-16 w-24 h-28 bg-red-400 opacity-70 rounded-lg transform rotate-12 border-2 border-white/30"></div>
                    <div className="absolute bottom-12 right-16 w-36 h-20 bg-green-300 opacity-70 rounded-lg transform -rotate-6 border-2 border-white/30"></div>

                    {/* NDVI Legend */}
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                      <p className="text-xs font-bold text-gray-800 mb-1">NDVI Index</p>
                      <div className="flex gap-1">
                        <div className="w-6 h-3 bg-red-400 rounded"></div>
                        <div className="w-6 h-3 bg-yellow-400 rounded"></div>
                        <div className="w-6 h-3 bg-green-300 rounded"></div>
                        <div className="w-6 h-3 bg-green-500 rounded"></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>

                    {/* Map marker */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <MapPin className="w-8 h-8 text-white drop-shadow-lg" strokeWidth={2} fill="currentColor" />
                    </div>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl -z-10"></div>
              </div>

              {/* Text Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  Most Popular
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Map every block of your vineyard
                </h3>
                <p className="text-lg text-white/90 mb-6 leading-relaxed">
                  Draw custom field boundaries, organize your blocks, and track key metrics for each area. Keep all your vineyard data organized in one visual interface that makes management simple.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-white text-teal-700 px-6 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors shadow-lg"
                >
                  Explore Field Mapping
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Feature 2 - Irrigation (Text Left, Image Right) */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Text Content */}
              <div className="lg:order-1">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  <Droplet className="w-3.5 h-3.5" />
                  Smart Irrigation
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Optimize every drop of water
                </h3>
                <p className="text-lg text-white/90 mb-6 leading-relaxed">
                  Log irrigation events, track water usage, and get ET-based recommendations. Calculate application rates by field and monitor flow rates to maximize efficiency.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Explore Irrigation Tools
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Mockup/Image */}
              <div className="relative lg:order-2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white p-4">
                  {/* Irrigation Management Mockup */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Water Usage</h4>
                        <p className="text-xs text-gray-500">Last 7 days</p>
                      </div>
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        ET-Based
                      </div>
                    </div>

                    {/* Water bars chart */}
                    <div className="flex-1 flex items-end gap-2 mb-4">
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-blue-400 rounded-t" style={{height: '60%'}}></div>
                        <span className="text-xs text-gray-600">Mon</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-blue-400 rounded-t" style={{height: '80%'}}></div>
                        <span className="text-xs text-gray-600">Tue</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-blue-400 rounded-t" style={{height: '45%'}}></div>
                        <span className="text-xs text-gray-600">Wed</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-blue-400 rounded-t" style={{height: '70%'}}></div>
                        <span className="text-xs text-gray-600">Thu</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-cyan-500 rounded-t" style={{height: '100%'}}></div>
                        <span className="text-xs text-gray-600 font-semibold">Fri</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-blue-300 rounded-t opacity-40" style={{height: '55%'}}></div>
                        <span className="text-xs text-gray-400">Sat</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-blue-300 rounded-t opacity-40" style={{height: '50%'}}></div>
                        <span className="text-xs text-gray-400">Sun</span>
                      </div>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <Droplet className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">2,450</p>
                        <p className="text-xs text-gray-500">Gallons</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <Thermometer className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">0.24"</p>
                        <p className="text-xs text-gray-500">ET Today</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">92%</p>
                        <p className="text-xs text-gray-500">Efficiency</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl -z-10"></div>
              </div>
            </div>

            {/* Feature 3 - Analytics Dashboard (Image Left, Text Right) */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Mockup/Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white p-4">
                  {/* Analytics Dashboard Mockup */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 flex flex-col">
                    {/* Header */}
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-900">Harvest Quality Metrics</h4>
                      <p className="text-xs text-gray-500">2024 Season • 4 Blocks</p>
                    </div>

                    {/* Three metric cards */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-purple-500">
                        <p className="text-xs text-gray-500 mb-1">Avg Brix</p>
                        <p className="text-2xl font-bold text-purple-600">24.2°</p>
                        <p className="text-xs text-green-600 font-semibold mt-1">↑ 2.1</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-pink-500">
                        <p className="text-xs text-gray-500 mb-1">Avg pH</p>
                        <p className="text-2xl font-bold text-pink-600">3.45</p>
                        <p className="text-xs text-gray-500 font-semibold mt-1">↓ 0.05</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-violet-500">
                        <p className="text-xs text-gray-500 mb-1">TA g/L</p>
                        <p className="text-2xl font-bold text-violet-600">6.8</p>
                        <p className="text-xs text-green-600 font-semibold mt-1">↑ 0.3</p>
                      </div>
                    </div>

                    {/* Mini line chart */}
                    <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-end justify-between h-full gap-1">
                        <div className="flex-1 flex flex-col justify-end">
                          <div className="bg-purple-200 rounded-t" style={{height: '45%'}}></div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <div className="bg-purple-300 rounded-t" style={{height: '60%'}}></div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <div className="bg-purple-400 rounded-t" style={{height: '55%'}}></div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <div className="bg-purple-400 rounded-t" style={{height: '70%'}}></div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <div className="bg-purple-500 rounded-t" style={{height: '85%'}}></div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <div className="bg-purple-500 rounded-t" style={{height: '90%'}}></div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <div className="bg-purple-600 rounded-t" style={{height: '100%'}}></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Week 1</span>
                        <span>Week 7</span>
                      </div>
                    </div>

                    {/* Block comparison */}
                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg p-2 text-center">
                        <p className="text-xs text-purple-700 font-semibold">North Block</p>
                        <p className="text-sm font-bold text-purple-900">Best</p>
                      </div>
                      <div className="flex-1 bg-gradient-to-r from-pink-100 to-pink-200 rounded-lg p-2 text-center">
                        <p className="text-xs text-pink-700 font-semibold">East Block</p>
                        <p className="text-sm font-bold text-pink-900">Good</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl -z-10"></div>
              </div>

              {/* Text Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Data Analytics
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Visualize harvest quality data
                </h3>
                <p className="text-lg text-white/90 mb-6 leading-relaxed">
                  Track brix, pH, and acidity from field samples with visual analytics. Compare harvest quality across blocks and years to make data-driven decisions about your vineyard.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-lg"
                >
                  Explore Analytics
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Satellite Monitoring Feature Spotlight */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden py-16 sm:py-24 lg:py-32">
        {/* Decorative stars/satellites - Dense starfield */}
        <div className="absolute inset-0 opacity-20">
          {/* Large stars */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-32 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute top-1/2 left-20 w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-2/3 right-16 w-1.5 h-1.5 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '1.8s' }}></div>
          <div className="absolute top-12 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '3.5s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

          {/* Medium and small stars - scattered throughout */}
          <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-32 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/4 right-1/2 w-1 h-1 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
          <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
          <div className="absolute top-16 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute bottom-16 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.2s' }}></div>
          <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          <div className="absolute top-48 left-16 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.8s' }}></div>
          <div className="absolute bottom-48 right-12 w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '1.4s' }}></div>
          <div className="absolute bottom-12 right-1/2 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
          <div className="absolute top-1/2 right-24 w-1 h-1 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '2.1s' }}></div>

          {/* Additional dense star layer */}
          <div className="absolute top-24 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          <div className="absolute top-36 right-1/3 w-1 h-1 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '1.1s' }}></div>
          <div className="absolute bottom-24 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.7s' }}></div>
          <div className="absolute bottom-36 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.9s' }}></div>
          <div className="absolute top-28 left-16 w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '3.2s' }}></div>
          <div className="absolute top-44 right-16 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.7s' }}></div>
          <div className="absolute bottom-28 left-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.4s' }}></div>
          <div className="absolute bottom-44 right-20 w-1 h-1 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '1.6s' }}></div>
          <div className="absolute top-1/3 left-24 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '3.1s' }}></div>
          <div className="absolute top-2/3 right-24 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute bottom-1/3 left-28 w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '2.9s' }}></div>
          <div className="absolute bottom-2/3 right-28 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.3s' }}></div>
          <div className="absolute top-1/4 left-32 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '3.3s' }}></div>
          <div className="absolute top-3/4 right-32 w-1 h-1 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="absolute bottom-1/4 left-36 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.6s' }}></div>
          <div className="absolute bottom-3/4 right-36 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.7s' }}></div>

          {/* Extra scattered stars for density */}
          <div className="absolute top-14 left-1/4 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
          <div className="absolute top-52 right-3/4 w-0.5 h-0.5 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '2.3s' }}></div>
          <div className="absolute bottom-14 left-3/4 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '3.4s' }}></div>
          <div className="absolute bottom-52 right-1/4 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.0s' }}></div>
          <div className="absolute top-1/3 left-12 w-0.5 h-0.5 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '2.0s' }}></div>
          <div className="absolute top-2/3 right-12 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '3.6s' }}></div>
          <div className="absolute bottom-1/3 left-40 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-2/3 right-40 w-0.5 h-0.5 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
          <div className="absolute top-10 left-1/2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-56 right-1/2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '3.0s' }}></div>
          <div className="absolute bottom-10 left-2/3 w-0.5 h-0.5 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute bottom-56 right-2/3 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.8s' }}></div>
          <div className="absolute top-1/2 left-8 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
          <div className="absolute top-1/2 right-8 w-0.5 h-0.5 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '3.7s' }}></div>
          <div className="absolute top-60 left-44 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute bottom-60 right-44 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '2.2s' }}></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-2 mb-4 border border-blue-400/30">
              <Satellite className="w-5 h-5 text-blue-300" />
              <span className="text-sm font-bold text-blue-200">Powered by Sentinel-2 & OpenET Satellites</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white px-4 sm:px-0 mb-6">
              Monitor your vineyards health from SPACE
            </h2>
            <p className="text-base sm:text-lg text-blue-100 px-4 sm:px-0">
              Get unprecedented visibility into your vineyard's performance with satellite-based monitoring. Track NDVI (Normalized Difference Vegetation Index) for vegetation health and evapotranspiration (ET) data to optimize irrigation—all from space.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">NDVI Tracking</h3>
              <p className="text-sm text-blue-100">
                10m resolution vegetation health data captured every 5 days to monitor vine vigor and detect stress early.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-4">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">ET Data</h3>
              <p className="text-sm text-blue-100">
                Daily evapotranspiration measurements from satellite data help optimize irrigation scheduling and water usage.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Historical Trends</h3>
              <p className="text-sm text-blue-100">
                Compare vegetation vigor and water use across months and years to identify patterns and optimize management.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mb-4">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Early Detection</h3>
              <p className="text-sm text-blue-100">
                Identify vine stress, water deficiency, or disease pressure before visible symptoms appear in the field.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon - Production & Sales - Redesigned */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 text-sm font-bold text-amber-800 mb-4 shadow-sm border border-amber-200">
              <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Coming 2025-2026
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-4 sm:px-0">
              From vineyard to bottle to customer
            </p>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-4 sm:px-0">
              We're expanding beyond vineyard operations to give you complete control of your wine business—from crush to customer delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="group relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-400"></div>
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Droplet className="w-7 h-7 text-amber-600" strokeWidth={1.5} />
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                  Q4 2025
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Winery Production</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Track crush, fermentation, barrel management, and bottling operations. Manage lot numbers, blending recipes, and aging schedules with full traceability.</p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-400"></div>
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-7 h-7 text-amber-600" strokeWidth={1.5} />
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                  Q4 2025
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Inventory Management</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Comprehensive inventory tracking for grapes, bulk wine, bottled products, and winemaking supplies. Automated stock alerts and batch tracking.</p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-400"></div>
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-7 h-7 text-amber-600" strokeWidth={1.5} />
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                  Q2 2026
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sales & Distribution</h3>
              <p className="text-sm text-gray-600 leading-relaxed">CRM for wine clubs and wholesale accounts, order management, invoicing, and sales analytics. Streamline your tasting room and distribution operations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-vine-green-600 via-teal-600 to-emerald-600 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sprout className="w-4 h-4" />
              Join 1,000+ vineyard planners
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight px-4 sm:px-0">
              Start building a vineyard now
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-white/90 px-4 sm:px-0">
              Plan your vineyard, see if it works financially, then turn it into a real operation powered by satellite data, field monitoring, and team management tools.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0">
              <Link
                to="/signup"
                className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-vine-green-700 shadow-2xl hover:bg-gray-50 transition-all hover:scale-105"
              >
                Start Planning Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/30 px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all"
              >
                Explore Features
              </Link>
            </div>

            {/* Already have account link */}
            <div className="mt-6">
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 text-base font-medium text-white/80 hover:text-white transition-colors"
              >
                Already have an account? <span className="underline underline-offset-4">Sign In</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-5 h-5 text-teal-200" />
                  <span className="text-sm font-medium">100% Free Core Tools</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-5 h-5 text-teal-200" />
                  <span className="text-sm font-medium">No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-5 h-5 text-teal-200" />
                  <span className="text-sm font-medium">Start in Under 2 Minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProcessStep({ number, title, description }) {
  return (
    <div className="group flex gap-4 sm:gap-6 bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all">
      <div className="flex-shrink-0">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-vine-green-500 text-lg sm:text-xl font-bold text-white shadow-md group-hover:scale-110 transition-transform">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{title}</h3>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function OutputCard({ icon: Icon, title, description, stats }) {
  return (
    <div className="group bg-white/95 backdrop-blur rounded-2xl border-2 border-white/50 p-6 sm:p-8 hover:bg-white hover:shadow-2xl transition-all hover:scale-105">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-vine-green-500 mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6">{description}</p>
      <div className="space-y-2 sm:space-y-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
            <span className="text-gray-700 font-medium">{stat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}