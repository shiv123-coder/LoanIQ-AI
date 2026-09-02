import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div className="space-y-2 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">Last updated: June 25, 2026</p>
        </div>

        <div className="prose prose-invert prose-blue max-w-none space-y-10">
          
          <section className="bg-card border border-border p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                <Database size={20} />
              </div>
              <h2 className="text-2xl font-bold text-foreground m-0">1. Data Collection & Usage</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              LoanIQ-AI ("we", "our", or "us") is committed to protecting your privacy. We collect personal, financial, and identifying information when you use our services to apply for loans. This includes your name, PAN card details, banking information (such as account numbers and IFSC codes), employment details, and income statements. We use this data strictly to process your loan application, assess credit risk, and fulfill regulatory compliance requirements.
            </p>
          </section>

          <section className="bg-card border border-border p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-violet-500/10 text-violet-500 rounded-xl flex items-center justify-center">
                <Eye size={20} />
              </div>
              <h2 className="text-2xl font-bold text-foreground m-0">2. OCR & Video KYC Processing</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Our platform utilizes advanced AI and OCR (Optical Character Recognition) to verify your identity. During the Video KYC process, we capture biometric data, facial recognition markers, and live video feeds to confirm your identity against provided government documents. This biometric data is processed securely in real-time. We do not sell or share this biometric data with third-party marketers.
            </p>
          </section>

          <section className="bg-card border border-border p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                <Lock size={20} />
              </div>
              <h2 className="text-2xl font-bold text-foreground m-0">3. Data Security & Storage</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Security is our highest priority. All data transmitted between your device and our servers is encrypted using industry-standard 256-bit AES encryption and TLS protocols. We store your data on secure, compliant cloud infrastructure with restricted access. We employ continuous monitoring and regular security audits to prevent unauthorized access, alteration, or disclosure of your personal information.
            </p>
          </section>

          <section className="bg-card border border-border p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h2 className="text-2xl font-bold text-foreground m-0">4. Retention & Cookies</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, or as required by financial regulations (typically 5 to 7 years after the closure of a loan). 
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our platform and hold certain information. These cookies help us remember your preferences, secure your session, and analyze platform performance. You can instruct your browser to refuse all cookies, but doing so may limit your ability to use our services.
            </p>
          </section>

          <section className="bg-card border border-border p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-2xl font-bold text-foreground m-0">5. User Rights & Contact</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to access, update, or request deletion of your personal data, subject to regulatory constraints. If you believe your data has been handled incorrectly, you may file a grievance.
            </p>
            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <p className="text-foreground font-medium mb-1">Contact our Data Protection Officer:</p>
              <a href="mailto:privacy@loaniq.ai" className="text-blue-500 hover:underline">privacy@loaniq.ai</a>
              <p className="text-muted-foreground text-sm mt-2">LoanIQ Financial Technologies, AI Hub, Mumbai, India</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
