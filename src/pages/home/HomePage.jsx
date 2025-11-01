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
  Sparkles
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
              Plan.Grow.Prosper.
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-6 sm:leading-8 text-white font-bold px-4 sm:px-0" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
              Build detailed financial projections, design your vineyard layout, and model different scenarios—all in one place. No spreadsheets required.
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

      {/* Planning Tools Section */}
      <section className="relative bg-gradient-to-br from-white via-teal-50/30 to-vine-green-50/40 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-vine-green-200/20 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-100 to-vine-green-100 px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-teal-700">Financial Planning</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-4 sm:px-0">
              Build your vineyard business plan
            </p>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-4 sm:px-0">
              Create professional financial models that lenders and investors will respect.
              Our tools handle the complex calculations so you can focus on your vision.
            </p>
          </div>

          <div className="mx-auto mt-12 sm:mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              <FeatureCard
                icon={LayoutGrid}
                iconColor="teal"
                title="Design Your Vineyard Layout"
                description="Configure vine spacing from 4×8' to 8×12', set your plot shape and dimensions, choose row orientation for optimal sun exposure."
                details={[
                  "Auto-calculate total vines needed",
                  "Determine trellis materials required",
                  "Plan irrigation system components",
                  "Estimate fencing perimeter costs"
                ]}
              />

              <FeatureCard
                icon={TrendingUp}
                iconColor="teal"
                title="Model Your Finances"
                description="Build detailed 10-30 year financial projections with year-by-year revenue, costs, and cash flow analysis."
                details={[
                  "Choose bottled wine or bulk grape sales",
                  "Set pricing and yield assumptions",
                  "Track establishment and operating costs",
                  "Calculate break-even timeline and ROI"
                ]}
              />

              <FeatureCard
                icon={DollarSign}
                iconColor="teal"
                title="Plan Your Financing"
                description="Model USDA FSA loans, commercial bank loans, and equipment financing with accurate payment calculations."
                details={[
                  "Compare multiple loan scenarios",
                  "Calculate LTC and LTV ratios",
                  "Track monthly debt service payments",
                  "Identify equity gaps and funding needs"
                ]}
              />

              <FeatureCard
                icon={BarChart3}
                iconColor="teal"
                title="Analyze Different Scenarios"
                description="Test various strategies by adjusting key variables and instantly seeing how they impact profitability."
                details={[
                  "Compare price points and their effects",
                  "Model different acreage sizes",
                  "Test various cost assumptions",
                  "Evaluate financing structures"
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 mb-4">
              <CheckCircle2 className="w-4 h-4 text-vine-green-600" />
              <span className="text-sm font-semibold text-gray-700">Simple Process</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-4 sm:px-0">
              From idea to business plan in minutes
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="space-y-4 sm:space-y-6">
              <ProcessStep
                number="1"
                title="Design Your Vineyard"
                description="Start by configuring your vineyard layout—vine spacing, plot dimensions, and row orientation. The calculator automatically determines materials needed."
              />
              <ProcessStep
                number="2"
                title="Input Your Financials"
                description="Enter your acreage, land costs, and choose your sales strategy (bottled wine or bulk grapes). Customize establishment and operating costs."
              />
              <ProcessStep
                number="3"
                title="Add Financing Details"
                description="Model your equipment purchases and loans with accurate terms. The system calculates payments and tracks your debt service."
              />
              <ProcessStep
                number="4"
                title="Review & Refine"
                description="See your complete 10-year projection with break-even analysis, ROI calculations, and detailed cost breakdowns. Adjust assumptions until your model is perfect."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Example Outputs Section */}
      <section className="relative bg-gradient-to-br from-teal-600 to-vine-green-600 overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 mb-4">
              <FileText className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Professional Output</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white px-4 sm:px-0">
              Generate lender-ready reports
            </p>
            <p className="mt-4 text-base sm:text-lg text-teal-50 px-4 sm:px-0">
              Export polished PDF reports that impress investors and financial institutions
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <OutputCard
              icon={DollarSign}
              title="Year 0 Investment"
              description="Complete breakdown of establishment costs with visual charts and per-acre analysis."
              stats={["Land & Improvements", "Setup & Materials", "Financing Summary"]}
            />
            <OutputCard
              icon={TrendingUp}
              title="10-Year Projections"
              description="Year-by-year financial details with revenue, costs, and cumulative cash flow tracking."
              stats={["Break-Even Timeline", "ROI Calculation", "Profitability Charts"]}
            />
            <OutputCard
              icon={BarChart3}
              title="Detailed Analysis"
              description="Deep dive into costs, production, lender ratios, and bottle economics."
              stats={["Cost Breakdowns", "LTC/LTV Ratios", "Sensitivity Analysis"]}
            />
          </div>
        </div>
      </section>

      {/* Coming Soon - Operations Section */}
      <section className="relative bg-gradient-to-b from-white to-gray-50 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 px-4 py-2 text-sm font-bold text-yellow-800 mb-4 shadow-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Coming 2026
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-100 to-vine-green-100 px-4 py-1.5 mb-4">
              <Sprout className="w-4 h-4 text-vine-green-600" />
              <span className="text-sm font-semibold text-vine-green-700">Vineyard Operations</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-4 sm:px-0">
              Manage your vineyard in real-time
            </p>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-4 sm:px-0">
              Once your vineyard is planted, seamlessly transition from planning to operations with tools designed for day-to-day management.
              Track activities, monitor conditions, and make data-driven decisions across every block.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16">
            <FutureFeature
              icon={MapPin}
              iconColor="teal"
              title="Interactive Mapping"
              description="Visualize your vineyard with satellite imagery overlay, custom block boundaries, GPS tracking for equipment, and precision sensor placement. Click any block to view detailed information and historical data."
            />
            <FutureFeature
              icon={Thermometer}
              iconColor="teal"
              title="Environmental Monitoring"
              description="Track real-time data from IoT sensors measuring soil pH, nitrogen content, moisture levels, and temperature across your blocks. Receive alerts when conditions fall outside optimal ranges."
            />
            <FutureFeature
              icon={Calendar}
              iconColor="teal"
              title="Operations Scheduling"
              description="Plan and track spray schedules, pruning windows, harvest timing, and crew activities. Maintain compliance documents and access historical records for informed decision-making."
            />
          </div>

          {/* Additional operations features */}
          <div className="mx-auto max-w-4xl mt-12 sm:mt-16 px-4 sm:px-0">
            <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-vine-green-50 p-6 sm:p-8 shadow-sm border border-teal-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                Complete Operational Visibility
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Task Management</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Assign tasks to crew members, track completion, and log labor hours by block</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-vine-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Weather Integration</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">7-day forecasts with frost warnings, heat advisories, and optimal spray windows</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Harvest Tracking</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Log brix levels, tonnage by block, and real-time harvest progress with mobile app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-teal-100 p-2">
                    <CheckCircle2 className="w-5 h-5 text-vine-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Compliance Reports</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Automatically generate pesticide use reports, organic certification docs, and audit trails</p>
                  </div>
                </div>
              </div>
            </div>
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
              Ready to start planning?
            </h2>
            <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-teal-50 px-4 sm:px-0">
              Our free planner gives you everything you need to create a professional vineyard business plan.
              No credit card required. Start in minutes.
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

function FutureFeature({ icon: Icon, iconColor, title, description }) {
  const iconColorClasses = {
    'teal': 'bg-gradient-to-br from-teal-100 to-teal-200 text-teal-600',
    'vine-green': 'bg-gradient-to-br from-vine-green-100 to-vine-green-200 text-vine-green-600'
  };

  return (
    <div className="group bg-white rounded-2xl border-2 border-gray-200 p-6 sm:p-8 hover:border-teal-300 hover:shadow-xl transition-all">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 sm:mb-5 ${iconColorClasses[iconColor]} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}