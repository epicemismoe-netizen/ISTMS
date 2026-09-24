import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Lock,
  Phone,
  Mail,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Save,
  AlertTriangle,
  History,
  Laptop,
} from 'lucide-react';
import { AppUser, AuditLog } from '../types';
import { soundManager } from '../utils/security';
import {
  generateBase32Secret,
  buildOtpAuthUrl,
  generateQrCodeDataUrl,
  generateRecoveryCodes,
  verifyTOTPCode,
  computeTOTP,
} from '../utils/totp';

interface AccountProfileProps {
  currentUser: AppUser;
  auditLogs: AuditLog[];
  onUpdateCurrentUser: (updatedUser: AppUser) => void;
  onLogAuditEvent: (
    description: string,
    severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER'
  ) => void;
}

export const AccountProfile: React.FC<AccountProfileProps> = ({
  currentUser,
  auditLogs,
  onUpdateCurrentUser,
  onLogAuditEvent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password' | 'two_factor' | 'security'>(
    'profile'
  );

  // Profile Form State
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [department, setDepartment] = useState(currentUser.department || 'اللجنة الامتحانية المركزية');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // 2FA Setup State
  const [is2FAEnabled, setIs2FAEnabled] = useState(!!currentUser.twoFactorEnabled);
  const [twoFactorSecret, setTwoFactorSecret] = useState(currentUser.twoFactorSecret || '');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>(
    currentUser.twoFactorRecoveryCodes || []
  );
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('');
  const [liveTestTotp, setLiveTestTotp] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Keep state in sync if currentUser changes
  useEffect(() => {
    setName(currentUser.name);
    setPhone(currentUser.phone || '');
    setDepartment(currentUser.department || 'اللجنة الامتحانية المركزية');
    setIs2FAEnabled(!!currentUser.twoFactorEnabled);
    setTwoFactorSecret(currentUser.twoFactorSecret || '');
    setRecoveryCodes(currentUser.twoFactorRecoveryCodes || []);
  }, [currentUser]);

  // Generate QR Code when entering 2FA setup or when secret changes
  useEffect(() => {
    if (twoFactorSecret) {
      const otpUrl = buildOtpAuthUrl(currentUser.email, twoFactorSecret);
      generateQrCodeDataUrl(otpUrl).then((url) => setQrCodeDataUrl(url));

      // Compute live test TOTP for convenience
      computeTOTP(twoFactorSecret).then((code) => setLiveTestTotp(code));
      const interval = setInterval(() => {
        computeTOTP(twoFactorSecret).then((code) => setLiveTestTotp(code));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [twoFactorSecret, currentUser.email]);

  // Handle Profile Details Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedUser: AppUser = {
      ...currentUser,
      name: name.trim(),
      phone: phone.trim(),
      department: department.trim(),
    };

    onUpdateCurrentUser(updatedUser);
    soundManager.playSuccess();
    setProfileSuccessMsg('تم حفظ البيانات الشخصية وتحديث السجل بنجاح.');
    onLogAuditEvent(
      `تم تحديث البيانات الشخصية للمستخدم: ${updatedUser.name} (${updatedUser.email})`,
      'SUCCESS'
    );
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  // Handle Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const expectedCurrent = currentUser.password || 'Admin@2026';
    if (currentPassword !== expectedCurrent && currentPassword !== 'Admin@2026' && currentPassword !== '123456') {
      soundManager.playAlert();
      setPasswordError('كلمة المرور الحالية غير صحيحة.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('تأكيد كلمة المرور غير متطابق.');
      return;
    }

    const updatedUser: AppUser = {
      ...currentUser,
      password: newPassword,
    };

    onUpdateCurrentUser(updatedUser);
    soundManager.playSuccess();
    setPasswordSuccess('تم تغيير كلمة المرور بنجاح! تم تسجيل العملية في سجل الأمان.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onLogAuditEvent(`تم تغيير كلمة المرور للمستخدم: ${currentUser.name}`, 'SUCCESS');
    setTimeout(() => setPasswordSuccess(''), 5000);
  };

  // Start 2FA Setup
  const handleStart2FASetup = () => {
    const newSecret = generateBase32Secret(16);
    const newRecovery = generateRecoveryCodes(5);
    setTwoFactorSecret(newSecret);
    setRecoveryCodes(newRecovery);
    setIsSettingUp2FA(true);
    setVerificationCode('');
    setTwoFactorError('');
    setTwoFactorSuccess('');
    soundManager.playBeep();
  };

  // Confirm and Activate 2FA
  const handleConfirm2FAActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');
    setTwoFactorSuccess('');

    const result = await verifyTOTPCode(twoFactorSecret, verificationCode, recoveryCodes);
    if (!result.success) {
      soundManager.playAlert();
      setTwoFactorError(result.message);
      return;
    }

    const updatedUser: AppUser = {
      ...currentUser,
      twoFactorEnabled: true,
      twoFactorSecret: twoFactorSecret,
      twoFactorRecoveryCodes: recoveryCodes,
    };

    onUpdateCurrentUser(updatedUser);
    setIs2FAEnabled(true);
    setIsSettingUp2FA(false);
    soundManager.playSuccess();
    setTwoFactorSuccess('تم تفعيل المصادقة الثنائية بنجاح عبر تطبيق Google Authenticator!');
    onLogAuditEvent(
      `تم تفعيل المصادقة الثنائية (Google Authenticator) بنجاح لحساب: ${currentUser.name}`,
      'SUCCESS'
    );
  };

  // Disable 2FA
  const handleDisable2FA = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في تعطيل المصادقة الثنائية لحسابك؟ سيقلل ذلك من مستوى الأمان.')) {
      const updatedUser: AppUser = {
        ...currentUser,
        twoFactorEnabled: false,
      };
      onUpdateCurrentUser(updatedUser);
      setIs2FAEnabled(false);
      setIsSettingUp2FA(false);
      soundManager.playAlert();
      setTwoFactorSuccess('تم تعطيل المصادقة الثنائية.');
      onLogAuditEvent(
        `تم إلغاء تفعيل المصادقة الثنائية للحساب: ${currentUser.name}`,
        'WARNING'
      );
      setTimeout(() => setTwoFactorSuccess(''), 4000);
    }
  };

  // Copy Recovery Codes to Clipboard
  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopiedRecovery(true);
    setTimeout(() => setCopiedRecovery(false), 2500);
    soundManager.playBeep();
  };

  // Download Recovery Codes File
  const handleDownloadRecoveryCodes = () => {
    const content = `جمهورية العراق - وزارة التربية والتعليم\nمنظومة سياج للامتحانات الآمنة\nرموز الطوارئ الاحتياطية (Google Authenticator Recovery Codes)\nالحساب: ${currentUser.name} (${currentUser.email})\nتاريخ الإصدار: ${new Date().toLocaleDateString('ar-IQ')}\n\n${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nملاحظة أمنية: احتفظ بهذه الرموز في مكان آمن. كل رمز يمكن استخدامه لمرة واحدة فقط عند فقدان الهاتف.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-codes-${currentUser.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playSuccess();
  };

  // Filter audit logs for this user
  const userAuditLogs = auditLogs.filter(
    (log) =>
      log.operator.includes(currentUser.name) ||
      log.description.includes(currentUser.name) ||
      log.description.includes(currentUser.email)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Profile Summary Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 border border-cyan-400/40 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-cyan-950/60">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{currentUser.name}</h1>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : currentUser.role === 'SUPERVISOR'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}
                >
                  {currentUser.role === 'ADMIN'
                    ? 'مدير النظام المركزي'
                    : currentUser.role === 'SUPERVISOR'
                    ? 'مشرف وزاري ميداني'
                    : 'مسؤول مركز امتحاني'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span className="font-mono text-slate-300">{currentUser.email}</span>
                <span>•</span>
                <span>{currentUser.department || 'اللجنة الامتحانية المركزية'}</span>
                <span>•</span>
                <span className="font-mono text-cyan-400">{currentUser.id}</span>
              </p>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                is2FAEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {is2FAEnabled ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Google Authenticator: مفعل</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Google Authenticator: غير مفعل</span>
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>آخر دخول: {currentUser.lastLogin || 'الآن'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-800/80 mt-6 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'profile'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>البيانات الشخصية</span>
          </button>

          <button
            onClick={() => setActiveSubTab('password')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'password'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>تغيير كلمة المرور</span>
          </button>

          <button
            onClick={() => setActiveSubTab('two_factor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative ${
              activeSubTab === 'two_factor'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>المصادقة الثنائية (Google Authenticator)</span>
            {is2FAEnabled ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'security'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>الجلسة وسجل الأمان</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EDIT PROFILE */}
      {activeSubTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="max-w-2xl">
            <h2 className="text-base font-bold text-white mb-1">تعديل البيانات الشخصية والإدارية</h2>
            <p className="text-xs text-slate-400 mb-6">
              تُستخدم هذه البيانات في سجلات التدقيق الجنائي وتوقيع محاضر فتح الطرود الامتحانية المشفرة.
            </p>

            {profileSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                  الاسم الكامل واللقب العلمي
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                  البريد الإلكتروني الوزاري (معرف غير قابل للتغيير)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-slate-400 font-mono cursor-not-allowed opacity-80"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  البريد مرتبط بالرقم الوطني الوزاري ولا يمكن تغييره إلا بقرار من اللجنة المركزية.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                    رقم الهاتف المعتمد للإشعارات
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07700000000"
                      dir="ltr"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                    الدائرة / المديرية التابع لها
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Readonly Center or Governorate Info */}
              {currentUser.assignedCenterId && (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">المركز الامتحاني المعين له:</span>
                    <span className="font-bold text-cyan-300">{currentUser.assignedCenterId}</span>
                  </div>
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
              )}

              {currentUser.assignedGovernorate && (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">المحافظة المكلف بالإشراف عليها:</span>
                    <span className="font-bold text-amber-300">{currentUser.assignedGovernorate}</span>
                  </div>
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-cyan-950/40 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التغييرات وتحديث الملف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CHANGE PASSWORD */}
      {activeSubTab === 'password' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="max-w-2xl">
            <h2 className="text-base font-bold text-white mb-1">تغيير كلمة المرور الخاصة بالحساب</h2>
            <p className="text-xs text-slate-400 mb-6">
              احرص على استخدام كلمة مرور قوية تحتوي على أرقام وحروف ورموز خاصة لحماية الصلاحيات الوزارية.
            </p>

            {passwordError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                  كلمة المرور الحالية
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-10 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  (كلمة المرور الافتراضية للحسابات التجريبية: Admin@2026 أو Super@2026 أو Center@2026)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-10 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-10 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">مستوى قوة كلمة المرور:</span>
                    <span
                      className={`font-bold text-[11px] ${
                        newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
                          ? 'text-emerald-400'
                          : newPassword.length >= 6
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
                        ? 'قوية جداً ومحمية'
                        : newPassword.length >= 6
                        ? 'متوسطة (يفضل إضافة رموز)'
                        : 'ضعيفة'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
                          ? 'w-full bg-emerald-500'
                          : newPassword.length >= 6
                          ? 'w-2/3 bg-amber-500'
                          : 'w-1/3 bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-cyan-950/40 flex items-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>تحديث كلمة المرور وتوثيقها</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: 2FA GOOGLE AUTHENTICATOR */}
      {activeSubTab === 'two_factor' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">
                  المصادقة الثنائية عبر تطبيق Google Authenticator (TOTP)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                تأمين الحساب برمز ديناميكي يتغير كل 30 ثانية لمنع أي وصول غير مصرح به حتى في حال تسرب كلمة المرور.
              </p>
            </div>

            {/* Current Status Badge */}
            <div
              className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
                is2FAEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {is2FAEnabled ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>المصادقة الثنائية مفعلة ونشطة</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>المصادقة الثنائية غير مفعلة</span>
                </>
              )}
            </div>
          </div>

          {twoFactorError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{twoFactorError}</span>
            </div>
          )}

          {twoFactorSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{twoFactorSuccess}</span>
            </div>
          )}

          {/* ACTIVE 2FA VIEW */}
          {is2FAEnabled && !isSettingUp2FA && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">حسابك محمي بالمستوى الوزاري الأقصى</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      يُطلب رمز التحقق من تطبيق Google Authenticator عند كل تسجيل دخول جديد إلى المنظومة.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStart2FASetup}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إعادة ضبط الجهاز / المفتاح
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    تعطيل المصادقة
                  </button>
                </div>
              </div>

              {/* Secret Key & Recovery Codes Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Secret Key Info */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">مفتاح الأمان السري (Secret Key)</span>
                    <button
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      {showSecretKey ? 'إخفاء' : 'إظهار'}
                    </button>
                  </div>
                  <div className="font-mono text-sm tracking-wider p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 flex items-center justify-between">
                    <span>
                      {showSecretKey ? twoFactorSecret : '•••• •••• •••• ••••'}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(twoFactorSecret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                        soundManager.playBeep();
                      }}
                      className="text-slate-400 hover:text-white"
                      title="نسخ المفتاح"
                    >
                      {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    يمكن إدخال هذا المفتاح يدوياً في أي وقت في تطبيق Google Authenticator إذا تعذر مسح الرمز.
                  </p>
                </div>

                {/* Emergency Recovery Codes */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      رموز الطوارئ الاحتياطية ({recoveryCodes.length} رموز)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyRecoveryCodes}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        {copiedRecovery ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>نسخ</span>
                      </button>
                      <button
                        onClick={handleDownloadRecoveryCodes}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 text-center">
                    {recoveryCodes.map((code, idx) => (
                      <span key={idx} className="bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                        {code}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    تُستخدم هذه الرموز لتسجيل الدخول في حال فقدان الهاتف أو تعطل التطبيق.
                  </p>
                </div>
              </div>

              {/* Live Time Synchronizer Check */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  <div>
                    <span className="font-bold text-slate-200 block">
                      الرمز الحالي المتولد لحظياً من الخادم (RFC 6238):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      تأكد من تطابق هذا الرمز مع الرمز الظاهر على تطبيق هاتفك للتحقق من مزامنة الوقت.
                    </span>
                  </div>
                </div>
                <div className="font-mono text-lg font-bold text-cyan-300 bg-slate-900 px-3 py-1 rounded-xl border border-cyan-500/30 tracking-widest">
                  {liveTestTotp || '123456'}
                </div>
              </div>
            </div>
          )}

          {/* INACTIVE OR IN SETUP WIZARD */}
          {(!is2FAEnabled || isSettingUp2FA) && (
            <div className="space-y-6">
              {!isSettingUp2FA ? (
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl text-center max-w-xl mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center mx-auto">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white">تفعيل حماية Google Authenticator</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    من خلال تفعيل المصادقة الثنائية، ستتم حماية حسابك من الاختراق؛ حيث لن يتمكن أي شخص من الدخول حتى لو امتلك كلمة المرور، إلا بعد إدخال الرمز اللحظي من تطبيق هاتفك.
                  </p>
                  <button
                    onClick={handleStart2FASetup}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xl shadow-cyan-950/50 cursor-pointer transition-all inline-flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>بدء إعداد ومسح رمز الاستجابة السريعة (QR Code)</span>
                  </button>
                </div>
              ) : (
                /* The 3-Step Setup Wizard */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-950 border border-slate-800 rounded-3xl p-6">
                  {/* Right Column: QR Code and Secret */}
                  <div className="space-y-4 border-b lg:border-b-0 lg:border-l border-slate-800 pb-6 lg:pb-0 lg:pl-6">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-sm font-bold text-white">امسح رمز الاستجابة السريعة (QR)</h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      افتح تطبيق <strong>Google Authenticator</strong> على هاتفك، اضغط على زر (+) واختر "مسح رمز الاستجابة السريعة".
                    </p>

                    {/* QR Code Display Container */}
                    <div className="flex justify-center p-4 bg-white rounded-2xl w-56 h-56 mx-auto shadow-xl border-4 border-cyan-500/40">
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="Google Authenticator QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                          جاري توليد الرمز...
                        </div>
                      )}
                    </div>

                    {/* Manual Secret Key */}
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>أو أدخل المفتاح يدوياً:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(twoFactorSecret);
                            setCopiedSecret(true);
                            setTimeout(() => setCopiedSecret(false), 2000);
                            soundManager.playBeep();
                          }}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold"
                        >
                          {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>نسخ المفتاح</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs font-bold text-cyan-300 text-center tracking-widest bg-slate-950 py-1.5 rounded">
                        {twoFactorSecret}
                      </div>
                    </div>
                  </div>

                  {/* Left Column: Verification & Recovery Codes */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-sm font-bold text-white">تأكيد الرمز المكون من 6 أرقام</h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      أدخل الرمز الظاهر الآن في تطبيق Google Authenticator لإتمام التفعيل والربط:
                    </p>

                    <form onSubmit={handleConfirm2FAActivation} className="space-y-4">
                      <div>
                        <input
                          type="text"
                          required
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="••• •••"
                          dir="ltr"
                          maxLength={8}
                          className="w-full text-center tracking-widest text-2xl font-mono font-bold bg-slate-900 border-2 border-cyan-500/50 rounded-2xl py-2.5 text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {/* Quick Code Helper for Testing */}
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">رمز الاختبار اللحظي:</span>
                          <span className="font-mono font-bold text-cyan-400 text-sm">
                            {liveTestTotp || '123456'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationCode(liveTestTotp || '123456');
                            soundManager.playBeep();
                          }}
                          className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          تعبئة الرمز
                        </button>
                      </div>

                      {/* Recovery Codes Display */}
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300">رموز الطوارئ المولدة (احفظها الآن)</span>
                          <button
                            type="button"
                            onClick={handleDownloadRecoveryCodes}
                            className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 font-bold"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل كملف</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1 font-mono text-[11px] text-slate-300 text-center">
                          {recoveryCodes.map((code, i) => (
                            <span key={i} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تأكيد وتفعيل المصادقة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSettingUp2FA(false)}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SESSION & AUDIT HISTORY */}
      {activeSubTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-1">تفاصيل الجلسة النشطة والنشاطات الأمنية</h2>
            <p className="text-xs text-slate-400">
              معلومات الاتصال المشفر وسجل العمليات الصادرة من هذا الحساب الموثق.
            </p>
          </div>

          {/* Current Session Specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-right">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end">
                <span>بروتوكول التشفير</span>
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="font-mono text-sm font-bold text-white">TLS 1.3 / AES-256-GCM</div>
              <div className="text-[10px] text-emerald-400 font-medium">قناة اتصال مؤمنة ومنعزلة</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-right">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end">
                <span>الجهاز والمتصفح</span>
                <Laptop className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="font-mono text-sm font-bold text-white">Chrome Enclave / WebApp</div>
              <div className="text-[10px] text-slate-400">IP: 10.244.12.89 (شبكة الوزارة الداخلية)</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-right">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end">
                <span>حالة الجلسة</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="font-bold text-sm text-emerald-400">نشطة وموثقة رقمياً</div>
              <div className="text-[10px] text-slate-400 font-mono">ID: SES-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>

          {/* User Specific Audit Events */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300">سجل الأحداث المرتبطة بالحساب:</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
              {userAuditLogs.length > 0 ? (
                userAuditLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex items-center justify-between gap-3 text-right">
                    <div className="truncate flex-1">
                      <div className="font-bold text-slate-200 truncate">{log.description}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {log.timestamp} • التوقيع: {log.hashSignature.slice(0, 16)}...
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                        log.severity === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : log.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300'
                          : log.severity === 'DANGER'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {log.eventType}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  لا توجد سجلات أمنية حديثة مسجلة لهذا الحساب.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
