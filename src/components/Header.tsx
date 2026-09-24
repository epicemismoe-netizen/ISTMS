import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Printer,
  Search,
  BookOpen,
  Volume2,
  VolumeX,
  Lock,
  Radio,
  Clock,
  AlertTriangle,
  FilePlus,
  Users,
  ChevronDown,
  UserCheck,
  LogOut,
  Shield,
  Sliders,
} from 'lucide-react';
import { soundManager } from '../utils/security';
import { AppUser } from '../types';

interface HeaderProps {
  activeTab:
    | 'ministry'
    | 'school'
    | 'exam_editor'
    | 'users'
    | 'centers_mgmt'
    | 'system_config'
    | 'forensic'
    | 'security_guide'
    | 'profile';
  setActiveTab: (
    tab:
      | 'ministry'
      | 'school'
      | 'exam_editor'
      | 'users'
      | 'centers_mgmt'
      | 'system_config'
      | 'forensic'
      | 'security_guide'
      | 'profile'
  ) => void;
  isEmergencyActive: boolean;
  connectedSchoolsCount: number;
  totalStudentsQuota: number;
  activeExamTitle: string;
  isAlternateModel: boolean;
  currentUser: AppUser;
  allUsers: AppUser[];
  systemConfig?: import('../types').SystemConfig;
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isEmergencyActive,
  connectedSchoolsCount,
  totalStudentsQuota,
  activeExamTitle,
  isAlternateModel,
  currentUser,
  allUsers,
  systemConfig,
  onSwitchUser,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (
    tab:
      | 'ministry'
      | 'school'
      | 'exam_editor'
      | 'users'
      | 'centers_mgmt'
      | 'system_config'
      | 'forensic'
      | 'security_guide'
      | 'profile'
  ) => {
    if (soundEnabled) soundManager.playBeep();
    setActiveTab(tab);
  };

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-2xl backdrop-blur-md bg-slate-900/95">
      {/* Top Banner with Security Notice & Live Status */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Right: Security state */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>الشبكة الوزارية المشفرة (TLS 1.3 Strict • AES-256-GCM)</span>
            </div>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline text-[11px]">
              نظام المستويات: <span className="font-mono text-cyan-400">وزارة • مشرفون • مراكز امتحانية</span>
            </span>
          </div>

          {/* Left: Emergency Alert, Switch User, Clock */}
          <div className="flex items-center gap-3">
            {/* Quick Switch User Simulator */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-rose-400'
                      : currentUser.role === 'SUPERVISOR'
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                />
                <span className="text-slate-400">الحساب:</span>
                <span className="font-bold text-white max-w-[120px] truncate">{currentUser.name.split('(')[0]}</span>
                <span
                  className={`px-1 rounded text-[9px] font-bold ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-rose-500/20 text-rose-300'
                      : currentUser.role === 'SUPERVISOR'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  {currentUser.role === 'ADMIN' ? 'مسؤول' : currentUser.role === 'SUPERVISOR' ? 'مشرف' : 'مركز'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-right space-y-1">
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-bold border-b border-slate-800">
                    تبديل الحساب لتجربة الصلاحيات الهرمية:
                  </div>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setShowUserDropdown(false);
                        soundManager.playBeep();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all text-right ${
                        currentUser.id === u.id
                          ? 'bg-cyan-600/20 text-cyan-200 border border-cyan-500/30'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-bold text-white text-[11px] truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-500/20 text-rose-300'
                            : u.role === 'SUPERVISOR'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {u.role === 'ADMIN' ? 'ADMIN' : u.role === 'SUPERVISOR' ? 'SUPER' : 'CENTER'}
                      </span>
                    </button>
                  ))}

                  <div className="pt-2 mt-1 border-t border-slate-800 space-y-1">
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          handleTabChange('system_config');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg text-xs bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 transition-all text-right font-bold cursor-pointer border border-indigo-800/40"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                          <span>إدارة مفاصل النظام والحقول</span>
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono">
                          ADMIN
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handleTabChange('profile');
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-xs bg-slate-800/60 hover:bg-slate-800 text-cyan-300 transition-all text-right font-bold cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>إدارة الحساب والأمان</span>
                      </span>
                      {currentUser.twoFactorEnabled ? (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                          2FA نشط
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                          2FA معطل
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs hover:bg-rose-500/10 text-rose-300 transition-all text-right font-bold cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>تسجيل الخروج من المنظومة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Quick Button */}
            <button
              onClick={onLogout}
              title="تسجيل الخروج الآمن"
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>

            {isEmergencyActive ? (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-bold animate-pulse text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>حالة طوارئ: نموذج بديل</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>توقيت الوزارة:</span>
                <span className="font-bold text-cyan-300">{currentTime || '07:44:20 ص'}</span>
              </div>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تفعيل المؤثرات الصوتية'}
              className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Ministry Brand & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                {systemConfig?.theme.appName || 'منظومة سياج للامتحانات الآمنة'}
              </h1>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold">
                إصدار 5.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {systemConfig?.theme.ministryName || 'وزارة التربية العراقية'} - {systemConfig?.theme.departmentName || 'اللجنة الدائمة للامتحانات العامة'}
            </p>
          </div>
        </div>

        {/* Current Active Exam Info pill */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-xl">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="text-right text-xs">
            <div className="text-slate-400 text-[10px]">النموذج الفعال:</div>
            <div className="font-bold text-slate-200 truncate max-w-[190px]">
              {activeExamTitle}
            </div>
          </div>
          <div className="border-r border-slate-800 pr-3 mr-1 text-right text-xs">
            <div className="text-slate-400 text-[10px]">المراكز والكوتا:</div>
            <div className="font-bold text-cyan-400">
              {connectedSchoolsCount} مراكز • {totalStudentsQuota} طالب
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 w-full lg:w-auto overflow-x-auto">
          {/* Operations Tab: Available to Admin & Supervisor */}
          {currentUser.role !== 'SCHOOL_CENTER' && (
            <button
              id="tab-ministry"
              onClick={() => handleTabChange('ministry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ministry'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>غرفة العمليات المركزية</span>
            </button>
          )}

          {/* School Terminal: Always accessible */}
          <button
            id="tab-school"
            onClick={() => handleTabChange('school')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'school'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>محطة طباعة المركز</span>
          </button>

          {/* Exam Questions Editor: Admin & Supervisor */}
          {currentUser.role !== 'SCHOOL_CENTER' && (
            <button
              id="tab-exam-editor"
              onClick={() => handleTabChange('exam_editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'exam_editor'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>بنك الأسئلة (أ / ب / ج)</span>
            </button>
          )}

          {/* Centers Management & EMIS Integration: Admin & Supervisor */}
          {currentUser.role !== 'SCHOOL_CENTER' && (
            <button
              id="tab-centers-mgmt"
              onClick={() => handleTabChange('centers_mgmt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'centers_mgmt'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>المراكز والـ EMIS</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-bold">
                {connectedSchoolsCount}
              </span>
            </button>
          )}

          {/* User Management & Roles: Admin & Supervisor */}
          {currentUser.role !== 'SCHOOL_CENTER' && (
            <button
              id="tab-users"
              onClick={() => handleTabChange('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>المستخدمين والدعوات</span>
            </button>
          )}

          {/* Forensic Inspector */}
          <button
            id="tab-forensic"
            onClick={() => handleTabChange('forensic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'forensic'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>الكاشف الجنائي</span>
          </button>

          {/* Security Guide */}
          <button
            id="tab-security-guide"
            onClick={() => handleTabChange('security_guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security_guide'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>البروتوكول الأمني</span>
          </button>

          {/* Admin System Settings & Customization Tab (Exclusive for ADMIN role) */}
          {currentUser.role === 'ADMIN' && (
            <button
              id="tab-system-config"
              onClick={() => handleTabChange('system_config')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === 'system_config'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/50 shadow-md shadow-indigo-950/40'
                  : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/40 border-indigo-500/30'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>إدارة مفاصل النظام والحقول</span>
              <span className="text-[9px] px-1 py-0.2 bg-purple-500/20 text-purple-300 rounded font-bold">
                مسؤول
              </span>
            </button>
          )}

          {/* Account Profile & Security Management Tab */}
          <button
            id="tab-profile"
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/50 shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>إدارة الحساب والأمان</span>
            {currentUser.twoFactorEnabled ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500" title="Google 2FA مفعل" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Google 2FA غير مفعل" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
