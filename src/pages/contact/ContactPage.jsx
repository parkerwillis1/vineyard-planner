import { useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle, MapPin, Phone, Clock } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function ContactPage() {
  const { user } = useAuth() || {};
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setLoading(false);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: "", email: "", subject: "", message: "" });
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-vine-green-500 to-emerald-600 overflow-hidden py-20 sm:py-24">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 mb-6 border border-white/30">
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">We're Here to Help</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Get in Touch
          </h1>
          <p className="mt-6 text-lg sm:text-xl leading-8 text-white/90 max-w-2xl mx-auto">
            Have questions about planning your vineyard? Need help with the platform?
            We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="feature">Feature Request</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows="6"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-600 to-vine-green-600 text-white font-semibold rounded-lg hover:from-teal-500 hover:to-vine-green-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Info Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Email Card */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border-2 border-teal-200 p-6 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600 mb-3">
                For general inquiries and support
              </p>
              <a
                href="mailto:support@trellisag.com"
                className="text-teal-600 hover:text-teal-700 font-semibold hover:underline"
              >
                support@trellisag.com
              </a>
            </div>

            {/* Response Time Card */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 p-6 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Response Time</h3>
              <p className="text-gray-600">
                We typically respond within <span className="font-semibold text-gray-900">24 hours</span> during business days.
              </p>
            </div>

            {/* Office Hours Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-6 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Office Hours</h3>
              <p className="text-gray-600">
                Monday - Friday<br />
                9:00 AM - 5:00 PM PST
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-6">
            <FAQItem
              question="How quickly will I hear back from you?"
              answer="We aim to respond to all inquiries within 24 hours during business days (Monday-Friday). For urgent technical issues, we prioritize responses and often reply within a few hours."
            />
            <FAQItem
              question="What's the best way to report a bug?"
              answer="Use the contact form above and select 'Technical Support' as the subject. Please include as much detail as possible: what you were doing, what happened, and any error messages you saw. Screenshots are very helpful!"
            />
            <FAQItem
              question="Can I schedule a demo or consultation?"
              answer="Absolutely! Mention your interest in a demo or consultation in your message, and we'll coordinate a time that works for you. We're happy to walk you through the platform and answer your specific questions."
            />
            <FAQItem
              question="Do you offer support for custom integrations?"
              answer="We're always interested in hearing about integration needs. Please reach out with details about what you're looking to integrate, and we'll discuss the possibilities."
            />
          </div>
        </div>
      </section>

      {/* CTA Section - Only show when not authenticated */}
      {!user && (
        <section className="relative bg-gradient-to-r from-teal-600 to-vine-green-600 overflow-hidden py-16">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Planning?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join hundreds of vineyard owners who trust Trellis for their planning needs.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-700 font-bold rounded-lg hover:bg-teal-50 transition-all shadow-xl hover:shadow-2xl"
            >
              Get Started Free
              <Send className="w-5 h-5" />
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-teal-300 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <svg
          className={`w-5 h-5 text-teal-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}
