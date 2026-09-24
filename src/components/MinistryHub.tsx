import React, { useState } from 'react';
import {
  ExamPackage,
  SchoolCenter,
  AuditLog,
  EducationStage,
  AppUser,
} from '../types';
import {
  Radio,
  Lock,
  Unlock,
  AlertOctagon,
  RefreshCw,
  Search,
  CheckCircle2,
  Printer,
  ShieldAlert,
  Server,
  Building,
  KeyRound,
  FileText,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Send,
  Zap,
  GraduationCap,
  Layers,
  School,
  Plus,
  Trash2,
} from 'lucide-react';
import { soundManager } from '../utils/security';

interface MinistryHubProps {
  currentUser?: AppUser;
  exam: ExamPackage;
  alternateExamB: ExamPackage;
  alternateExamC?: ExamPackage;
  schools: SchoolCenter[];
  auditLogs: AuditLog[];
  isEmergencyActive: boolean;
  onBroadcastUnlock: () => void;
  onTriggerEmergencyKillSwitch: () => void;
  onTriggerEmergencyModelC?: () => void;
  onRestoreNormalExam: () => void;
  onSelectSchoolTerminal: (schoolId: string) => void;
  onToggleSchoolSuspension: (schoolId: string) => void;
  onAddSchoolCenter?: (school: SchoolCenter) => void;
  onNavigateToCenters?: () => void;
  onUpdateZeroHour?: (newTime: string) => void;
}

