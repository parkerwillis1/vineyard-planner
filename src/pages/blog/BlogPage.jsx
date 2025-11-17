import { Link } from "react-router-dom";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { blogPosts } from "./blogContent";

export default function BlogPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 via-vine-green-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Vineyard Planning Insights
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Blog & Resources
            </h1>
            <p className="text-xl text-teal-50 leading-relaxed">
              Expert insights, planning guides, and industry analysis to help you build a successful vineyard operation.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {blogPosts.map((post) => {
            const IconComponent = post.icon;
            return (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Category Badge & Icon */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-${post.color}-50 text-${post.color}-700`}>
                      <IconComponent className="w-4 h-4" />
                      {post.category}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>

                  {/* Read More Link */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{post.readTime}</span>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 group-hover:gap-3 transition-all"
                    >
                      Read Article
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-teal-50 border border-teal-200 rounded-xl px-6 py-4">
            <p className="text-teal-700 font-medium">
              📝 More articles coming soon! We're working on comprehensive guides for vineyard planning and management.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-teal-600 to-vine-green-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Plan Your Vineyard?</h3>
          <p className="text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
            Use our free vineyard planner to create detailed financial projections and design your vineyard layout.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold hover:bg-teal-50 transition-colors shadow-lg"
            >
              Start Planning Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/30"
            >
              <BookOpen className="w-5 h-5" />
              Read Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
