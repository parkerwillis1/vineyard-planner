import { Link } from "react-router-dom";
import DocsLayout from "./DocsLayout";
import { Calculator, Map, Users, BarChart3, BookOpen, HelpCircle } from "lucide-react";
import { DocsHeader, FeatureGrid } from "./DocsComponents";

export default function DocsIndex() {
  const sections = [
    {
      icon: <BookOpen className="w-6 h-6 text-vine-green-600" />,
      title: "Getting Started",
      description: "Learn the basics and get up to speed quickly with Vine Pioneer's planning and operations tools.",
      link: "/docs/getting-started/quick-start",
    },
    {
      icon: <Calculator className="w-6 h-6 text-blue-600" />,
      title: "Vineyard Planner",
      description: "Create 10-year financial projections for your vineyard with detailed cost modeling and revenue forecasting.",
      link: "/docs/planner",
    },
    {
      icon: <Map className="w-6 h-6 text-emerald-600" />,
      title: "Vineyard Operations",
      description: "Manage blocks, irrigation, tasks, and teams with satellite monitoring and real-time analytics.",
      link: "/docs/operations",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
      title: "Analytics & Reporting",
      description: "Track performance metrics, field data, and generate reports for lenders and stakeholders.",
      link: "/docs/operations/analytics",
    },
    {
      icon: <Users className="w-6 h-6 text-orange-600" />,
      title: "Team Management",
      description: "Invite team members, assign roles, and collaborate on vineyard planning and operations.",
      link: "/docs/operations/team",
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-gray-600" />,
      title: "FAQ & Support",
      description: "Find answers to common questions and get help with troubleshooting issues.",
      link: "/docs/faq",
    },
  ];

  return (
    <DocsLayout>
      <DocsHeader
        title="Vine Pioneer Documentation"
        subtitle="Everything you need to plan your vineyard, forecast financials, and manage daily operations."
      />

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Documentation Sections</h2>
        <FeatureGrid features={sections} />
      </div>

      <div className="bg-gradient-to-br from-vine-green-50 to-teal-50 rounded-2xl p-8 border border-vine-green-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-vine-green-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-vine-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">New to Vine Pioneer?</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Start with our Quick Start Guide to learn how to create your first vineyard financial plan in under 10 minutes.
            </p>
            <Link
              to="/docs/getting-started/quick-start"
              className="inline-flex items-center gap-2 bg-vine-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-vine-green-700 transition-colors"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Topics</h2>
        <div className="space-y-3">
          <PopularLink
            title="How do I create my first financial projection?"
            href="/docs/getting-started/quick-start"
          />
          <PopularLink
            title="Understanding financial formulas and calculations"
            href="/docs/planner/formulas"
          />
          <PopularLink
            title="Setting up vineyard blocks with satellite data"
            href="/docs/operations/blocks"
          />
          <PopularLink
            title="Managing irrigation schedules and ET calculations"
            href="/docs/operations/irrigation"
          />
          <PopularLink
            title="Best practices for vineyard financial planning"
            href="/docs/planner/best-practices"
          />
        </div>
      </div>
    </DocsLayout>
  );
}

function PopularLink({ title, href }) {
  return (
    <Link
      to={href}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-vine-green-300 hover:shadow-md transition-all group"
    >
      <span className="text-gray-900 group-hover:text-vine-green-600 font-medium">
        {title}
      </span>
      <span className="text-gray-400 ml-2 group-hover:ml-3 transition-all">→</span>
    </Link>
  );
}
