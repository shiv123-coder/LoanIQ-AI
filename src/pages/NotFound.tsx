import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 transition-colors duration-500">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md w-full">
        {/* 404 Display */}
        <div className="relative mb-8 select-none">
          <div className="text-[10rem] font-black leading-none bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 bg-clip-text text-transparent opacity-20">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
              <Search size={36} className="text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          {t('notFound:title', 'Page Not Found')}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          {t('notFound:desc1', "The page you're looking for doesn't exist or has been moved.")}
          <br />
          {t('notFound:desc2', "Let's get you back on track.")}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            id="btn-go-home"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home size={16} />
            {t('notFound:goHome', 'Go to Home')}
          </button>
          <button
            id="btn-go-back"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary border border-border text-foreground rounded-xl font-medium text-sm hover:bg-accent transition-all"
          >
            <ArrowLeft size={16} />
            {t('notFound:goBack', 'Go Back')}
          </button>
        </div>

        {/* Footer hint */}
        <p className="mt-10 text-muted-foreground text-xs">
          {t('notFound:footer', 'LoanIQ · AI-Powered Loan Origination')}
        </p>
      </div>
    </div>
  );
}
