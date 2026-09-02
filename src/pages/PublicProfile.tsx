import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Banknote,
  Clock,
  User,
  ChevronRight,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { fetchWithAuth } from "../lib/fetchWithAuth";
import { useTranslation } from "react-i18next";

import { API_BASE } from '../config/api';

const getDecisionConfig = (t: any) => ({
  APPROVED: {
    label: t('publicProfile:approved', 'Approved'),
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    icon: <CheckCircle size={15} />,
  },
  CONDITIONAL: {
    label: t('publicProfile:pending', 'Pending'),
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: <AlertCircle size={15} />,
  },
  REJECTED: {
    label: t('publicProfile:rejected', 'Rejected'),
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    icon: <XCircle size={15} />,
  },
});

export default function PublicProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userId");
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (!userId) {
      setError(t('publicProfile:noUserId', 'No user ID provided.'));
      setLoading(false);
      return;
    }
    fetchLoans();
  }, [userId]);

  async function fetchLoans() {
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE}/api/user/my-loans/${userId}`,
        {},
        "user",
      );
      const data = await res.json();
      if (data.success && data.loans?.length > 0) {
        setLoans(data.loans);
        setUserName(data.loans[0]?.customerDetails?.name || t('publicProfile:applicant', 'Applicant'));
      } else {
        setLoans([]);
      }
    } catch {
      setError(t('publicProfile:loadError', 'Could not load applications. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: loans.length,
    approved: loans.filter((l) => l.decision === "APPROVED").length,
    pending: loans.filter((l) => l.decision === "CONDITIONAL").length,
    rejected: loans.filter((l) => l.decision === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 transition-colors duration-500">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">LoanIQ </h1>
              <p className="text-xs text-muted-foreground">
                {t('publicProfile:loanRecords', 'Loan Application Records')}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">
              {t('publicProfile:fetchingRecords', 'Fetching records from database…')}
            </p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 text-center">
            <XCircle size={32} className="text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">{error}</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <Clock size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">{t('publicProfile:noAppsFound', 'No Applications Found')}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {t('publicProfile:noRecordsLinked', 'No loan records linked to this profile.')}
            </p>
          </div>
        ) : (
          <>
            {/* Applicant card */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-foreground font-bold">{userName}</div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  {t('publicProfile:loaniqApplicant', 'LoanIQ Applicant')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {t('publicProfile:applications', 'Applications')}
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {stats.total}
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: t('publicProfile:approved', 'Approved'),
                  value: stats.approved,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-500/20",
                },
                {
                  label: t('publicProfile:pending', 'Pending'),
                  value: stats.pending,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10 border-amber-500/20",
                },
                {
                  label: t('publicProfile:rejected', 'Rejected'),
                  value: stats.rejected,
                  color: "text-red-400",
                  bg: "bg-red-500/10 border-red-500/20",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-xl border p-3 text-center ${s.bg}`}
                >
                  <div className={`text-2xl font-bold ${s.color}`}>
                    {s.value}
                  </div>
                  <div className={`text-xs ${s.color} opacity-80`}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Application list */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock size={12} /> {t('publicProfile:appHistory', 'Application History')}
              </h2>
              <div className="space-y-2">
                {loans.map((loan: any) => {
                  const dcConfig = getDecisionConfig(t);
                  const dc =
                    dcConfig[
                      loan.decision as keyof typeof dcConfig
                    ] || dcConfig.REJECTED;
                  const dateStr = loan.createdAt
                    ? new Date(loan.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A";

                  return (
                    <div
                      key={loan.id}
                      className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${dc.bg} ${dc.color}`}
                        >
                          {dc.icon} {dc.label}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground text-sm font-bold truncate">
                            {loan.financialDetails?.loanPurpose ||
                              t('publicProfile:loanApplication', 'Loan Application')}
                          </div>
                          <div className="text-muted-foreground text-[10px] mt-0.5">
                            {dateStr} · Ref:{" "}
                            {loan.id?.substring(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {loan.offer && loan.decision === "APPROVED" ? (
                        <div className="bg-secondary/30 rounded-xl p-3 border border-border/50">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                {t('publicProfile:moneyGiven', 'Money Given')}
                              </div>
                              <div className="text-emerald-400 font-bold text-lg">
                                Rs.
                                {Number(
                                  loan.offer.offeredAmount,
                                ).toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                {t('publicProfile:moneyPaid', 'Money Paid')}
                              </div>
                              <div className="text-blue-400 font-bold text-lg">
                                Rs.
                                {Number(loan.paidAmount || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Repayment Progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-muted-foreground">
                                {t('publicProfile:repaymentProgress', 'Repayment Progress')}
                              </span>
                              <span className="text-blue-400">
                                {Math.round(
                                  ((loan.paidAmount || 0) /
                                    loan.offer.offeredAmount) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000"
                                style={{
                                  width: `${Math.min(100, ((loan.paidAmount || 0) / loan.offer.offeredAmount) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center py-2 px-1 border-t border-border/50 mt-2">
                          <div className="text-xs text-muted-foreground">
                            {t('publicProfile:creditScore', 'Credit Score')}
                          </div>
                          <div
                            className={`text-sm font-bold ${loan.creditScore >= 751 ? "text-emerald-400" : loan.creditScore >= 491 ? "text-amber-400" : "text-red-400"}`}
                          >
                            {loan.creditScore} / 900
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate("/user/auth")}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-all"
            >
              {t('publicProfile:signInManage', 'Sign in to Manage Applications')} <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-muted-foreground text-xs">
            {t('publicProfile:poweredBy', 'Powered by')}{" "}
            <span className="text-blue-500 font-medium">LoanIQ </span> · {t('publicProfile:secureEncrypted', 'Secure · Encrypted')}
          </p>
          {userId && (
            <p className="text-muted-foreground/50 text-[10px] mt-1 font-mono">
              ID: {userId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