export const MinistryHub: React.FC<MinistryHubProps> = ({
  currentUser,
  exam,
  alternateExamB,
  alternateExamC,
  schools,
  auditLogs,
  isEmergencyActive,
  onBroadcastUnlock,
  onTriggerEmergencyKillSwitch,
  onTriggerEmergencyModelC,
  onRestoreNormalExam,
  onSelectSchoolTerminal,
  onToggleSchoolSuspension,
  onAddSchoolCenter,
  onNavigateToCenters,
  onUpdateZeroHour,
}) => {
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<'ALL' | EducationStage>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showExamContentModal, setShowExamContentModal] = useState<boolean>(false);
  const [showAddCenterModal, setShowAddCenterModal] = useState<boolean>(false);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [isEditingZeroHour, setIsEditingZeroHour] = useState<boolean>(false);
  const [zeroHourInput, setZeroHourInput] = useState<string>(exam.zeroHourUnlockTime);

  // New center modal state
  const [newCenterName, setNewCenterName] = useState('');
  const [newCenterCode, setNewCenterCode] = useState('');
  const [newCenterStage, setNewCenterStage] = useState<EducationStage>('SECONDARY');
  const [newCenterGov, setNewCenterGov] = useState('بغداد');
  const [newCenterDirectorate, setNewCenterDirectorate] = useState('الكرخ الأولى');
  const [newCenterProctor, setNewCenterProctor] = useState('');
  const [newCenterPhone, setNewCenterPhone] = useState('');
  const [newCenterQuota, setNewCenterQuota] = useState(60);

  // Filter schools by governorate, stage and search
  const filteredSchools = schools.filter((s) => {
    const matchesGov = selectedGovernorate === 'ALL' || s.governorate === selectedGovernorate;
    const matchesStage =
      selectedStage === 'ALL' ||
      s.educationStage === selectedStage ||
      s.educationStage === 'ALL';
    const matchesSearch =
      s.name.includes(searchQuery) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.chiefProctorName.includes(searchQuery) ||
      s.directorate.includes(searchQuery);
    return matchesGov && matchesStage && matchesSearch;
  });

  // Calculate statistics
  const totalStudents = schools.reduce((acc, s) => acc + (s.examCopiesQuota || s.registeredStudentsCount), 0);
  const totalPrinted = schools.reduce((acc, s) => acc + s.currentPrintedCount, 0);
  const unlockedCount = schools.filter(
    (s) => s.status === 'AUTHORIZED_PRINT' || s.status === 'PRINTING_ACTIVE' || s.status === 'PRINT_FINISHED'
  ).length;
  const finishedCount = schools.filter((s) => s.status === 'PRINT_FINISHED').length;

  const handleBroadcastClick = () => {
    soundManager.playBeep();
    setIsBroadcasting(true);
    setTimeout(() => {
      onBroadcastUnlock();
      setIsBroadcasting(false);
      soundManager.playSuccess();
    }, 1200);
  };

  const handleSaveZeroHour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zeroHourInput.trim() || !onUpdateZeroHour) return;
    onUpdateZeroHour(zeroHourInput.trim());
    setIsEditingZeroHour(false);
    soundManager.playSuccess();
  };

  const handleCreateCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenterName || !newCenterCode) return;

    const quotaNum = Number(newCenterQuota) || 60;
    const pin1 = Math.floor(1000 + Math.random() * 9000).toString();
    const pin2 = Math.floor(1000 + Math.random() * 9000).toString();
    const pin3 = Math.floor(1000 + Math.random() * 9000).toString();

    const generatedCenter: SchoolCenter = {
      id: `SCH-${Date.now().toString().slice(-4)}`,
      code: newCenterCode.toUpperCase(),
      name: newCenterName,
      educationStage: newCenterStage,
      stageNameArabic:
        newCenterStage === 'PRIMARY'
          ? 'المرحلة الابتدائية'
          : newCenterStage === 'INTERMEDIATE'
          ? 'المرحلة المتوسطة'
          : newCenterStage === 'SECONDARY'
          ? 'المرحلة الإعدادية والثانوية'
          : 'شامل لكافة المراحل',
      assignedGrades:
        newCenterStage === 'PRIMARY'
          ? ['السادس الابتدائي']
          : newCenterStage === 'INTERMEDIATE'
          ? ['الثالث المتوسط']
          : ['السادس الإعدادي'],
      governorate: newCenterGov,
      directorate: newCenterDirectorate,
      chiefProctorName: newCenterProctor || 'أ. رئيس المركز الامتحاني',
      chiefProctorPhone: newCenterPhone || '07700000000',
      registeredStudentsCount: quotaNum,
      examCopiesQuota: quotaNum,
      printerModel: 'Kyocera High-Security Network Spooler',
      printerStatus: 'ONLINE',
      printerIp: `192.168.${Math.floor(Math.random() * 80) + 10}.${Math.floor(Math.random() * 90) + 10} (SECURE)`,
      assignedExamId: exam.id,
      status: 'PACKAGE_RECEIVED',
      currentPrintedCount: 0,
      twoFactorPin: pin1,
      examCommittee: [
        {
          id: `COM-${newCenterCode}-1`,
          roleTitle: 'رئيس اللجنة الامتحانية بالمركز',
          name: newCenterProctor || 'أ. رئيس المركز الامتحاني',
          phone: newCenterPhone || '07700000000',
          twoFactorPin: pin1,
          verified: false,
          smsStatus: 'DELIVERED',
          smsSentAt: '07:30 ص',
        },
        {
          id: `COM-${newCenterCode}-2`,
          roleTitle: 'المشرف التربوي / الوزاري المتابع',
          name: 'د. المشرف التربوي الوزاري المتابع',
          phone: '07801112233',
          twoFactorPin: pin2,
          verified: false,
          smsStatus: 'DELIVERED',
          smsSentAt: '07:30 ص',
        },
        {
          id: `COM-${newCenterCode}-3`,
          roleTitle: 'عضو اللجنة الامتحانية (المراقب الأول)',
          name: 'أ. المراقب الأول للجنة الامتحانية',
          phone: '07703334455',
          twoFactorPin: pin3,
          verified: false,
          smsStatus: 'DELIVERED',
          smsSentAt: '07:30 ص',
        },
      ],
      watermarkSignatureKey: `KEY-SIG-${newCenterGov.substring(0, 3)}-${newCenterCode}`,
      isTampered: false,
      offlineEmergencyCode: `EMG-${newCenterCode}-99`,
    };

    if (onAddSchoolCenter) {
      onAddSchoolCenter(generatedCenter);
    }

    soundManager.playSuccess();
    setShowAddCenterModal(false);
    setNewCenterName('');
    setNewCenterCode('');
  };

  return (
    <div className="space-y-6">
      {/* Top Ministerial Alert if Emergency Active */}
      {isEmergencyActive && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-2 border-rose-500 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-300">
              <AlertOctagon className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-black text-rose-100">
                حالة طوارئ نشطة: تم تشغيل النموذج البديل [{exam.modelGroup}]
              </h2>
              <p className="text-xs text-rose-200 mt-1">
                تم إلغاء النموذج السابق فورياً في كافة الطابعات وتحويل البث المشفر للنموذج البديل ({exam.modelGroup}) لإحباط أي تسريب محتمل.
              </p>
            </div>
          </div>
          <button
            onClick={onRestoreNormalExam}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 transition-colors text-xs cursor-pointer shadow-md"
          >
            إلغاء حالة الطوارئ واستعادة النموذج الأساسي (A)
          </button>
        </div>
      )}

      {/* Main KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>المراكز المعتمدة</span>
            <Building className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{schools.length}</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">ابتدائي / متوسط / ثانوي</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إجمالي حصة الطلبة</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalStudents}</div>
          <div className="text-[11px] text-slate-400 mt-1">نسخة مصرح بطباعتها رسمياً</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>النسخ المطبوعة لحظياً</span>
            <Printer className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{totalPrinted}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            من إجمالي {totalStudents} ({totalStudents > 0 ? Math.round((totalPrinted / totalStudents) * 100) : 0}%)
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>المراكز المفكوك تشفيرها</span>
            <Unlock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {unlockedCount} <span className="text-sm font-normal text-slate-400">/ {schools.length}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">مصرح لها ببدء الطباعة</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>مراكز أنجزت الطباعة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{finishedCount}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">جاهزة لبدء الامتحان</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>النموذج النشط حالياً</span>
            <KeyRound className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            المجموعة [{exam.modelGroup}]
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {exam.modelGroup === 'A' ? 'النموذج الأساسي' : exam.modelGroup === 'B' ? 'احتياطي أول' : 'احتياطي ثانٍ'}
          </div>
        </div>
      </div>

      {/* Ministerial Central Command Action Bar */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-bold">
                غرفة العمليات المركزية
              </span>
              <h2 className="text-lg font-black text-white">
                إطلاق مفاتيح التشفير اللحظي والتبديل الطارئ
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
              <span>
                الامتحان: <strong className="text-slate-200">{exam.title}</strong> • المرحلة: <strong className="text-cyan-400">{exam.gradeLevel}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                موعد وقت الصفر للفك:{' '}
                <strong className="text-amber-300 font-mono text-sm">{exam.zeroHourUnlockTime}</strong>
                {onUpdateZeroHour && (
                  <button
                    onClick={() => setIsEditingZeroHour(!isEditingZeroHour)}
                    className="text-cyan-400 hover:text-cyan-300 underline text-[11px] font-semibold cursor-pointer mr-1"
                  >
                    [تعديل موعد الفك]
                  </button>
                )}
              </span>
            </div>

            {isEditingZeroHour && (
              <form onSubmit={handleSaveZeroHour} className="mt-2.5 flex items-center gap-2">
                <span className="text-xs text-slate-300">حدد وقت الصفر الجديد:</span>
                <input
                  type="text"
                  value={zeroHourInput}
                  onChange={(e) => setZeroHourInput(e.target.value)}
                  placeholder="مثال: 07:45 ص أو 08:00 ص"
                  className="bg-slate-950 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  تطبيق فوري
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingZeroHour(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                >
                  إلغاء
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Exam Content Button */}
            <button
              onClick={() => setShowExamContentModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>معاينة النموذج [{exam.modelGroup}]</span>
            </button>

            {/* Broadcast Zero-Hour Unlock Pulse Button */}
            <button
              onClick={handleBroadcastClick}
              disabled={isBroadcasting}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-lg cursor-pointer ${
                isBroadcasting
                  ? 'bg-amber-600 opacity-80 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50'
              }`}
            >
              <Zap className={`w-4 h-4 ${isBroadcasting ? 'animate-spin' : ''}`} />
              <span>
                {isBroadcasting
                  ? 'جاري بث نبضة فك التشفير اللحظي...'
                  : 'بث نبضة فتح التشفير اللحظي لجميع المراكز'}
              </span>
            </button>

            {/* Red Emergency Kill-Switch: Model B */}
            <button
              onClick={onTriggerEmergencyKillSwitch}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-950/60 cursor-pointer"
              title="يوقف طباعة النموذج الحالي ويستدعي النموذج الاحتياطي B"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>استدعاء النموذج (B)</span>
            </button>

            {/* Emergency Model C */}
            {onTriggerEmergencyModelC && (
              <button
                onClick={onTriggerEmergencyModelC}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-purple-950/60 cursor-pointer"
                title="تفعيل النموذج الاحتياطي الثاني C للطوارئ القصوى"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>استدعاء النموذج (C)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* School Centers Live Status Grid & Search & Filter by Stage */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                سجل المراكز الامتحانية والطابعات المشفرة ({filteredSchools.length})
              </h3>
              <p className="text-slate-400 text-xs">
                مقسمة حسب المراحل التعليمية (ابتدائي، متوسط، إعدادي، وشامل)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToCenters && currentUser?.role !== 'SCHOOL_CENTER' && (
              <button
                id="btn-goto-emis-sync"
                onClick={onNavigateToCenters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>إدارة ومزامنة EMIS</span>
              </button>
            )}

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setShowAddCenterModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مركز امتحاني جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar: Search + Governorate + Stage */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Stage Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            <span className="text-slate-500 px-2 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> المرحلة:
            </span>
            <button
              onClick={() => setSelectedStage('ALL')}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                selectedStage === 'ALL'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              كافة المراحل
            </button>
            <button
              onClick={() => setSelectedStage('PRIMARY')}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                selectedStage === 'PRIMARY'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الابتدائي
            </button>
            <button
              onClick={() => setSelectedStage('INTERMEDIATE')}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                selectedStage === 'INTERMEDIATE'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              المتوسط
            </button>
            <button
              onClick={() => setSelectedStage('SECONDARY')}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                selectedStage === 'SECONDARY'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الإعدادي / الثانوي
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالمركز، الكود، المشرف..."
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pr-9 pl-4 py-2 rounded-xl focus:outline-none focus:border-cyan-500 w-52 sm:w-60"
              />
            </div>

            {/* Governorate Filter */}
            <select
              value={selectedGovernorate}
              onChange={(e) => setSelectedGovernorate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">كافة المحافظات</option>
              <option value="بغداد">بغداد</option>
              <option value="البصرة">البصرة</option>
              <option value="نينوى">نينوى</option>
              <option value="كركوك">كركوك</option>
              <option value="كربلاء المقدسة">كربلاء المقدسة</option>
            </select>
          </div>
        </div>

        {/* Table of Centers */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="py-3 px-3">كود المركز</th>
                <th className="py-3 px-3">اسم المركز والمحافظة</th>
                <th className="py-3 px-3">المرحلة والصفوف المخصصة</th>
                <th className="py-3 px-3">رئيس اللجنة الامتحانية</th>
                <th className="py-3 px-3">الطابعة وحالة الاتصال</th>
                <th className="py-3 px-3">حالة التشفير</th>
                <th className="py-3 px-3">تقدم الطباعة اللحظية</th>
                <th className="py-3 px-3 text-center">إجراءات المراقبة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSchools.map((school) => {
                const percent = Math.round(
                  (school.currentPrintedCount / school.registeredStudentsCount) * 100
                );
                const isAuthorized =
                  school.status === 'AUTHORIZED_PRINT' ||
                  school.status === 'PRINTING_ACTIVE' ||
                  school.status === 'PRINT_FINISHED';

                return (
                  <tr
                    key={school.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      school.isTampered ? 'bg-rose-950/30' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                      {school.code}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-100">{school.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {school.governorate} • {school.directorate}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-1 ${
                          school.educationStage === 'PRIMARY'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : school.educationStage === 'INTERMEDIATE'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : school.educationStage === 'SECONDARY'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {school.stageNameArabic}
                      </span>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {school.assignedGrades?.join(', ') || 'كافة الصفوف'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-medium">{school.chiefProctorName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{school.chiefProctorPhone}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            school.printerStatus === 'ONLINE' || school.printerStatus === 'PRINTING'
                              ? 'bg-emerald-400 animate-pulse'
                              : school.printerStatus === 'PAPER_JAM'
                              ? 'bg-rose-500'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="font-semibold text-slate-200">{school.printerModel}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{school.printerIp}</div>
                    </td>

                    <td className="py-3 px-3">
                      {school.isTampered ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold">
                          مجمد أمنياً
                        </span>
                      ) : isAuthorized ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 w-fit">
                          <Unlock className="w-3 h-3" />
                          <span>مفتوح للطباعة</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3" />
                          <span>مشفر زمني</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 min-w-40">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="font-bold text-slate-200">
                          {school.currentPrintedCount} / {school.registeredStudentsCount} طالب
                        </span>
                        <span className="font-mono text-cyan-400">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            percent === 100
                              ? 'bg-emerald-500'
                              : percent > 0
                              ? 'bg-cyan-500'
                              : 'bg-slate-700'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Open terminal button */}
                        <button
                          onClick={() => onSelectSchoolTerminal(school.id)}
                          className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        >
                          دخول المحطة
                        </button>

                        {/* Suspension Toggle */}
                        {currentUser?.role !== 'SCHOOL_CENTER' && (
                          <button
                            onClick={() => onToggleSchoolSuspension(school.id)}
                            className={`p-1 rounded-lg border transition-all cursor-pointer ${
                              school.isTampered
                                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30'
                                : 'bg-rose-600/20 text-rose-400 border-rose-500/40 hover:bg-rose-600/30'
                            }`}
                            title={school.isTampered ? 'فك التجميد عن المركز' : 'تجميد احترازي للمركز'}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add School Center Modal */}
      {showAddCenterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <School className="w-5 h-5 text-cyan-400" />
                <span>إضافة وتفعيل مركز امتحاني جديد في المنظومة</span>
              </div>
              <button
                onClick={() => setShowAddCenterModal(false)}
                className="text-slate-400 hover:text-white text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCenter} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المركز / المدرسة *</label>
                <input
                  type="text"
                  required
                  value={newCenterName}
                  onChange={(e) => setNewCenterName(e.target.value)}
                  placeholder="مثال: مركز ثانوية الكندي للبنين"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">كود المركز الوزاري *</label>
                  <input
                    type="text"
                    required
                    value={newCenterCode}
                    onChange={(e) => setNewCenterCode(e.target.value)}
                    placeholder="SCH-108"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المرحلة الدراسية *</label>
                  <select
                    value={newCenterStage}
                    onChange={(e) => setNewCenterStage(e.target.value as EducationStage)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PRIMARY">الابتدائي</option>
                    <option value="INTERMEDIATE">المتوسط</option>
                    <option value="SECONDARY">الإعدادي / الثانوي</option>
                    <option value="ALL">شامل (كافة المراحل)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المحافظة *</label>
                  <select
                    value={newCenterGov}
                    onChange={(e) => setNewCenterGov(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="بغداد">بغداد</option>
                    <option value="البصرة">البصرة</option>
                    <option value="نينوى">نينوى</option>
                    <option value="كركوك">كركوك</option>
                    <option value="كربلاء المقدسة">كربلاء المقدسة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المديرية</label>
                  <input
                    type="text"
                    value={newCenterDirectorate}
                    onChange={(e) => setNewCenterDirectorate(e.target.value)}
                    placeholder="تربية الكرخ الأولى"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">رئيس المركز الامتحاني</label>
                  <input
                    type="text"
                    value={newCenterProctor}
                    onChange={(e) => setNewCenterProctor(e.target.value)}
                    placeholder="أ. د. ماجد الساعدي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">حصة الطلبة (الكوتا) *</label>
                  <input
                    type="number"
                    required
                    value={newCenterQuota}
                    onChange={(e) => setNewCenterQuota(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCenterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/40"
                >
                  حفظ وتفعيل المركز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Exam Content Preview */}
      {showExamContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  معاينة النموذج الامتحاني الفعال: {exam.title} [{exam.modelGroup}]
                </h3>
              </div>
              <button
                onClick={() => setShowExamContentModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500">المرحلة:</span>{' '}
                  <span className="text-cyan-300 font-bold">{exam.gradeLevel}</span>
                </div>
                <div>
                  <span className="text-slate-500">المجموعة:</span>{' '}
                  <span className="text-emerald-300 font-bold">[{exam.modelGroup}]</span>
                </div>
                <div>
                  <span className="text-slate-500">الدرجة:</span>{' '}
                  <span className="text-white font-bold">{exam.totalScore}</span>
                </div>
                <div>
                  <span className="text-slate-500">المدة:</span>{' '}
                  <span className="text-white font-bold">{exam.durationMinutes} دقيقة</span>
                </div>
              </div>

              <div className="space-y-3">
                {exam.sections.map((sec) => (
                  <div key={sec.id} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="font-bold text-slate-200 text-sm">{sec.title}</div>
                    {sec.instructions && <div className="text-slate-400 text-xs">{sec.instructions}</div>}
                    <div className="space-y-1.5 pt-2">
                      {sec.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-start gap-3 text-slate-300 bg-slate-900/50 p-2.5 rounded">
                          <p className="flex-1 leading-relaxed">{it.questionText}</p>
                          <span className="font-mono text-cyan-400 font-bold flex-shrink-0">({it.maxScore} درجات)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowExamContentModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
