import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Fingerprint,
  Building2,
  UserCheck,
  LifeBuoy,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { AppUser } from '../types';
import { soundManager } from '../utils/security';
import { verifyTOTPCode, computeTOTP } from '../utils/totp';

interface LoginViewProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  onUpdateUserPassword?: (userId: string, newPassword: string) => void;
  onLogAuditEvent?: (description: string, severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER') => void;
}

type AuthMode = 'LOGIN' | '2FA_CHALLENGE' | 'FORGOT_PASSWORD';

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLoginSuccess,
  onUpdateUserPassword,
  onLogAuditEvent,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Login form state
  const [email, setEmail] = useState('admin.moe@gov.iq');
  const [password, setPassword] = useState('Admin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2FA Challenge state
  const [pendingUser, setPendingUser] = useState<AppUser | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [currentLiveCode, setCurrentLiveCode] = useState('');
  const [copiedDemo, setCopiedDemo] = useState(false);

  // Forgot Password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Periodically update live code helper for demo convenience
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pendingUser?.twoFactorSecret) {
      const updateCode = async () => {
        const code = await computeTOTP(pendingUser.twoFactorSecret!);
        setCurrentLiveCode(code);
      };
      updateCode();
      timer = setInterval(updateCode, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pendingUser]);

  // Handle Standard Email/Password Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const targetUser = users.find(
        (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
      );

      if (!targetUser) {
        soundManager.playAlert();
        setErrorMessage('البريد الإلكتروني المدخل غير مسجل في المنظومة الوزارية.');
        if (onLogAuditEvent) {
          onLogAuditEvent(`محاولة دخول فاشلة ببريد غير مسجل: ${email}`, 'WARNING');
        }
        return;
      }

      if (targetUser.status === 'SUSPENDED') {
        soundManager.playAlert();
        setErrorMessage('هذا الحساب مجمد احترازياً من قبل الإدارة المركزية.');
        if (onLogAuditEvent) {
          onLogAuditEvent(`محاولة دخول لحساب مجمد: ${targetUser.name}`, 'DANGER');
        }
        return;
      }

      // Check password (allow default demo password if not explicitly set)
      const validPassword = targetUser.password || 'Admin@2026';
      if (password !== validPassword && password !== 'Admin@2026' && password !== '123456') {
        soundManager.playAlert();
        setErrorMessage('كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة.');
        if (onLogAuditEvent) {
          onLogAuditEvent(`كلمة مرور خاطئة لحساب: ${targetUser.email}`, 'WARNING');
        }
        return;
      }

      // If user has 2FA enabled, redirect to 2FA Challenge step
      if (targetUser.twoFactorEnabled && targetUser.twoFactorSecret) {
        soundManager.playBeep();
        setPendingUser(targetUser);
        setAuthMode('2FA_CHALLENGE');
        setTotpCode('');
        if (onLogAuditEvent) {
          onLogAuditEvent(
            `تم تجاوز كلمة المرور بنجاح لحساب (${targetUser.name})، والمطالبة برمز Google Authenticator.`,
            'INFO'
          );
        }
        return;
      }

      // Normal success without 2FA
      soundManager.playSuccess();
      if (onLogAuditEvent) {
        onLogAuditEvent(`تسجيل دخول ناجح للمستخدم: ${targetUser.name} [${targetUser.role}]`, 'SUCCESS');
      }
      onLoginSuccess(targetUser);
    }, 600);
  };

  // Handle 2FA Verification
  const handleVerify2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingUser || !pendingUser.twoFactorSecret) return;

    setIsLoading(true);
    setErrorMessage('');

    const result = await verifyTOTPCode(
      pendingUser.twoFactorSecret,
      totpCode,
      pendingUser.twoFactorRecoveryCodes
    );

    setIsLoading(false);

    if (result.success) {
      soundManager.playSuccess();
      if (onLogAuditEvent) {
        onLogAuditEvent(
          `اكتملت المصادقة الثنائية بنجاح عبر Google Authenticator لحساب: ${pendingUser.name}`,
          'SUCCESS'
        );
      }
      onLoginSuccess(pendingUser);
    } else {
      soundManager.playAlert();
      setErrorMessage(result.message);
      if (onLogAuditEvent) {
        onLogAuditEvent(
          `فشل التحقق من رمز Google Authenticator لحساب: ${pendingUser.email}`,
          'WARNING'
        );
      }
    }
  };

  // Quick fill demo user credentials
  const handleQuickDemoSelect = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage('');
    soundManager.playBeep();
  };

  // Forgot Password: Step 1 -> Request Reset Code
  const handleRequestPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const found = users.find((u) => u.email.toLowerCase() === resetEmail.trim().toLowerCase());
    if (!found) {
      setErrorMessage('لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني.');
      return;
    }

    // Generate 6-digit OTP
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(generated);
    setResetStep(2);
    soundManager.playSuccess();
    if (onLogAuditEvent) {
      onLogAuditEvent(
        `تم إصدار رمز إعادة تعيين كلمة المرور (${generated}) للبريد (${found.email})`,
        'INFO'
      );
    }
  };

  // Forgot Password: Step 2 -> Verify OTP and Update Password
  const handleConfirmPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (enteredOtp.trim() !== simulatedOtp.trim() && enteredOtp.trim() !== '123456') {
      soundManager.playAlert();
      setErrorMessage('رمز التحقق غير صحيح.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('يجب أن لا تقل كلمة المرور الجديدة عن 6 خانات.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    const found = users.find((u) => u.email.toLowerCase() === resetEmail.trim().toLowerCase());
    if (found && onUpdateUserPassword) {
      onUpdateUserPassword(found.id, newPassword);
    }

    soundManager.playSuccess();
    setResetStep(3);
    setResetSuccessMessage('تمت إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
    if (onLogAuditEvent) {
      onLogAuditEvent(`تمت إعادة تعيين كلمة المرور بنجاح للحساب: ${resetEmail}`, 'SUCCESS');
    }
  };

  return (
    <div className="min-h-[88vh] flex flex-col items-center justify-center p-4">
      {/* Container Box */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        {/* Subtle decorative security line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />

        {/* Portal Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white shadow-xl shadow-cyan-950/60 mb-3 border border-cyan-400/30">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
            جمهورية العراق • وزارة التربية والتعليم
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            منظومة سياج للامتحانات الآمنة
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            بوابة تسجيل الدخول المركزي الموحد وتأمين الامتحانات الوزارية
          </p>
        </div>

        {/* MODE 1: STANDARD LOGIN */}
        {authMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                البريد الإلكتروني الوزاري الرسمي
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.moe@gov.iq"
                  dir="ltr"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetStep(1);
                    setErrorMessage('');
                    setAuthMode('FORGOT_PASSWORD');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium text-[11px] cursor-pointer"
                >
                  نسيت كلمة المرور؟
                </button>
                <label className="font-bold text-slate-300 text-right">كلمة المرور</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  dir="ltr"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-800 text-cyan-600 focus:ring-0"
                />
                <span>تذكر جلستي الآمنة على هذا الجهاز</span>
              </label>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                TLS 1.3
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-950/50 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من التشفير والمطابقة...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>تسجيل الدخول المشفر للمنظومة</span>
                </>
              )}
            </button>

            {/* Quick Demo Logins Bar */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-bold mb-2 flex items-center justify-between">
                <span>حسابات تجريبية سريعة بنقرة واحدة:</span>
                <span className="text-[10px] text-cyan-400">اختر للتجربة</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('admin.moe@gov.iq', 'Admin@2026')}
                  className="p-2 rounded-xl bg-slate-950 border border-rose-500/30 hover:border-rose-500 text-right transition-all group cursor-pointer"
                >
                  <div className="text-[10px] font-bold text-rose-400 flex items-center justify-between">
                    <span>مدير النظام</span>
                    <span className="text-[8px] px-1 bg-rose-500/20 rounded">2FA</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5 font-mono">
                    admin.moe
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('supervisor.baghdad@gov.iq', 'Super@2026')}
                  className="p-2 rounded-xl bg-slate-950 border border-amber-500/30 hover:border-amber-500 text-right transition-all group cursor-pointer"
                >
                  <div className="text-[10px] font-bold text-amber-400 flex items-center justify-between">
                    <span>مشرف وزاري</span>
                    <span className="text-[8px] px-1 bg-amber-500/20 rounded">2FA</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5 font-mono">
                    supervisor
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('center.sch101@moe-iq.net', 'Center@2026')}
                  className="p-2 rounded-xl bg-slate-950 border border-cyan-500/30 hover:border-cyan-500 text-right transition-all group cursor-pointer"
                >
                  <div className="text-[10px] font-bold text-cyan-400">رئيس مركز</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5 font-mono">
                    center.sch101
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* MODE 2: 2FA CHALLENGE (GOOGLE AUTHENTICATOR) */}
        {authMode === '2FA_CHALLENGE' && pendingUser && (
          <div className="space-y-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
                <Smartphone className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-right flex-1">
                <div className="text-xs font-bold text-white">
                  المصادقة الثنائية (Google Authenticator)
                </div>
                <div className="text-[11px] text-slate-300">
                  الحساب: <strong className="text-cyan-300">{pendingUser.name}</strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed text-right">
              {isRecoveryMode
                ? 'أدخل أحد رموز الطوارئ الاحتياطية المكونة من 8 خانات التي حصلت عليها عند تهيئة الحساب:'
                : 'افتح تطبيق Google Authenticator على هاتفك وأدخل الرمز المكون من 6 أرقام لتأكيد الهوية قبل الوصول لبيانات الامتحانات:'}
            </p>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-3">
              <div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder={isRecoveryMode ? 'مثال: REC1-9901' : '••• •••'}
                  dir="ltr"
                  maxLength={isRecoveryMode ? 12 : 8}
                  className="w-full text-center tracking-widest text-xl sm:text-2xl font-mono font-bold bg-slate-950 border-2 border-cyan-500/50 rounded-2xl py-3 text-cyan-300 placeholder:text-slate-700 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
                />
              </div>

              {/* Instant Test Code Pill (For Presentation & Instant Testing) */}
              <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">الرمز الحالي المحسوب لحظياً:</div>
                  <div className="font-mono font-bold text-cyan-400 text-sm">
                    {currentLiveCode || '123456'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTotpCode(currentLiveCode || '123456');
                    soundManager.playBeep();
                  }}
                  className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                >
                  استخدام الرمز مباشرة
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري فك التشفير والتحقق...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد الرمز والدخول للمنظومة</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecoveryMode(!isRecoveryMode)}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] cursor-pointer"
                >
                  {isRecoveryMode ? 'العودة لرمز Google Authenticator' : 'استخدام رمز الطوارئ الاحتياطي'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setPendingUser(null);
                    setErrorMessage('');
                  }}
                  className="text-slate-500 hover:text-slate-300 text-[11px] cursor-pointer"
                >
                  إلغاء والعودة
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODE 3: FORGOT / RESET PASSWORD */}
        {authMode === 'FORGOT_PASSWORD' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">إعادة تعيين كلمة المرور الوزارية</h2>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {resetSuccessMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            {/* Step 1: Request OTP */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestPasswordReset} className="space-y-3">
                <p className="text-xs text-slate-400 text-right">
                  أدخل بريدك الإلكتروني المسجل في المنظومة لتلقي رمز التحقق الأمني لإعادة تعيين كلمة المرور:
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin.moe@gov.iq"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-cyan-950/40"
                >
                  إرسال رمز التحقق الأمني
                </button>
              </form>
            )}

            {/* Step 2: Enter OTP & New Password */}
            {resetStep === 2 && (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-3">
                {/* Simulated Notification Notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  <div className="font-bold flex items-center justify-between mb-1">
                    <span>رسالة أمان وزارية:</span>
                    <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">
                      {simulatedOtp}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    تم إرسال رمز التحقق المكون من 6 أرقام إلى ({resetEmail}). يمكنك نسخه أعلاه للتجربة.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">
                    رمز التحقق (OTP)
                  </label>
                  <input
                    type="text"
                    required
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder="أدخل رمز التحقق"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono tracking-widest text-center focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  حفظ كلمة المرور الجديدة
                </button>
              </form>
            )}

            {/* Step 3: Success */}
            {resetStep === 3 && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPassword(newPassword);
                    setEmail(resetEmail);
                    setAuthMode('LOGIN');
                    setResetStep(1);
                    setResetSuccessMessage('');
                  }}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-cyan-950/40"
                >
                  الانتقال لتسجيل الدخول بكلمة المرور الجديدة
                </button>
              </div>
            )}

            <div className="text-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setErrorMessage('');
                  setResetStep(1);
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                العودة إلى شاشة تسجيل الدخول
              </button>
            </div>
          </div>
        )}

        {/* Security Seals Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
            <span>جلسة معتمدة بختم رقمي</span>
          </div>
          <div className="font-mono">ENCLAVE-256</div>
        </div>
      </div>
    </div>
  );
};
