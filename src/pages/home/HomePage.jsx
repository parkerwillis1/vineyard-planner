import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0);
  
  const images = [
    "/images/Vineyard1.jpg",
    "/images/Vineyard2.jpg",
    "/images/Vineyard3.jpg",
    "/images/Vineyard4.jpg",
  ];

  useEffect(() => {
    // Debug logging
    console.log("Current image index:", currentImage);
    console.log("Current image path:", images[currentImage]);
    
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentImage, images]);

  return (
    <div className="relative">
      {/* Hero Section with Slideshow */}
      <section className="relative overflow-hidden bg-gradient-to-b from-vine-green-50 to-white">
        {/* Background Slideshow */}
        <div className="absolute inset-0 z-0" style={{ minHeight: '500px' }}>
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImage ? 'opacity-70' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'red', // Debug: will show red if image doesn't load
              }}
            >
              {/* Debug overlay */}
              {index === currentImage && (
                <div className="absolute top-4 left-4 bg-black text-white p-2 text-xs z-50">
                  Active Image: {image}
                </div>
              )}
            </div>
          ))}
          {/* Gradient overlay - REDUCED OPACITY FOR TESTING */}
          <div className="absolute inset-0 bg-gradient-to-b from-vine-green-50/50 to-white/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-black sm:text-7xl">
              Plan.Grow.Prosper
            </h1>
            <p className="mt-6 text-lg leading-8 text-black">
              Build detailed financial projections, design your vineyard layout, and model different scenarios—all in one place. No spreadsheets required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/planner"
                className="rounded-md bg-vine-green-500 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-vine-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vine-green-500"
              >
                Open Planner
              </Link>
              <Link
                to="/docs"
                className="text-base font-semibold leading-7 text-gray-900 hover:text-vine-green-500"
              >
                View Documentation <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Slideshow Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentImage 
                  ? 'bg-vine-green-500 w-8' 
                  : 'bg-gray-400 hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Planning Tools Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-vine-green-500">Financial Planning</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Build your vineyard business plan
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Create professional financial models that lenders and investors will respect. 
            Our tools handle the complex calculations so you can focus on your vision.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <FeatureCard
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
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-vine-green-500">Simple Process</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              From idea to business plan in minutes
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="space-y-8">
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
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-vine-green-500">Professional Output</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Generate lender-ready reports
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <OutputCard
            title="Year 0 Investment"
            description="Complete breakdown of establishment costs with visual charts and per-acre analysis."
            stats={["Land & Improvements", "Setup & Materials", "Financing Summary"]}
          />
          <OutputCard
            title="10-Year Projections"
            description="Year-by-year financial details with revenue, costs, and cumulative cash flow tracking."
            stats={["Break-Even Timeline", "ROI Calculation", "Profitability Charts"]}
          />
          <OutputCard
            title="Detailed Analysis"
            description="Deep dive into costs, production, lender ratios, and bottle economics."
            stats={["Cost Breakdowns", "LTC/LTV Ratios", "Sensitivity Analysis"]}
          />
        </div>
      </section>

      {/* Coming Soon - Operations Section */}
      <section className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <div className="inline-flex items-center rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800 mb-4">
              Coming 2026
            </div>
            <h2 className="text-base font-semibold leading-7 text-vine-green-500">Vineyard Operations</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Manage your vineyard in real-time
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Once your vineyard is planted, seamlessly transition from planning to operations with tools designed for day-to-day management.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <FutureFeature
              title="Interactive Mapping"
              description="Visualize your vineyard with satellite imagery, custom block boundaries, and sensor placement overlays."
            />
            <FutureFeature
              title="Soil & Environmental Monitoring"
              description="Track real-time data from IoT sensors measuring pH levels, nitrogen content, moisture, and temperature across your blocks."
            />
            <FutureFeature
              title="Operations Management"
              description="Log spray schedules, maintain compliance documents, track crew activities, and access historical records for informed decision-making."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-vine-green-500">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start planning?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-vine-green-50">
              Our free planner gives you everything you need to create a professional vineyard business plan. 
              No credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/planner"
                className="rounded-md bg-white px-8 py-3 text-base font-semibold text-vine-green-500 shadow-sm hover:bg-vine-green-50"
              >
                Open Planner Now
              </Link>
              <Link
                to="/docs"
                className="text-base font-semibold leading-7 text-white hover:text-vine-green-100"
              >
                Read the Docs <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({title, description, details }) {
  return (
    <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-vine-green-300 transition-colors">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-2">
        {details.map((detail, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
            <span className="text-vine-green-500 font-bold mt-0.5">→</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProcessStep({ number, title, description }) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-vine-green-500 text-xl font-bold text-white">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function OutputCard({ title, description, stats }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-vine-green-300 transition-colors">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-sm text-gray-600 mb-6">{description}</p>
      <div className="space-y-2">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-vine-green-500"></div>
            <span className="text-gray-700">{stat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FutureFeature({ title, description }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-vine-green-300 transition-colors">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}