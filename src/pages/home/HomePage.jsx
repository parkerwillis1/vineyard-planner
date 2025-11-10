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
                fetchpriority={index === 0 ? 'high' : 'low'}
              />
            );
          })}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-32 md:py-40 lg:py-48">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
              Plan. Manage. Thrive.
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
                to="/docs"
                className="text-sm sm:text-base font-semibold leading-7 text-white hover:text-vine-green-500"
              >
                View Documentation <span aria-hidden="true">→</span>
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

      {/* Simplified Capabilities Overview Section */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-100 to-vine-green-100 px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-teal-700">Complete Platform</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-4 sm:px-0">
              Everything you need in one place
            </p>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-4 sm:px-0">
              From concept to harvest—comprehensive tools for vineyard planning and operations.
            </p>
          </div>

          <div className="mx-auto mt-12 sm:mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-3">
              {/* Financial Planning */}
              <div className="group relative bg-gradient-to-br from-teal-50 to-vine-green-50 rounded-3xl border-2 border-teal-200 p-8 hover:border-teal-400 hover:shadow-2xl transition-all">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-vine-green-500 mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Financial Planning</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Design your vineyard layout, build 10-30 year projections, and create professional business plans that impress lenders and investors.
                </p>
              </div>

              {/* Vineyard Operations */}
              <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border-2 border-emerald-200 p-8 hover:border-emerald-400 hover:shadow-2xl transition-all">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-6 group-hover:scale-110 transition-transform">
                  <Sprout className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Vineyard Operations</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Map your fields, manage your team, track activities, and monitor vineyard health with satellite data—all in real-time.
                </p>
              </div>

              {/* Analytics & Insights */}
              <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl border-2 border-blue-200 p-8 hover:border-blue-400 hover:shadow-2xl transition-all">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Analytics & Insights</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  View comprehensive analytics, vegetation trends, water usage, harvest quality metrics, and field performance comparisons.
                </p>
              </div>
            </div>

            {/* Learn More Link */}
            <div className="mt-10 text-center">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold text-lg group"
              >
                <span>Explore all features in detail</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Planning Tools Section - Green Background */}
      <section className="relative bg-gradient-to-br from-vine-green-500 to-emerald-600 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 mb-4 border border-white/30">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Financial Planning</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white px-4 sm:px-0">
              Build your vineyard business plan
            </p>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-white/90 px-4 sm:px-0">
              Create professional financial models that lenders and investors will respect.
              Our tools handle the complex calculations so you can focus on your vision.
            </p>
          </div>

          <div className="mx-auto mt-12 sm:mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              <div className="group bg-white/95 backdrop-blur rounded-2xl border-2 border-white/50 p-6 sm:p-8 hover:bg-white hover:shadow-2xl transition-all hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-4 sm:mb-5">
                  <LayoutGrid className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Design Your Vineyard Layout</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Configure vine spacing from 4×8' to 8×12', set your plot shape and dimensions, choose row orientation for optimal sun exposure.</p>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Auto-calculate total vines needed</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Determine trellis materials required</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Plan irrigation system components</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Estimate fencing perimeter costs</span>
                  </li>
                </ul>
              </div>

              <div className="group bg-white/95 backdrop-blur rounded-2xl border-2 border-white/50 p-6 sm:p-8 hover:bg-white hover:shadow-2xl transition-all hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-4 sm:mb-5">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Model Your Finances</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Build detailed 10-30 year financial projections with year-by-year revenue, costs, and cash flow analysis.</p>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Choose bottled wine or bulk grape sales</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Set pricing and yield assumptions</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Track establishment and operating costs</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Calculate break-even timeline and ROI</span>
                  </li>
                </ul>
              </div>

              <div className="group bg-white/95 backdrop-blur rounded-2xl border-2 border-white/50 p-6 sm:p-8 hover:bg-white hover:shadow-2xl transition-all hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-4 sm:mb-5">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Plan Your Financing</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Model USDA FSA loans, commercial bank loans, and equipment financing with accurate payment calculations.</p>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Compare multiple loan scenarios</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Calculate LTC and LTV ratios</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Track monthly debt service payments</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Identify equity gaps and funding needs</span>
                  </li>
                </ul>
              </div>

              <div className="group bg-white/95 backdrop-blur rounded-2xl border-2 border-white/50 p-6 sm:p-8 hover:bg-white hover:shadow-2xl transition-all hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-4 sm:mb-5">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Analyze Different Scenarios</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Test various strategies by adjusting key variables and instantly seeing how they impact profitability.</p>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Compare price points and their effects</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Model different acreage sizes</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Test various cost assumptions</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>Evaluate financing structures</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Redesigned */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        {/* Decorative background patterns - Topography */}
        <div className="absolute inset-0 opacity-30">
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
                      Configure vineyard layout—vine spacing, plot dimensions, and row orientation. Automatically calculate materials, trellis systems, and irrigation needs.
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
                      Create 10-30 year projections with revenue models, cost analysis, and ROI calculations. Model different financing scenarios to find the best path forward.
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

      {/* Vineyard Operations Section - LIVE - Green Background */}
      <section className="relative bg-gradient-to-br from-vine-green-600 to-emerald-700 overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white mb-4 shadow-sm border border-white/30">
              <Sparkles className="w-4 h-4 mr-2" />
              Available Now
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 mb-4 border border-white/30">
              <Sprout className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Vineyard Operations</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white px-4 sm:px-0">
              Manage your vineyard in real-time
            </p>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-white/90 px-4 sm:px-0">
              Once your vineyard is planted, seamlessly transition from planning to operations with tools designed for day-to-day management.
              Track activities, monitor conditions, and make data-driven decisions across every block.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16">
            <FeatureCard
              icon={MapPin}
              iconColor="teal"
              title="Interactive Field Mapping"
              description="Visualize your vineyard with satellite imagery, custom block boundaries, and vegetation health monitoring from space."
              details={[
                "Satellite NDVI vegetation vigor tracking",
                "Draw custom field boundaries on maps",
                "Track field metrics and performance",
                "Historical satellite data trends"
              ]}
            />
            <FeatureCard
              icon={Thermometer}
              iconColor="teal"
              title="Weather & Environment"
              description="Real-time weather data, forecasts, and environmental monitoring to make informed decisions."
              details={[
                "7-day weather forecasts",
                "Evapotranspiration (ET) calculations",
                "Frost and heat warnings",
                "Optimal spray window recommendations"
              ]}
            />
            <FeatureCard
              icon={Calendar}
              iconColor="teal"
              title="Task & Team Management"
              description="Plan operations, assign work to crew members, and track progress across your vineyard."
              details={[
                "Assign tasks to team members",
                "Track task status and completion",
                "Calendar view of all activities",
                "Labor hour tracking by field"
              ]}
            />
          </div>

          {/* Additional operations features */}
          <div className="mx-auto max-w-6xl mt-12 sm:mt-16 px-4 sm:px-0">
            <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-vine-green-50 p-6 sm:p-8 shadow-sm border border-teal-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                Complete Operational Control
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Irrigation Management</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Track water usage, log irrigation events, and calculate water application rates per field</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-vine-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Spray Records</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Document all spray applications with compliance-ready records and safety data sheets</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Harvest Tracking</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Log brix levels, pH, acidity, and tonnage by field for quality documentation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-vine-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Analytics Dashboard</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">View vegetation vigor trends, water usage, yield production, and field performance comparisons</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Equipment & Inventory</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Track equipment maintenance schedules and manage supply inventory levels</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-vine-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Hardware Integration</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Connect IoT devices and sensors for automated data collection and monitoring</p>
                  </div>
                </div>
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
              Monitor vineyard health from space
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

      {/* Coming Soon - Production & Sales */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 text-sm font-bold text-amber-800 mb-4 shadow-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Coming 2025-2026
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-4 sm:px-0">
              From vineyard to bottle to customer
            </p>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-4 sm:px-0">
              We're expanding beyond vineyard operations to give you complete control of your wine business—from crush to customer delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <FutureFeature
              icon={Droplet}
              iconColor="teal"
              title="Winery Production"
              description="Track crush, fermentation, barrel management, and bottling operations. Manage lot numbers, blending recipes, and aging schedules with full traceability."
              comingSoon="Q4 2025"
            />
            <FutureFeature
              icon={Package}
              iconColor="teal"
              title="Inventory Management"
              description="Comprehensive inventory tracking for grapes, bulk wine, bottled products, and winemaking supplies. Automated stock alerts and batch tracking."
              comingSoon="Q4 2025"
            />
            <FutureFeature
              icon={DollarSign}
              iconColor="teal"
              title="Sales & Distribution"
              description="CRM for wine clubs and wholesale accounts, order management, invoicing, and sales analytics. Streamline your tasting room and distribution operations."
              comingSoon="Q2 2026"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-vine-green-600 to-teal-600 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white px-4 sm:px-0">
              Ready to grow your vineyard business?
            </h2>
            <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-teal-50 px-4 sm:px-0">
              Start with our free financial planner, then upgrade to manage your vineyard operations with satellite monitoring, team management, and comprehensive analytics.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4 sm:px-0">
              <Link
                to="/signup"
                className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-teal-700 shadow-xl hover:bg-teal-50 transition-all hover:scale-105"
              >
                Sign Up Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold leading-7 text-white hover:text-teal-100 transition-colors"
              >
                <span className="hidden sm:inline">Already have an account?</span> Sign In
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-teal-100 px-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">Start instantly</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, iconColor, title, description, details }) {
  const iconColorClasses = {
    'teal': 'bg-gradient-to-br from-teal-500 to-teal-600 text-white',
    'vine-green': 'bg-gradient-to-br from-vine-green-500 to-vine-green-600 text-white'
  };

  return (
    <div className="group relative bg-white rounded-2xl border-2 border-gray-200 p-6 sm:p-8 hover:border-teal-300 hover:shadow-xl transition-all">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 sm:mb-5 ${iconColorClasses[iconColor]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{description}</p>
      <ul className="space-y-2 sm:space-y-3">
        {details.map((detail, idx) => (
          <li key={idx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
            <span>{detail}</span>
          </li>
        ))}
      </ul>
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

function FutureFeature({ icon: Icon, iconColor, title, description, comingSoon }) {
  const iconColorClasses = {
    'teal': 'bg-gradient-to-br from-teal-100 to-teal-200 text-teal-600',
    'vine-green': 'bg-gradient-to-br from-vine-green-100 to-vine-green-200 text-vine-green-600'
  };

  return (
    <div className="group bg-white rounded-2xl border-2 border-gray-200 p-6 sm:p-8 hover:border-teal-300 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconColorClasses[iconColor]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {comingSoon && (
          <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full">
            {comingSoon}
          </span>
        )}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}