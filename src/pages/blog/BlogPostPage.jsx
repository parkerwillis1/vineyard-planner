import { Link, useParams, Navigate } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { blogPosts, getBlogPost } from "./blogContent";

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getBlogPost(slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const IconComponent = post.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 via-vine-green-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Back to Blog */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-teal-50 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Category Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-white/10 backdrop-blur-sm text-white mb-6`}>
            <IconComponent className="w-4 h-4" />
            {post.category}
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center gap-6 text-teal-50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Render post content */}
          {post.content}
        </div>
      </article>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-r from-teal-600 to-vine-green-600 rounded-3xl p-12 text-center text-white">
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

      {/* Related Posts */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {blogPosts
            .filter(p => p.slug !== slug)
            .slice(0, 2)
            .map((relatedPost) => {
              const RelatedIcon = relatedPost.icon;
              return (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all group"
                >
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-${relatedPost.color}-50 text-${relatedPost.color}-700 mb-3`}>
                    <RelatedIcon className="w-4 h-4" />
                    {relatedPost.category}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {relatedPost.title}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {relatedPost.excerpt}
                  </p>
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}
