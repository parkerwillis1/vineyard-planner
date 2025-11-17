import { Link } from "react-router-dom";
import { Lightbulb, ArrowRight, CheckCircle, AlertTriangle, DollarSign, Leaf, TrendingUp, Users, Droplet, Shield } from "lucide-react";

export default function TipsPage() {
  const tipCategories = [
    {
      title: "Financial Planning",
      icon: DollarSign,
      color: "teal",
      tips: [
        {
          type: "do",
          text: "Add 20% contingency to all cost estimates—most vineyard failures stem from cost overruns, not revenue shortfalls."
        },
        {
          type: "do",
          text: "Model conservative yield assumptions: Year 1 = 0%, Year 2 = 25%, Year 3 = 50%, Year 4 = 75%, Year 5+ = 100%."
        },
        {
          type: "dont",
          text: "Don't overpay for land. Your land cost is the biggest upfront expense and won't generate returns for 3-5 years."
        },
        {
          type: "do",
          text: "Secure 25-40% down payment for land acquisition. Most lenders require this for vineyard financing."
        }
      ]
    },
    {
      title: "Vineyard Design",
      icon: Leaf,
      color: "green",
      tips: [
        {
          type: "do",
          text: "Standard spacing for VSP trellis: 6-12 feet between rows, 4-8 feet between vines. This gives 450-1,800 plants per acre."
        },
        {
          type: "do",
          text: "Budget $8,000-$15,000 per acre for VSP trellis materials and installation including posts, wire, anchors, and labor."
        },
        {
          type: "dont",
          text: "Don't underestimate site preparation costs. Factor in soil testing, amendments, grading, and drainage work."
        },
        {
          type: "do",
          text: "Choose rootstock carefully based on soil type, water availability, and disease pressure in your region."
        }
      ]
    },
    {
      title: "Revenue Strategy",
      icon: TrendingUp,
      color: "vine-green",
      tips: [
        {
          type: "do",
          text: "Bulk grape sales offer fastest cash (Year 3+) but lowest margins: $1,500-$4,000/ton depending on variety and region."
        },
        {
          type: "do",
          text: "DTC (Direct-to-Consumer) wine sales provide highest margins ($25-$75/bottle) but require tasting room and slow ramp-up."
        },
        {
          type: "dont",
          text: "Don't count on premium pricing without proven track record. Start with conservative market-rate assumptions."
        },
        {
          type: "do",
          text: "Research USDA NASS Grape Crush Reports for realistic pricing data in your region and variety."
        }
      ]
    },
    {
      title: "Operations & Labor",
      icon: Users,
      color: "blue",
      tips: [
        {
          type: "do",
          text: "Budget $2,750-$6,400/acre annually for operating expenses (pruning, spraying, irrigation, harvest, overhead)."
        },
        {
          type: "do",
          text: "Hire experienced vineyard manager ($50k-$90k/year) if you lack viticulture background. Critical for success."
        },
        {
          type: "dont",
          text: "Don't underestimate seasonal labor costs. Peak periods (harvest, pruning) require significant crew hours."
        },
        {
          type: "do",
          text: "Plan equipment purchases strategically: tractor ($35k-$60k), sprayer ($25k-$50k), mower ($8k-$15k)."
        }
      ]
    },
    {
      title: "Irrigation & Water",
      icon: Droplet,
      color: "cyan",
      tips: [
        {
          type: "do",
          text: "Drip irrigation is standard for vineyards. Budget $1,500-$3,500/acre for system installation."
        },
        {
          type: "do",
          text: "Secure water rights early in the planning process. Water availability can be deal-breaker in many regions."
        },
        {
          type: "dont",
          text: "Don't ignore ET (evapotranspiration) data. Modern vineyards use precision irrigation based on ET calculations."
        },
        {
          type: "do",
          text: "Well drilling costs vary dramatically ($15k-$75k) based on depth, flow rate, and geology. Get multiple bids."
        }
      ]
    },
    {
      title: "Risk Management",
      icon: Shield,
      color: "amber",
      tips: [
        {
          type: "do",
          text: "Frost protection is critical in many regions. Budget $200-$1,000/acre for wind machines, heaters, or sprinklers."
        },
        {
          type: "do",
          text: "Carry adequate insurance: property, liability, crop (if available), and equipment coverage."
        },
        {
          type: "dont",
          text: "Don't plant single variety across entire vineyard. Diversify to reduce market and weather risk."
        },
        {
          type: "do",
          text: "Have backup buyers or sales channels. Over-reliance on single winery or distributor is high risk."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Lightbulb className="w-4 h-4" />
              Best Practices
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Vineyard Planning Tips
            </h1>
            <p className="text-xl text-amber-50 leading-relaxed">
              Expert advice and best practices for successful vineyard planning, from financial modeling to operational execution.
            </p>
          </div>
        </div>
      </div>

      {/* Tips Sections */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="space-y-12">
          {tipCategories.map((category, idx) => {
            const IconComponent = category.icon;
            return (
              <section key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-${category.color}-50 flex items-center justify-center`}>
                    <IconComponent className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                </div>

                {/* Tips Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {category.tips.map((tip, tipIdx) => (
                    <div
                      key={tipIdx}
                      className={`flex gap-3 p-4 rounded-xl border ${
                        tip.type === 'do'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {tip.type === 'do' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <p className={`text-sm ${
                        tip.type === 'do' ? 'text-green-900' : 'text-amber-900'
                      }`}>
                        {tip.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Documentation CTA */}
        <div className="mt-16 bg-gradient-to-r from-teal-600 to-vine-green-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Want More Detailed Guidance?</h3>
          <p className="text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
            Our comprehensive documentation covers every aspect of vineyard planning in depth.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/docs/planner/best-practices"
              className="inline-flex items-center gap-2 bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold hover:bg-teal-50 transition-colors shadow-lg"
            >
              Read Full Guide
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/30"
            >
              <Lightbulb className="w-5 h-5" />
              Start Planning
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
