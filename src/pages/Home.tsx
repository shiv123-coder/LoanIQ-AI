import { ArrowRight, BrainCircuit, ShieldCheck, Zap, Users, PlayCircle, Fingerprint } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm font-medium mb-8 text-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              {t('home:badge', 'Next-Gen AI Loan Processing')}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
              {t('home:title1', 'Smart Lending')} <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                {t('home:title2', 'Powered by AI')}
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              {t('home:heroDesc', 'Experience seamless, instant loan approvals with our advanced AI-driven verification system. Secure, fast, and completely digital.')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <Link to="/user/auth" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1">
                {t('home:getStarted', 'Get Started / Sign In')}
                <ArrowRight size={20} />
              </Link>
              <a href="https://www.youtube.com/watch?v=JsIIFqQFpvc" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-1">
                <PlayCircle size={20} />
                {t('home:viewDemo', 'View Demo')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-secondary/50 relative border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('home:whyChoose', 'Why Choose LoanIQ-AI?')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t('home:whyChooseDesc', 'Our platform leverages state-of-the-art technology to provide the best borrowing experience.')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: t('home:features.instant.title', 'Instant Processing'), desc: t('home:features.instant.desc', 'Get your loan approved in minutes, not days. Our automated system works 24/7.') },
              { icon: ShieldCheck, title: t('home:features.security.title', 'Bank-Grade Security'), desc: t('home:features.security.desc', 'Your data is protected with enterprise-level encryption and secure infrastructure.') },
              { icon: BrainCircuit, title: t('home:features.ai.title', 'AI Verification'), desc: t('home:features.ai.desc', 'Advanced AI models verify your documents and identity with 99.9% accuracy.') }
            ].map((feature, i) => (
              <div key={i} className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-14 h-14 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{t('home:howItWorks', 'How It Works')}</h2>
              <p className="text-muted-foreground text-lg mb-8">{t('home:howItWorksDesc', 'Four simple steps to get your loan funded. No paperwork, no branch visits.')}</p>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: t('home:steps.01.title', 'Eligibility Check'), desc: t('home:steps.01.desc', 'Quick PAN verification to check your loan eligibility instantly.') },
                  { step: "02", title: t('home:steps.02.title', 'Video KYC'), desc: t('home:steps.02.desc', 'Secure video verification using our AI facial recognition.') },
                  { step: "03", title: t('home:steps.03.title', 'Smart Assessment'), desc: t('home:steps.03.desc', 'AI analyzes your profile to offer the best interest rates.') },
                  { step: "04", title: t('home:steps.04.title', 'Instant Disbursement'), desc: t('home:steps.04.desc', 'Money transferred directly to your bank account.') }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-1">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-violet-600/20 blur-3xl rounded-full" />
              <div className="relative bg-card border border-border p-6 rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-violet-500" />
                {/* Mockup UI representation */}
                <div className="flex items-center justify-between mb-6 border-b border-border pb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                      JD
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">John Doe</div>
                      <div className="text-xs text-muted-foreground">ID: APP-84920</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-1 border border-emerald-500/20">
                    <ShieldCheck size={14} /> Verified
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-secondary/40 border border-border rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Zap size={48} />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">Approved Loan Amount</div>
                    <div className="text-2xl font-bold text-foreground">₹5,00,000</div>
                    <div className="w-full bg-background border border-border rounded-full h-2 mt-4 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-emerald-500 w-[85%] h-full rounded-full relative">
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium">
                      <span>Processing</span>
                      <span className="text-emerald-500">Ready to Disburse</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/40 border border-border rounded-xl p-4">
                      <div className="text-xs text-muted-foreground mb-1">Interest Rate</div>
                      <div className="text-lg font-bold text-foreground">10.5% p.a.</div>
                    </div>
                    <div className="bg-secondary/40 border border-border rounded-xl p-4">
                      <div className="text-xs text-muted-foreground mb-1">Tenure</div>
                      <div className="text-lg font-bold text-foreground">36 Months</div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <div className="h-11 flex-1 bg-secondary border border-border rounded-xl flex items-center justify-center text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors cursor-pointer">
                      View Details
                    </div>
                    <div className="h-11 flex-[2] bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center text-sm font-medium text-white shadow-lg shadow-blue-500/25 hover:opacity-90 transition-opacity cursor-pointer gap-2">
                      <Zap size={16} /> Disburse Now
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-foreground">LoanIQ-AI</span>
          </div>
          <p className="text-sm text-muted-foreground">{t('home:copyright', '© {{year}} LoanIQ-AI. All rights reserved.', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">{t('home:privacy', 'Privacy')}</Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">{t('home:terms', 'Terms')}</Link>
            <Link to="/support" className="text-muted-foreground hover:text-foreground">{t('home:support', 'Support')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
