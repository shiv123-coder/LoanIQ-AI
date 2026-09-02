import { ArrowLeft, AlertTriangle, Scale, Ban, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Terms() {
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground text-lg">Effective Date: June 25, 2026</p>
        </div>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl mb-8">
            <p className="text-foreground font-medium">
              By accessing or using the LoanIQ-AI platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="text-blue-500" size={24} />
              1. Account Usage & Eligibility
            </h2>
            <p className="mb-4">
              To use LoanIQ-AI, you must be at least 18 years of age and a legal resident of the jurisdiction in which we operate. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during the loan application process.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={24} />
              2. AI Decisioning & Loan Disclaimer
            </h2>
            <p className="mb-4">
              LoanIQ-AI utilizes artificial intelligence and machine learning algorithms to assess creditworthiness and generate loan offers. While our models strive for high accuracy, AI assessments do not guarantee approval. Loan decisions are based on a combination of AI analysis, credit bureau data, and regulatory guidelines. We reserve the right to manually review, alter, or reject any AI-generated decision at our sole discretion.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Ban className="text-red-500" size={24} />
              3. Prohibited Use
            </h2>
            <p className="mb-4">
              You agree not to use the platform to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Submit false, manipulated, or synthetic documents (including deepfakes during Video KYC).</li>
              <li>Attempt to reverse-engineer, exploit, or disrupt our AI verification systems.</li>
              <li>Engage in fraudulent activities, money laundering, or financing of illegal operations.</li>
              <li>Use automated scripts, scrapers, or bots to interact with our platform.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Scale className="text-violet-500" size={24} />
              4. Liability & Termination
            </h2>
            <p className="mb-4">
              LoanIQ-AI shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services, including delays in fund disbursement or denied applications. We reserve the right to suspend or terminate your account immediately, without prior notice, if you breach these Terms of Service or if we detect suspicious activity.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              5. Governing Law
            </h2>
            <p className="mb-4">
              These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in the federal or state courts located in Mumbai, India.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
