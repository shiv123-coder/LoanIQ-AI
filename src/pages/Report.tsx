import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoan } from '../context/LoanContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  User, Banknote, Shield, CheckCircle, XCircle, AlertCircle,
  FileText, TrendingUp, Download, ArrowLeft, CreditCard, Fingerprint
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 text-foreground font-semibold mb-4 pb-3 border-b border-border">
        <span className="text-blue-400">{icon}</span>
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string | number | null | undefined; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-blue-400' : 'text-foreground'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

export default function Report() {
  const navigate = useNavigate();
  const { state } = useLoan();
  const { t } = useTranslation();
  const result = state.result;

  useEffect(() => {
    if (!result) navigate('/');
  }, [result]);

  if (!result) return null;

  const { creditScore, riskLevel, decision, offer, report } = result;

  const decisionIcon = {
    APPROVED: <CheckCircle size={16} className="text-emerald-400" />,
    CONDITIONAL: <AlertCircle size={16} className="text-amber-400" />,
    REJECTED: <XCircle size={16} className="text-red-400" />,
  };

  const decisionColor = {
    APPROVED: 'text-emerald-400',
    CONDITIONAL: 'text-amber-400',
    REJECTED: 'text-red-400',
  };

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-500">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Theme Control */}
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            id="btn-back-result"
            onClick={() => navigate('/result')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            {t('report:back', 'Back')}
          </button>
          <h1 className="text-foreground font-bold text-lg">{t('report:title', 'Loan Assessment Report')}</h1>
          <button
            id="btn-download-report"
            onClick={handlePrint}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <Download size={16} />
            {t('report:print', 'Print')}
          </button>
        </div>

        {/* Report ID & Date */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <div className="text-muted-foreground text-xs">{t('report:reportGenerated', 'Report Generated')}</div>
            <div className="text-foreground font-medium">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-xs">{t('report:applicationId', 'Application ID')}</div>
            <div className="text-blue-400 font-mono text-sm">{result.docId || 'DOC-' + Date.now().toString(36).toUpperCase()}</div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Customer Details */}
          <Section title={t('report:customerDetails', 'Customer Details')} icon={<User size={16} />}>
            <Row label={t('report:fullName', 'Full Name')} value={report?.customerDetails?.name} highlight />
            <Row label={t('report:transcriptName', 'Transcript Name')} value={report?.customerDetails?.transcriptName} />
            <Row label={t('report:location', 'Location')} value={
              report?.customerDetails?.location
                ? `${report.customerDetails.location.lat?.toFixed(4)}, ${report.customerDetails.location.lng?.toFixed(4)}`
                : t('report:notProvided', 'Not provided')
            } />
          </Section>

          {/* Financial Details */}
          <Section title={t('report:financialDetails', 'Financial Details')} icon={<Banknote size={16} />}>
            <Row label={t('report:monthlyIncome', 'Monthly Income')} value={`₹${(report?.financialDetails?.income || 0).toLocaleString('en-IN')}`} />
            <Row label={t('report:incomeTier', 'Income Tier')} value={report?.financialDetails?.incomeTier?.toUpperCase()} />
            <Row label={t('report:employmentType', 'Employment Type')} value={report?.financialDetails?.jobType} />
            <Row label={t('report:loanPurpose', 'Loan Purpose')} value={report?.financialDetails?.loanPurpose} />
            <Row label={t('report:requestedAmount', 'Requested Amount')} value={`₹${(report?.financialDetails?.requestedAmount || 0).toLocaleString('en-IN')}`} />
          </Section>

          {/* PAN Verification */}
          <Section title={t('report:identityVerification', 'Identity Verification')} icon={<CreditCard size={16} />}>
            <Row label={t('report:panNumber', 'PAN Number')} value={report?.panDetails?.panNumber || t('report:notExtracted', 'Not extracted')} highlight />
            <Row label={t('report:dateOfBirth', 'Date of Birth')} value={report?.panDetails?.dob || t('report:notExtracted', 'Not extracted')} />
            <Row label={t('report:panVerified', 'PAN Verified')} value={report?.verification?.panVerified ? t('report:yes', 'Yes') : t('report:no', 'No')} />
            <Row label={t('report:livenessCheck', 'Liveness Check')} value={report?.verification?.liveness ? t('report:passed', 'Passed') : t('report:failed', 'Failed')} />
          </Section>

          {/* Credit Score */}
          <Section title={t('report:creditAssessment', 'Credit Assessment')} icon={<TrendingUp size={16} />}>
            <Row label={t('report:creditScore', 'Credit Score')} value={`${creditScore} / 900`} highlight />
            <Row label={t('report:riskScore', 'Risk Score')} value={`${report?.riskScore} / 100`} />
            <Row label={t('report:riskLevel', 'Risk Level')} value={riskLevel} />
            <div className="pt-2">
              <div className="text-muted-foreground text-xs mb-2">{t('report:scoreBreakdown', 'Score Breakdown')}</div>
              {report?.adjustments?.map((adj, i) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{adj.factor}</span>
                  <span className={adj.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {adj.delta >= 0 ? '+' : ''}{adj.delta}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Risk Components */}
          <Section title={t('report:riskComponents', 'Risk Components')} icon={<Shield size={16} />}>
            <Row label={t('report:incomeScore', 'Income Score')} value={`${report?.riskComponents?.incomeScore} / 100`} />
            <Row label={t('report:verificationScore', 'Verification Score')} value={`${report?.riskComponents?.verificationScore} / 100`} />
            <Row label={t('report:behaviorScore', 'Behavior Score')} value={`${report?.riskComponents?.behaviorScore} / 100`} />
          </Section>

          {/* Decision */}
          <Section title={t('report:finalDecision', 'Final Decision')} icon={<Fingerprint size={16} />}>
            <div className="flex items-center gap-2 mb-2">
              {decisionIcon[decision]}
              <span className={`text-lg font-bold ${decisionColor[decision]}`}>{decision}</span>
            </div>
            {offer && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Row label={t('report:approvedAmount', 'Approved Amount')} value={`₹${offer.offeredAmount.toLocaleString('en-IN')}`} highlight />
                <Row label={t('report:interestRate', 'Interest Rate')} value={`${offer.interestRate}% ${t('report:pa', 'p.a.')}`} />
                <Row label={t('report:monthlyEmi', 'Monthly EMI')} value={`₹${offer.emi.toLocaleString('en-IN')}`} />
                <Row label={t('report:processingFee', 'Processing Fee')} value={`₹${offer.processingFee.toLocaleString('en-IN')}`} />
                <Row label={t('report:tenure', 'Tenure')} value={`${offer.tenure} ${t('report:months', 'months')}`} />
              </div>
            )}
          </Section>

          {/* AI Explanation */}
          <Section title={t('report:aiAssessment', 'AI Assessment')} icon={<FileText size={16} />}>
            <p className="text-muted-foreground text-sm leading-relaxed">{report?.explanation}</p>
          </Section>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            id="btn-report-back"
            onClick={() => navigate('/result')}
            className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-all text-sm font-medium"
          >
            {t('report:backToResult', 'Back to Result')}
          </button>
          {decision === 'APPROVED' && offer && (
            <button
              id="btn-report-accept"
              onClick={() => navigate('/disbursement')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg text-sm"
            >
              {t('report:proceedToDisbursement', 'Proceed to Disbursement')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
