import { Link, useNavigate } from 'react-router-dom';
import { Landmark, Menu, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useUserAuth } from '../context/UserAuthContext';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useUserAuth();
  const { t } = useTranslation();
  
  const adminToken = localStorage.getItem('admin_token');
  const adminRole = localStorage.getItem('admin_role');

  const closeMenu = () => setIsOpen(false);

  const handleStaffNavigation = () => {
    if (adminRole === 'loan_officer') navigate('/loan-officer/dashboard');
    else navigate('/admin/dashboard');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
            <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-2 rounded-xl group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
              LoanIQ-AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t('common:navFeatures', 'Features')}</a>
            <a href="/#workflow" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t('common:navHowItWorks', 'How it Works')}</a>
            <a href="https://www.youtube.com/watch?v=JsIIFqQFpvc" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t('common:navDemo', 'Demo')}</a>
            
            <div className="flex items-center gap-4 pl-4 border-l border-border">
              <LanguageSwitcher compact />
              <ThemeToggle />
              
              {user ? (
                <button onClick={() => navigate('/user/dashboard')} className="text-sm font-medium text-foreground hover:text-blue-500 transition-colors">
                  {t('common:navDashboard', 'Dashboard')}
                </button>
              ) : adminToken ? (
                <button onClick={handleStaffNavigation} className="text-sm font-medium text-foreground hover:text-violet-500 transition-colors">
                  {adminRole === 'loan_officer' ? t('common:navOfficerPortal', 'Staff Dashboard') : t('common:navAdminPortal', 'Admin Dashboard')}
                </button>
              ) : (
                <Link to="/user/auth" className="flex items-center gap-2 text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:scale-105 transition-transform">
                  {t('common:navSignIn', 'Sign In')}
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border shadow-xl animate-in slide-in-from-top-2">
          <div className="px-4 py-6 flex flex-col space-y-4">
            <a href="/#features" onClick={closeMenu} className="text-lg font-medium text-muted-foreground hover:text-foreground">{t('common:navFeatures', 'Features')}</a>
            <a href="/#workflow" onClick={closeMenu} className="text-lg font-medium text-muted-foreground hover:text-foreground">{t('common:navHowItWorks', 'How it Works')}</a>
            <a href="https://www.youtube.com/watch?v=JsIIFqQFpvc" target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="text-lg font-medium text-muted-foreground hover:text-foreground">{t('common:navDemo', 'Demo')}</a>
            <div className="pt-4 border-t border-border flex flex-col gap-4">
              <LanguageSwitcher compact={false} />
              {user ? (
                <button onClick={() => { closeMenu(); navigate('/user/dashboard'); }} className="w-full text-center bg-secondary text-foreground py-3 rounded-xl font-medium">
                  {t('common:navDashboard', 'Dashboard')}
                </button>
              ) : adminToken ? (
                <button onClick={() => { closeMenu(); handleStaffNavigation(); }} className="w-full text-center bg-secondary text-foreground py-3 rounded-xl font-medium">
                  {adminRole === 'loan_officer' ? t('common:navOfficerPortal', 'Staff Dashboard') : t('common:navAdminPortal', 'Admin Dashboard')}
                </button>
              ) : (
                <Link to="/user/auth" onClick={closeMenu} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20">
                  {t('common:navSignIn', 'Sign In')}
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
