import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoanProvider } from "./context/LoanContext";
import { UserAuthProvider, useUserAuth } from "./context/UserAuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import Home from "./pages/Home";

// Loan Flow Pages
import PreCheckScreen from "./pages/PreCheckScreen";
import VideoKYC from "./pages/VideoKYC";
import Processing from "./pages/Processing";
import Result from "./pages/Result";
import Report from "./pages/Report";
import Disbursement from "./pages/Disbursement";
import AdminDashboard from "./pages/AdminDashboard";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminAuth from "./pages/AdminAuth";
import UserAuth from "./pages/UserAuth";
import UserDashboard from "./pages/UserDashboard";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";

const queryClient = new QueryClient();

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  const role = localStorage.getItem('admin_role');
  
  if (!token) return <Navigate to="/admin/login" replace />;
  
  if (role !== 'admin') {
    if (role === 'loan_officer') return <Navigate to="/loan-officer/dashboard" replace />;
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}

function OfficerProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  const role = localStorage.getItem('admin_role');
  
  if (!token) return <Navigate to="/loan-officer/login" replace />;
  
  if (role !== 'loan_officer') {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/loan-officer/login" replace />;
  }
  
  return <>{children}</>;
}

// User route guard
function UserProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUserAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/user/auth" replace />;
  return children;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <ThemeProvider>
            <LoanProvider>
              <UserAuthProvider>
                <Routes>
                  {/* Public Core Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/support" element={<Support />} />
                  
                  {/* Loan Application Flow */}
                  <Route path="/apply" element={<PreCheckScreen />} />
                  <Route path="/kyc" element={<VideoKYC />} />
                  <Route path="/processing" element={<Processing />} />
                  <Route path="/result" element={<Result />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/disbursement" element={<Disbursement />} />

                  {/* User Portal Routes */}
                  <Route path="/user/auth" element={<UserAuth />} />
                  <Route path="/user/profile" element={<PublicProfile />} />
                  <Route
                    path="/user/dashboard"
                    element={
                      <UserProtectedRoute>
                        <UserDashboard />
                      </UserProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminAuth expectedRole="admin" />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminProtectedRoute>
                        <AdminDashboard />
                      </AdminProtectedRoute>
                    }
                  />
                  
                  {/* Loan Officer Routes */}
                  <Route path="/loan-officer/login" element={<AdminAuth expectedRole="loan_officer" />} />
                  <Route
                    path="/loan-officer/dashboard"
                    element={
                      <OfficerProtectedRoute>
                        <OfficerDashboard />
                      </OfficerProtectedRoute>
                    }
                  />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </UserAuthProvider>
            </LoanProvider>
          </ThemeProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
