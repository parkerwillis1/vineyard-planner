import { Link } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
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
  Satellite,
  ArrowRight
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
                      trellisag.com/planner
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
              <span className="text-sm font-semibold text-white">Financial Planner</span>
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

      {/* From Concept to Wine - Interactive Tabs */}
      <JourneySection />

      {/* Scroll-Highlight Statement Section */}
      <section className="relative bg-gray-50 py-24 sm:py-32 lg:py-40 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-0 w-64 h-64 bg-vine-green-100 rounded-full opacity-40 blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-64 h-64 bg-teal-100 rounded-full opacity-40 blur-3xl"></div>

        <div className="relative mx-auto max-w-5xl px-6">
          <div className="text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Vineyard management is built on tradition.
            </h2>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              But that doesn't mean your tools need to be.
            </h2>

            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-relaxed max-w-4xl mx-auto pt-8">
              <ScrollHighlightText>
                Trellis streamlines vineyard and winery operations, helping you grow exceptional grapes and craft outstanding wine. Acting as an extension of your team, we automate repetitive tasks and enable faster decisions through real-time insights. Trellis connects your entire process — planning, growing, and producing wine — in one seamless platform.
              </ScrollHighlightText>
            </p>

            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold pt-4">
              <ScrollHighlightText>
                Welcome to the future of viticulture.
              </ScrollHighlightText>
            </p>

            <div className="pt-8">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors text-lg"
              >
                See how we can help
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video/Demo Section Placeholder */}
      <section className="bg-gray-900 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection className="text-center mb-12">
            <p className="text-sm font-semibold text-teal-400 uppercase tracking-wide mb-3">
              See It In Action
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              <AnimatedText>Watch how Trellis works</AnimatedText>
            </h2>
            <AnimatedSection delay={300}>
              <p className="text-lg text-gray-400 max-w-xl mx-auto">
                A quick walkthrough of the planning tools, field mapping, and operations management.
              </p>
            </AnimatedSection>
          </AnimatedSection>

          {/* Video placeholder */}
          <div className="relative aspect-video bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-vine-green-600 flex items-center justify-center mb-4 cursor-pointer hover:bg-vine-green-500 transition-colors shadow-lg">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-gray-400 text-sm">Product Demo Coming Soon</p>
            </div>
            {/* Decorative screenshot overlay */}
            <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600/50"></div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-vine-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-vine-green-500 transition-colors"
            >
              Try It Free
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Growers Choose Trellis */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              <AnimatedText>Why growers choose</AnimatedText><br />
              <AnimatedText delay={400} className="text-vine-green-600">Trellis.</AnimatedText>
            </h2>
            <AnimatedSection delay={600}>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We're not another generic farm platform. Trellis is purpose-built for vineyards and wineries—with modern tools at a price that makes sense.
              </p>
            </AnimatedSection>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatedSection delay={100}>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-full hover:shadow-lg hover:border-vine-green-200 transition-all">
                <div className="w-10 h-10 rounded-lg bg-vine-green-100 flex items-center justify-center mb-4">
                  <Sprout className="w-5 h-5 text-vine-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Vineyard-Specific</h3>
                <p className="text-sm text-gray-600">
                  Built exclusively for grape growers, not generic farm software trying to do everything poorly.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-full hover:shadow-lg hover:border-blue-200 transition-all">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Modern & Intuitive</h3>
                <p className="text-sm text-gray-600">
                  Clean interface you can learn in minutes—not legacy software requiring weeks of training.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-full hover:shadow-lg hover:border-emerald-200 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Actually Affordable</h3>
                <p className="text-sm text-gray-600">
                  Start free, then $29-79/mo. Not the $500+/month enterprise pricing you'll find elsewhere.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-full hover:shadow-lg hover:border-amber-200 transition-all">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No Lock-in</h3>
                <p className="text-sm text-gray-600">
                  Cancel anytime, export your data anytime. No annual contracts or hostage situations.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Satellite Monitoring Feature */}
      <section className="bg-gradient-to-br from-[#1a2844] to-[#141d30] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side - Content */}
            <AnimatedSection>
              <p className="text-sm font-semibold text-teal-400 uppercase tracking-wide mb-3">
                Satellite Monitoring
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
                See what's happening across every acre
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Trellis integrates Sentinel-2 satellite imagery and OpenET data to give you a bird's-eye view of your vineyard's health—updated every 5 days, no hardware required.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">NDVI Vegetation Index</h3>
                    <p className="text-sm text-gray-400">10-meter resolution maps showing vine vigor and health variations across your blocks.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Droplet className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Evapotranspiration Data</h3>
                    <p className="text-sm text-gray-400">Daily ET measurements to optimize irrigation scheduling and reduce water waste.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Historical Comparisons</h3>
                    <p className="text-sm text-gray-400">Track changes over time to spot trends and catch problems before they spread.</p>
                  </div>
                </div>
              </div>

              <Link
                to="/products/operations"
                className="inline-flex items-center gap-2 text-teal-400 font-semibold hover:text-teal-300 transition-colors"
              >
                Learn more about satellite features
                <ArrowRight className="w-4 h-4" />
              </Link>
            </AnimatedSection>

            {/* Right side - NDVI Image */}
            <AnimatedSection delay={200}>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img
                    src="/NDVI_Example.png"
                    alt="NDVI satellite imagery showing vineyard vegetation health"
                    className="w-full h-auto"
                  />
                </div>
                {/* Caption */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Healthy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Moderate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Stressed</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Coming Soon - Production & Sales - Redesigned */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 text-sm font-bold text-amber-800 mb-4 shadow-sm border border-amber-200">
              <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Coming 2025-2026
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-4 sm:px-0">
              <AnimatedText>From vineyard to bottle to customer</AnimatedText>
            </p>
            <AnimatedSection delay={300}>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-4 sm:px-0">
                We're expanding beyond vineyard operations to give you complete control of your wine business—from crush to customer delivery.
              </p>
            </AnimatedSection>
          </AnimatedSection>

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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Wine Production</h3>
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
              Join 1,000+ vineyard growers
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

function JourneySection() {
  const [activeTab, setActiveTab] = useState(0);

  const tools = [
    {
      id: 0,
      label: "Financial Planner",
      icon: TrendingUp,
      status: "Free Forever",
      statusColor: "bg-green-100 text-green-700",
      title: "Financial Planner",
      subtitle: "Plan your vineyard before you plant",
      description: "Design your vineyard layout, model establishment costs, and create 10-30 year financial projections. Compare bulk grape sales vs. bottled wine strategies, evaluate USDA FSA loans vs. commercial financing, and see your break-even timeline before investing.",
      features: [
        { name: "Vineyard Layout Calculator", desc: "Spacing, vines, materials" },
        { name: "10-30 Year Projections", desc: "Revenue, expenses, cash flow" },
        { name: "Loan Comparison Tools", desc: "USDA FSA vs. commercial" },
        { name: "Business Plan Export", desc: "Bank-ready PDF reports" },
      ],
      color: "vine-green",
      mockup: (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">Financial Planner — 10-Year Projections</span>
          </div>
          <div className="p-5">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">Year 7</p>
                <p className="text-xs text-gray-600 font-medium">Break Even</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">$1.09M</p>
                <p className="text-xs text-gray-600 font-medium">10-Yr Revenue</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">210%</p>
                <p className="text-xs text-gray-600 font-medium">Projected ROI</p>
              </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900">Annual Cash Flow</span>
                <span className="text-xs text-green-600 font-medium">Profitable Year 7+</span>
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {[-45, -35, -20, 15, 40, 65, 85, 95, 100, 98].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className={`w-full rounded-t transition-all ${h < 0 ? 'bg-red-400' : h < 50 ? 'bg-yellow-400' : 'bg-green-500'}`}
                      style={{height: `${Math.abs(h)}%`}}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Year 1</span>
                <span>Year 5</span>
                <span>Year 10</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 1,
      label: "Vineyard Operations",
      icon: Sprout,
      status: "Available Now",
      statusColor: "bg-teal-100 text-teal-700",
      title: "Vineyard Operations",
      subtitle: "Manage your vineyard day-to-day",
      description: "Map your fields with satellite imagery, monitor vine health with NDVI data updated every 5 days, assign tasks to team members, log spray and irrigation events, track harvest quality, and connect flow meters for automatic documentation.",
      features: [
        { name: "Satellite NDVI Monitoring", desc: "10m resolution, 5-day updates" },
        { name: "Block & Field Management", desc: "Draw boundaries, track varieties" },
        { name: "Task & Team Management", desc: "Assign, track, complete" },
        { name: "Hardware Integration", desc: "Flow meters, controllers" },
      ],
      color: "teal",
      mockup: (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">Vineyard Operations — Dashboard</span>
          </div>
          <div className="p-5">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-3 text-center border border-teal-200">
                <p className="text-xl font-bold text-teal-600">12</p>
                <p className="text-xs text-gray-600 font-medium">Blocks</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center border border-blue-200">
                <p className="text-xl font-bold text-blue-600">0.72</p>
                <p className="text-xs text-gray-600 font-medium">Avg NDVI</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center border border-green-200">
                <p className="text-xl font-bold text-green-600">3</p>
                <p className="text-xs text-gray-600 font-medium">Tasks</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center border border-purple-200">
                <p className="text-xl font-bold text-purple-600">5</p>
                <p className="text-xs text-gray-600 font-medium">Team</p>
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-900">Today's Tasks</h4>
                <span className="text-xs text-teal-600 font-semibold">View All</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                    <Droplet className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Irrigate Block A</p>
                    <p className="text-xs text-gray-500">2 hrs @ 15 GPM • Assigned to Mike</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                    <Wind className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Spray Sulfur - PM Prevention</p>
                    <p className="text-xs text-gray-500">All blocks • Assigned to Sarah</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Bar */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-3 flex items-center justify-between border border-sky-200">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-medium text-gray-700">78°F</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-medium text-gray-700">8 mph NW</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-medium text-gray-700">45%</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      label: "Wine Production",
      icon: Droplet,
      status: "Coming Q2 2025",
      statusColor: "bg-amber-100 text-amber-700",
      title: "Wine Production",
      subtitle: "Track from crush to bottle",
      description: "Manage your entire winemaking process from grape intake through bottling. Track fermentation with real-time sensor data, manage barrel aging and topping schedules, create blending recipes, and maintain full lot traceability for compliance.",
      features: [
        { name: "Harvest Intake & Crush", desc: "Brix, pH, weights, lot creation" },
        { name: "Fermentation Tracking", desc: "Real-time sensors, punch-downs" },
        { name: "Barrel & Tank Management", desc: "Aging, topping, racking" },
        { name: "Blending & Bottling", desc: "Recipes, labels, lot traceability" },
      ],
      color: "purple",
      mockup: (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">Wine Production — Fermentation</span>
          </div>
          <div className="p-5">
            {/* Active Fermentations Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-900">Active Fermentations</h4>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">3 lots</span>
            </div>

            {/* Main Fermentation Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 mb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900">Cabernet Sauvignon - Lot 24A</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Day 8</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-lg p-2 border border-purple-200">
                  <p className="text-xl font-bold text-purple-600">18.2°</p>
                  <p className="text-xs text-gray-500">Brix</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-purple-200">
                  <p className="text-xl font-bold text-purple-600">72°F</p>
                  <p className="text-xs text-gray-500">Temp</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-purple-200">
                  <p className="text-xl font-bold text-purple-600">3.52</p>
                  <p className="text-xs text-gray-500">pH</p>
                </div>
              </div>
            </div>

            {/* Secondary Fermentation */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">Merlot - Lot 24B</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Day 3</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '35%'}}></div>
                </div>
                <span className="text-sm font-semibold text-gray-700">22.4° Brix</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button className="flex-1 bg-purple-600 text-white text-xs font-semibold py-2 px-3 rounded-lg">Log Punch-down</button>
              <button className="flex-1 bg-gray-200 text-gray-700 text-xs font-semibold py-2 px-3 rounded-lg">Add Reading</button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeTool = tools[activeTab];
  const ActiveIcon = activeTool.icon;

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url('/topo.png')`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }}></div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <AnimatedSection className="text-center mb-12">
          <p className="text-sm font-semibold text-vine-green-600 uppercase tracking-wide mb-3">
            Three Powerful Tools
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            <AnimatedText>From concept to wine</AnimatedText>
          </h2>
          <AnimatedSection delay={300}>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Plan your vineyard, manage daily operations, and track wine production—all in one integrated platform.
            </p>
          </AnimatedSection>
        </AnimatedSection>

        {/* Tool Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-2xl p-2 shadow-lg border border-gray-200 gap-2">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(index)}
                  className={`
                    relative px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                    ${activeTab === index
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tool.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Text Content */}
          <div className="order-2 lg:order-1">
            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${activeTool.statusColor}`}>
                {activeTool.status}
              </span>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3 mb-2">
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${activeTab === 0 ? 'bg-vine-green-100' : ''}
                ${activeTab === 1 ? 'bg-teal-100' : ''}
                ${activeTab === 2 ? 'bg-purple-100' : ''}
              `}>
                <ActiveIcon className={`w-5 h-5 ${activeTab === 0 ? 'text-vine-green-600' : ''} ${activeTab === 1 ? 'text-teal-600' : ''} ${activeTab === 2 ? 'text-purple-600' : ''}`} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {activeTool.title}
              </h3>
            </div>

            <p className="text-gray-500 text-sm mb-4">{activeTool.subtitle}</p>

            <p className="text-gray-600 text-base mb-8 leading-relaxed">
              {activeTool.description}
            </p>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {activeTool.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${activeTab === 0 ? 'text-vine-green-500' : ''} ${activeTab === 1 ? 'text-teal-500' : ''} ${activeTab === 2 ? 'text-purple-500' : ''}`} />
                  <div>
                    <p className="font-semibold text-gray-900">{feature.name}</p>
                    <p className="text-sm text-gray-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              to={activeTab === 2 ? "/products" : "/signup"}
              className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors shadow-md
                ${activeTab === 0 ? 'bg-vine-green-600 text-white hover:bg-vine-green-500' : ''}
                ${activeTab === 1 ? 'bg-teal-600 text-white hover:bg-teal-500' : ''}
                ${activeTab === 2 ? 'bg-purple-600 text-white hover:bg-purple-500' : ''}
              `}
            >
              {activeTab === 2 ? 'Learn More' : 'Get Started Free'}
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Mockup */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* Decorative background */}
              <div className={`
                absolute -inset-4 rounded-3xl opacity-20 blur-2xl
                ${activeTab === 0 ? 'bg-vine-green-400' : ''}
                ${activeTab === 1 ? 'bg-teal-400' : ''}
                ${activeTab === 2 ? 'bg-purple-400' : ''}
              `}></div>

              {/* Mockup content */}
              <div className="relative">
                {activeTool.mockup}
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mt-12">
          <div className="flex items-center gap-2">
            {tools.map((tool, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${activeTab === index
                    ? `w-8 ${activeTab === 0 ? 'bg-vine-green-600' : ''} ${activeTab === 1 ? 'bg-teal-600' : ''} ${activeTab === 2 ? 'bg-purple-600' : ''}`
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Scroll Animation Hook
function useScrollAnimation(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, isVisible];
}

// Feature Card with Hover Popup
function FeatureCardWithPopup({
  icon: Icon,
  iconBg,
  iconColor,
  hoverBorder,
  title,
  description,
  popupFeatures,
  link,
  linkText
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card */}
      <div className={`bg-gray-50 rounded-xl p-6 border border-gray-200 h-full transition-all cursor-pointer ${hoverBorder} ${isHovered ? 'shadow-lg border-opacity-100' : ''}`}>
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-4`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {/* Popup */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 z-50 transition-all duration-200 ${
          isHovered
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"></div>

        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>

        <ul className="space-y-2 mb-4">
          {popupFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-vine-green-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          to={link}
          className="inline-flex items-center gap-1 text-sm font-semibold text-vine-green-600 hover:text-vine-green-700 transition-colors"
        >
          {linkText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Animated Text Component - Words fade in one by one
function AnimatedText({ children, className = "", delay = 0, as: Component = "span" }) {
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.2 });

  const words = children.split(' ');

  return (
    <Component ref={ref} className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          className="inline-block overflow-hidden pb-2"
        >
          <span
            className={`inline-block transition-all duration-500 ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-full opacity-0'
            }`}
            style={{
              transitionDelay: isVisible ? `${delay + index * 50}ms` : '0ms'
            }}
          >
            {word}
          </span>
          {index < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </Component>
  );
}

// Animated Section - Fades and slides up on scroll
function AnimatedSection({ children, className = "", delay = 0 }) {
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-8 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Scroll-Highlighted Text - Words highlight progressively as you scroll
function ScrollHighlightText({ children, className = "" }) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress: 0 when section enters, 1 when section leaves
      // Start highlighting when section is 70% from top, complete when 30% from top
      const startPoint = windowHeight * 0.7;
      const endPoint = windowHeight * 0.3;

      if (rect.top > startPoint) {
        setProgress(0);
      } else if (rect.top < endPoint) {
        setProgress(1);
      } else {
        const totalDistance = startPoint - endPoint;
        const currentDistance = startPoint - rect.top;
        setProgress(currentDistance / totalDistance);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const words = children.split(' ');
  const totalWords = words.length;

  return (
    <span ref={containerRef} className={className}>
      {words.map((word, index) => {
        // Calculate if this word should be highlighted based on progress
        const wordProgress = index / totalWords;
        const isHighlighted = progress > wordProgress;

        return (
          <span
            key={index}
            className={`transition-colors duration-200 ${
              isHighlighted
                ? 'text-gray-900'
                : 'text-gray-300'
            }`}
          >
            {word}
            {index < words.length - 1 && ' '}
          </span>
        );
      })}
    </span>
  );
}

// Animated Counter - Numbers count up on scroll
function AnimatedCounter({ value, suffix = "", prefix = "", className = "" }) {
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.3 });
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;

  useEffect(() => {
    if (isVisible && numericValue > 0) {
      const duration = 1500;
      const steps = 30;
      const increment = numericValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setCount(numericValue);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isVisible, numericValue]);

  return (
    <span ref={ref} className={className}>
      {prefix}{isVisible ? count : 0}{suffix}
    </span>
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