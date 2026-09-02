import { useState } from 'react';
import { ArrowLeft, MessageCircle, HelpCircle, Mail, Clock, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const FAQS = [
  {
    q: "How long does the AI KYC verification take?",
    a: "Our AI KYC verification is processed in real-time. In most cases, it takes less than 60 seconds to complete the face match, liveness detection, and OCR extraction."
  },
  {
    q: "Why was my loan application rejected?",
    a: "Loan decisions are based on a variety of factors including credit history, income, AI fraud detection, and regulatory limits. You can view the specific reasons in your detailed AI Credit Report on your dashboard."
  },
  {
    q: "Can I update my bank account details after approval?",
    a: "Once a loan is approved, bank account details cannot be changed directly through the portal for security reasons. Please contact our support team immediately if you need to update disbursement details."
  },
  {
    q: "Is my personal and biometric data safe?",
    a: "Yes. We use bank-grade 256-bit AES encryption. Biometric data from Video KYC is used strictly for identity verification and is never shared with third-party advertisers."
  }
];

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">How can we help?</h1>
          <p className="text-xl text-muted-foreground">Our support team is here to assist you with any questions regarding your loan application, KYC process, or account.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-card border border-border p-6 rounded-3xl text-center">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={24} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">Email Support</h3>
            <p className="text-muted-foreground mb-2">support@loaniq.ai</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl text-center">
            <div className="w-12 h-12 bg-violet-500/10 text-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">Response Time</h3>
            <p className="text-muted-foreground mb-2">Under 2 hours during business hours</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl text-center">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={24} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">Knowledge Base</h3>
            <p className="text-muted-foreground mb-2">Check the FAQs below for quick answers</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* FAQ Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageCircle className="text-blue-500" /> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden transition-all">
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="font-medium text-foreground pr-4">{faq.q}</span>
                    {openFaq === idx ? <ChevronUp size={20} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={20} className="text-muted-foreground flex-shrink-0" />}
                  </button>
                  {openFaq === idx && (
                    <div className="p-5 pt-2 text-muted-foreground leading-relaxed border-t border-border/50 bg-secondary/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Send us a message</h2>
            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl text-center">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Message Sent!</h3>
                <p className="text-muted-foreground mb-6">We've received your request and will get back to you shortly.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 bg-secondary text-foreground rounded-full hover:bg-secondary/80 transition-colors font-medium text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Name</label>
                    <input required type="text" className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input required type="email" className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="john@example.com" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <select className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground">
                    <option>Loan Application Issue</option>
                    <option>Video KYC Failed</option>
                    <option>Disbursement Delay</option>
                    <option>Account Management</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea required rows={4} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" placeholder="How can we help you?"></textarea>
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-blue-500/25"
                >
                  {isSubmitting ? 'Sending...' : (
                    <><Send size={18} /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
