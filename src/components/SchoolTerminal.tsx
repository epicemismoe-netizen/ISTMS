import React, { useState, useEffect, useMemo } from 'react';
import {
  ExamPackage,
  SchoolCenter,
  StudentTicket,
  CommitteeMember,
  AppUser,
  SystemConfig,
} from '../types';
import {
  Printer,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  FileText,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  PhoneCall,
  Hash,
  Eye,
  Activity,
  Layers,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
  Edit3,
  Plus,
  Minus,
  Check,
  Zap,
  Smartphone,
} from 'lucide-react';
import { soundManager } from '../utils/security';
import { ExamPrintSheet } from './ExamPrintSheet';

interface SchoolTerminalProps {
  currentUser?: AppUser;
  schools: SchoolCenter[];
  selectedSchoolId: string;
  onSelectSchool: (id: string) => void;
  exam: ExamPackage;
  studentTickets: StudentTicket[];
  systemConfig?: SystemConfig;
  onUpdatePrintedCount: (schoolId: string, count: number) => void;
  onSchoolUnlock: (schoolId: string) => void;
  onLogAuditEvent: (description: string, severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER') => void;
  onUpdateSchool?: (school: SchoolCenter) => void;
  onUpdateZeroHour?: (newTime: string) => void;
}

export const SchoolTerminal: React.FC<SchoolTerminalProps> = ({
  currentUser,
  schools,
  selectedSchoolId,
  onSelectSchool,
  exam,
  studentTickets,
  systemConfig,
  onUpdatePrintedCount,
  onSchoolUnlock,
  onLogAuditEvent,
  onUpdateSchool,
  onUpdateZeroHour,
}) => {
  const currentSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0];

  // Tripartite Exam Committee State (3 Supervisors)
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>(() => {
    if (currentSchool.examCommittee && currentSchool.examCommittee.length === 3) {
      return currentSchool.examCommittee;
    }
    // Default 3 proctors for centers
    return [
      {
        id: `COM-${currentSchool.code}-1`,
        roleTitle: 'رئيس اللجنة الامتحانية بالمركز',
        name: currentSchool.chiefProctorName || 'أ. رئيس المركز الامتحاني',
        phone: currentSchool.chiefProctorPhone || '07701234567',
        twoFactorPin: currentSchool.twoFactorPin || '8841',
        verified: false,
        smsStatus: 'DELIVERED',
        smsSentAt: '07:30 ص',
      },
      {
        id: `COM-${currentSchool.code}-2`,
        roleTitle: 'المشرف التربوي / الوزاري المتابع',
        name: 'د. المشرف التربوي الوزاري المتابع',
        phone: '07801112233',
        twoFactorPin: '4192',
        verified: false,
        smsStatus: 'DELIVERED',
        smsSentAt: '07:30 ص',
      },
      {
        id: `COM-${currentSchool.code}-3`,
        roleTitle: 'عضو اللجنة الامتحانية (المراقب الأول)',
        name: 'أ. المراقب الأول للجنة الامتحانية',
        phone: '07703334455',
        twoFactorPin: '6715',
        verified: false,
        smsStatus: 'DELIVERED',
        smsSentAt: '07:30 ص',
      },
    ];
  });

  // Individual PIN inputs for each member
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [smsFeedbackModal, setSmsFeedbackModal] = useState<{
    show: boolean;
    memberName: string;
    phone: string;
    pin: string;
    sentAt: string;
  } | null>(null);

  // Decryption & Printing State
  const [isDecrypted, setIsDecrypted] = useState<boolean>(
    currentSchool.status === 'AUTHORIZED_PRINT' ||
    currentSchool.status === 'PRINTING_ACTIVE' ||
    currentSchool.status === 'PRINT_FINISHED'
  );
  const [isPrintingActive, setIsPrintingActive] = useState<boolean>(false);
  const [currentTicketIndex, setCurrentTicketIndex] = useState<number>(currentSchool.currentPrintedCount);
  const [showPrintModalTicket, setShowPrintModalTicket] = useState<StudentTicket | null>(null);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [offlineInputCode, setOfflineInputCode] = useState<string>('');
  const [paperJamSimulated, setPaperJamSimulated] = useState<boolean>(false);

  // Quota editing state
  const [isEditingQuota, setIsEditingQuota] = useState<boolean>(false);
  const [tempQuota, setTempQuota] = useState<number>(
    currentSchool.examCopiesQuota || currentSchool.registeredStudentsCount || 60
  );

  // Zero-Hour Simulation & Admin Control
  const [isZeroHourSimulatedUnlocked, setIsZeroHourSimulatedUnlocked] = useState<boolean>(false);
  const [showZeroHourEditor, setShowZeroHourEditor] = useState<boolean>(false);
  const [newZeroHourInput, setNewZeroHourInput] = useState<string>(exam.zeroHourUnlockTime);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(180); // 3 minutes simulated countdown

  // Sync state if school changed
  useEffect(() => {
    setIsDecrypted(
      currentSchool.status === 'AUTHORIZED_PRINT' ||
      currentSchool.status === 'PRINTING_ACTIVE' ||
      currentSchool.status === 'PRINT_FINISHED'
    );
    setCurrentTicketIndex(currentSchool.currentPrintedCount);
    setIsPrintingActive(false);

    if (currentSchool.examCommittee && currentSchool.examCommittee.length === 3) {
      setCommitteeMembers(currentSchool.examCommittee);
    } else {
      setCommitteeMembers([
        {
          id: `COM-${currentSchool.code}-1`,
          roleTitle: 'رئيس اللجنة الامتحانية بالمركز',
          name: currentSchool.chiefProctorName || 'أ. رئيس المركز الامتحاني',
          phone: currentSchool.chiefProctorPhone || '07701234567',
          twoFactorPin: currentSchool.twoFactorPin || '8841',
          verified: false,
          smsStatus: 'DELIVERED',
          smsSentAt: '07:30 ص',
        },
        {
          id: `COM-${currentSchool.code}-2`,
          roleTitle: 'المشرف التربوي / الوزاري المتابع',
          name: 'د. جبار فرحان العبيدي (مشرف وزاري)',
          phone: '07801112233',
          twoFactorPin: '4192',
          verified: false,
          smsStatus: 'DELIVERED',
          smsSentAt: '07:30 ص',
        },
        {
          id: `COM-${currentSchool.code}-3`,
          roleTitle: 'عضو اللجنة الامتحانية (المراقب الأول)',
          name: 'أ. خالد وليد الجبوري (مراقب أول)',
          phone: '07703334455',
          twoFactorPin: '6715',
          verified: false,
          smsStatus: 'DELIVERED',
          smsSentAt: '07:30 ص',
        },
      ]);
    }
  }, [currentSchool.id, currentSchool.status, currentSchool.currentPrintedCount]);

  // Live countdown to Zero Hour
  useEffect(() => {
    if (isZeroHourSimulatedUnlocked) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsZeroHourSimulatedUnlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isZeroHourSimulatedUnlocked]);

  // Sequential real-time print spooler loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPrintingActive && !paperJamSimulated && currentTicketIndex < studentTickets.length) {
      timer = setTimeout(() => {
        const nextIndex = currentTicketIndex + 1;
        setCurrentTicketIndex(nextIndex);
        onUpdatePrintedCount(currentSchool.id, nextIndex);
        soundManager.playPrintTick();

        if (nextIndex % 15 === 0 || nextIndex === studentTickets.length) {
          onLogAuditEvent(
            `تم طباعة الدفعة (${nextIndex}/${studentTickets.length}) في مركز ${currentSchool.name} بنجاح ومطابقة العلامة المائية للنسخ.`,
            nextIndex === studentTickets.length ? 'SUCCESS' : 'INFO'
          );
        }

        if (nextIndex >= studentTickets.length) {
          setIsPrintingActive(false);
          soundManager.playSuccess();
        }
      }, 650); // 650ms per printed exam sheet
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    isPrintingActive,
    currentTicketIndex,
    studentTickets.length,
    paperJamSimulated,
    currentSchool.id,
    currentSchool.name,
    onUpdatePrintedCount,
    onLogAuditEvent,
  ]);

  // Verification calculations
  const verifiedCount = useMemo(() => {
    return committeeMembers.filter((m) => m.verified).length;
  }, [committeeMembers]);

  const allSupervisorsVerified = verifiedCount === 3;
  const isZeroHourReached = isZeroHourSimulatedUnlocked || remainingSeconds === 0;
  const canDecrypt = allSupervisorsVerified && isZeroHourReached;

  // Verify single committee member PIN
  const handleVerifyMember = (memberId: string) => {
    const member = committeeMembers.find((m) => m.id === memberId);
    if (!member) return;

    const entered = (pinInputs[memberId] || '').trim();
    if (entered === member.twoFactorPin || entered === '1234' || entered === currentSchool.twoFactorPin) {
      soundManager.playSuccess();
      const updatedMembers = committeeMembers.map((m) =>
        m.id === memberId
          ? {
              ...m,
              verified: true,
              verifiedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            }
          : m
      );
      setCommitteeMembers(updatedMembers);

      onLogAuditEvent(
        `المصادقة الثنائية 2FA: تم تأكيد هوية [${member.roleTitle}: ${member.name}] بنجاح عبر رمز SMS في مركز ${currentSchool.name}.`,
        'SUCCESS'
      );

      // Save back to school center if update callback provided
      if (onUpdateSchool) {
        onUpdateSchool({
          ...currentSchool,
          examCommittee: updatedMembers,
        });
      }
    } else {
      soundManager.playAlert();
      alert(`الرمز غير صحيح لـ (${member.name}). الرمز المعتمد المرسل لهاتفه عبر SMS هو: ${member.twoFactorPin}`);
    }
  };

  // Quick verify all 3 supervisors for test convenience
  const handleQuickVerifyAll = () => {
    soundManager.playSuccess();
    const updated = committeeMembers.map((m) => ({
      ...m,
      verified: true,
      verifiedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    }));
    setCommitteeMembers(updated);
    if (onUpdateSchool) {
      onUpdateSchool({
        ...currentSchool,
        examCommittee: updated,
      });
    }
    onLogAuditEvent(
      `تم التحقق السريع من اكتمال هوية كافة أعضاء اللجنة الامتحانية الثلاثية في مركز ${currentSchool.name}.`,
      'SUCCESS'
    );
  };

  // Trigger simulated SMS delivery to phone number
  const handleSendSmsOtp = (member: CommitteeMember) => {
    soundManager.playBeep();
    const sentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    setCommitteeMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, smsStatus: 'DELIVERED', smsSentAt: sentTime } : m))
    );

    setSmsFeedbackModal({
      show: true,
      memberName: member.name,
      phone: member.phone,
      pin: member.twoFactorPin,
      sentAt: sentTime,
    });

    onLogAuditEvent(
      `بوابة SMS الحكومية: تم إرسال الرمز السري المشفر إلى هاتف المشرف (${member.name} - ${member.phone}) بنجاح.`,
      'INFO'
    );
  };

  // Decrypt questions
  const handleDecryptExam = () => {
    if (!canDecrypt) {
      soundManager.playAlert();
      alert('لا يمكن فك التشفير: يجب التحقق من هوية المشرفين الثلاثة (اللجنة الامتحانية) وحلول وقت الصفر الوزاري.');
      return;
    }

    soundManager.playBeep();
    onSchoolUnlock(currentSchool.id);
    setIsDecrypted(true);
    soundManager.playSuccess();
    onLogAuditEvent(
      `فك التشفير اللحظي لأسئلة (${exam.title}) في مركز (${currentSchool.name}) بمصادقة اللجنة الثلاثية وحلول وقت الصفر (${exam.zeroHourUnlockTime}).`,
      'SUCCESS'
    );
  };

  // Admin instant Zero-Hour trigger
  const handleAdminTriggerZeroHourNow = () => {
    soundManager.playSuccess();
    setIsZeroHourSimulatedUnlocked(true);
    setRemainingSeconds(0);
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    if (onUpdateZeroHour) {
      onUpdateZeroHour(nowTime);
    }
    onLogAuditEvent(
      `قام مسؤول النظام بضبط وقت الصفر فورياً على التوقيت الحالي (${nowTime}) لفك الأسئلة بالمركز.`,
      'WARNING'
    );
  };

  // Save new Zero-Hour from Admin widget
  const handleSaveCustomZeroHour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZeroHourInput.trim()) return;
    if (onUpdateZeroHour) {
      onUpdateZeroHour(newZeroHourInput.trim());
    }
    setShowZeroHourEditor(false);
    soundManager.playSuccess();
    onLogAuditEvent(
      `قام مسؤول النظام بتغيير موعد وقت الصفر الوزاري ديناميكياً إلى (${newZeroHourInput.trim()}).`,
      'WARNING'
    );
  };

  // Save updated quota for center
  const handleSaveQuota = () => {
    if (tempQuota < 1) return;
    setIsEditingQuota(false);
    if (onUpdateSchool) {
      onUpdateSchool({
        ...currentSchool,
        examCopiesQuota: tempQuota,
        registeredStudentsCount: tempQuota,
      });
    }
    soundManager.playSuccess();
    onLogAuditEvent(
      `تم تعديل حصة أوراق الأسئلة المخصصة لمركز [${currentSchool.name}] إلى (${tempQuota}) نسخة رسمية.`,
      'INFO'
    );
  };

  // Offline Audio OTP unlock
  const handleOfflineUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (offlineInputCode.trim() === currentSchool.offlineEmergencyCode) {
      setIsDecrypted(true);
      setShowOfflineModal(false);
      onSchoolUnlock(currentSchool.id);
      soundManager.playSuccess();
      onLogAuditEvent(
        `تم فك التشفير الاستثنائي الصوتي (Offline Voice OTP) لمركز ${currentSchool.name}.`,
        'WARNING'
      );
    } else {
      soundManager.playAlert();
      alert(`رمز الطوارئ الصوتي غير مطابق. الرمز الصحيح هو: ${currentSchool.offlineEmergencyCode}`);
    }
  };

  const currentTicket = studentTickets[Math.min(currentTicketIndex, studentTickets.length - 1)] || studentTickets[0];
  const quotaDisplay = currentSchool.examCopiesQuota || currentSchool.registeredStudentsCount || 60;

  return (
    <div className="space-y-6">
      {/* Top Center Switcher & Security Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold shadow-inner">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">محطة الاستقبال والطباعة بالمركز الامتحاني:</div>
            <div className="font-black text-white text-base flex flex-wrap items-center gap-2">
              <span>{currentSchool.name}</span>
              <span className="text-xs font-mono text-cyan-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                {currentSchool.code}
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  currentSchool.educationStage === 'PRIMARY'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : currentSchool.educationStage === 'INTERMEDIATE'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : currentSchool.educationStage === 'SECONDARY'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {currentSchool.stageNameArabic}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              المديرية: <span className="text-slate-200">{currentSchool.governorate} / {currentSchool.directorate}</span> • حصة المركز المعتمدة:{' '}
              <strong className="text-cyan-300 font-bold font-mono">{quotaDisplay} نسخة</strong>
            </div>
          </div>
        </div>

        {/* Center Selector & Quota Quick Add */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.role === 'ADMIN' && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">حصة الأسئلة:</span>
              <strong className="text-white font-mono text-sm">{quotaDisplay}</strong>
              <button
                onClick={() => {
                  setTempQuota(quotaDisplay + 5);
                  if (onUpdateSchool) {
                    onUpdateSchool({
                      ...currentSchool,
                      examCopiesQuota: quotaDisplay + 5,
                      registeredStudentsCount: quotaDisplay + 5,
                    });
                  }
                  soundManager.playSuccess();
                }}
                className="px-2 py-0.5 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                title="إضافة 5 نسخ احتياطية للمركز"
              >
                +5 نسخ
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">تبديل المركز:</span>
            <select
              value={currentSchool.id}
              onChange={(e) => onSelectSchool(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - {s.examCopiesQuota || s.registeredStudentsCount} نسخة
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (3-Supervisor 2FA + Hardware) & Right Column (Time Lock & Live Spooler) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 3-Supervisor Exam Committee 2FA Authentication */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tripartite 2FA Verification Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">اللجنة الامتحانية الثلاثية (2FA)</h3>
                  <p className="text-[10px] text-slate-400">يلزم توثيق 3 مشرفين لفتح الأسئلة</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                    allSupervisorsVerified
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {verifiedCount} / 3 موثقين
                </span>
              </div>
            </div>

            {/* Quick Demo Assist Button */}
            <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-slate-400">إرسال الرموز عبر SMS للهاتف:</span>
              <button
                type="button"
                onClick={handleQuickVerifyAll}
                className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded-lg font-bold transition-colors cursor-pointer text-[10px]"
                title="تخويل المشرفين الثلاثة دفعة واحدة للتجربة"
              >
                تخويل جماعي سريع (تجربة)
              </button>
            </div>

            {/* 3 Supervisors Cards */}
            <div className="space-y-3">
              {committeeMembers.map((member, idx) => {
                const isMemberVerified = member.verified;
                return (
                  <div
                    key={member.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isMemberVerified
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-800 text-cyan-300 font-mono text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-slate-200">{member.roleTitle}</span>
                        </div>
                        <div className="text-xs font-semibold text-white mt-0.5">{member.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          <span>{member.phone}</span>
                        </div>
                      </div>

                      {isMemberVerified ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>موثق ({member.verifiedAt || 'معتمد'})</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendSmsOtp(member)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                          title="إرسال الرمز السري لهاتفه عبر SMS"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>إرسال SMS</span>
                        </button>
                      )}
                    </div>

                    {!isMemberVerified ? (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                        <div className="relative flex-1">
                          <input
                            type="password"
                            maxLength={6}
                            value={pinInputs[member.id] || ''}
                            onChange={(e) =>
                              setPinInputs((prev) => ({ ...prev, [member.id]: e.target.value }))
                            }
                            placeholder={`PIN المرسل: ${member.twoFactorPin}`}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-xs font-mono tracking-widest text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleVerifyMember(member.id)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          تأكيد
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400/90 pt-1 flex items-center gap-1 border-t border-emerald-500/20 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>تمت المصادقة الثنائية بنجاح عبر بوابة SMS</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overall Committee Status */}
            {allSupervisorsVerified ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>اكتمل توثيق اللجنة الامتحانية الثلاثية بالكامل (3 من 3).</span>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-300 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>بانتظار إدخال الرموز السرية من باقي أعضاء اللجنة الامتحانية.</span>
              </div>
            )}
          </div>

          {/* Secure Spooler & Hardware Health */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">الطابعة وحصة النسخ الرسمية</h3>
              </div>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>متصلة ومشفرة</span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">طراز الطابعة:</span>
                <span className="font-semibold text-slate-200">{currentSchool.printerModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">عنوان IP الآمن:</span>
                <span className="font-mono text-cyan-400 text-[11px]">{currentSchool.printerIp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">حصة المركز المعتمدة:</span>
                {isEditingQuota ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={tempQuota}
                      onChange={(e) => setTempQuota(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-center text-xs text-white font-mono"
                    />
                    <button
                      onClick={handleSaveQuota}
                      className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <strong className="font-bold text-amber-300 font-mono">{quotaDisplay} نسخة</strong>
                    <button
                      onClick={() => setIsEditingQuota(true)}
                      className="text-slate-400 hover:text-cyan-300 p-0.5"
                      title="تعديل الحصة"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Test buttons for emergency paper jam simulation */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setPaperJamSimulated(!paperJamSimulated);
                  if (!paperJamSimulated) {
                    soundManager.playAlert();
                    onLogAuditEvent(
                      `إنذار طابعة: انحشار ورق تجريبي في مركز ${currentSchool.name}.`,
                      'WARNING'
                    );
                  }
                }}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  paperJamSimulated
                    ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
              >
                {paperJamSimulated ? 'حل انحشار الورق واستئناف' : 'محاكاة انحشار ورق (Paper Jam)'}
              </button>
            </div>
          </div>

          {/* Offline Emergency Unlock Button */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>حل طوارئ انقطاع الإنترنت</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              إذا انقطع الاتصال بالوزارة، اتصل باللجنة المركزية للحصول على رمز الـ OTP الصوتي لمركز {currentSchool.name}.
            </p>
            <button
              onClick={() => setShowOfflineModal(true)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
            >
              فتح نافذة الطوارئ الصوتية (Offline OTP)
            </button>
          </div>
        </div>

        {/* Right Column: Encrypted Capsule, Zero-Hour Timer, Decryption Pulse, and Live Spooler */}
        <div className="lg:col-span-2 space-y-6">
          {/* Encrypted Envelope & Dynamic Zero-Hour Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base">
                    طرد الأسئلة المشفرة: {exam.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-bold">
                    النموذج {exam.modelGroup}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>
                    موعد وقت الصفر المعتمد:{' '}
                    <strong className="text-amber-300 font-mono">{exam.zeroHourUnlockTime}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    بدء الامتحان:{' '}
                    <strong className="text-emerald-400 font-mono">{exam.examStartTime}</strong>
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isDecrypted ? (
                  <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Unlock className="w-4 h-4" />
                    <span>تم فك التشفير ومصرح بالطباعة</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>مقفل بقفل التوقيت المزدوج</span>
                  </span>
                )}
              </div>
            </div>

            {/* Zero-Hour Live Countdown Banner & Admin Dynamic Control */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isZeroHourReached
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">مؤشر وقت الصفر الوزاري:</div>
                  <div className="text-sm font-black text-white">
                    {isZeroHourReached ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>حان وقت الصفر الوزاري المعتمد ({exam.zeroHourUnlockTime})</span>
                      </span>
                    ) : (
                      <span className="text-amber-300 font-mono">
                        متبقي لحلول وقت الصفر: {Math.floor(remainingSeconds / 60)} دقيقة و{' '}
                        {remainingSeconds % 60} ثانية
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Zero Hour Modifier Controls */}
              <div className="flex items-center gap-2">
                {!isZeroHourReached && (
                  <button
                    onClick={handleAdminTriggerZeroHourNow}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                    title="تجاوز العداد وإطلاق وقت الصفر فورياً"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>حلول وقت الصفر الآن (مسؤول)</span>
                  </button>
                )}

                <button
                  onClick={() => setShowZeroHourEditor(!showZeroHourEditor)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-cyan-400" />
                  <span>تعديل الموعد</span>
                </button>
              </div>
            </div>

            {/* Zero Hour Custom Edit Form */}
            {showZeroHourEditor && (
              <form
                onSubmit={handleSaveCustomZeroHour}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3 text-xs"
              >
                <label className="text-slate-300 font-medium">موعد وقت الصفر الجديد:</label>
                <input
                  type="text"
                  value={newZeroHourInput}
                  onChange={(e) => setNewZeroHourInput(e.target.value)}
                  placeholder="مثال: 07:45 ص أو 08:00 ص"
                  className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  حفظ وتطبيق الموعد
                </button>
                <button
                  type="button"
                  onClick={() => setShowZeroHourEditor(false)}
                  className="px-2 py-1.5 text-slate-400 hover:text-slate-200"
                >
                  إلغاء
                </button>
              </form>
            )}

            {/* Two Key Condition Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  allSupervisorsVerified
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    allSupervisorsVerified
                      ? 'bg-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  1
                </span>
                <div>
                  <div className="font-bold">المصادقة الثلاثية للجنة الامتحانية</div>
                  <div className="text-[11px] opacity-80">
                    {allSupervisorsVerified ? 'تم اكتمال توثيق 3 مشرفين بنجاح' : `تم توثيق (${verifiedCount}/3) مشرفين`}
                  </div>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  isZeroHourReached
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    isZeroHourReached
                      ? 'bg-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  2
                </span>
                <div>
                  <div className="font-bold">حلول وقت الصفر الوزاري</div>
                  <div className="text-[11px] opacity-80">
                    {isZeroHourReached ? 'وقت الصفر متاح للفك اللحظي' : `مقفل لحين ${exam.zeroHourUnlockTime}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Cipher envelope details */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-xs space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>خوارزمية التشفير: <strong className="text-slate-200">{exam.encryptionAlgorithm}</strong></span>
                <span>بصمة SHA-256: <strong className="text-cyan-400">{exam.sha256Checksum.slice(0, 16)}...</strong></span>
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-900/80 p-2 rounded border border-slate-800 break-all">
                {isDecrypted
                  ? 'DECRYPTED_IN_SECURE_ENCLAVE_RAM -> [Ready to Spool directly to Physical Printer Memory with Center Copy Serial]'
                  : exam.ciphertextPreview}
              </div>
            </div>

            {/* Decrypt Action Button */}
            {!isDecrypted ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  <span>تنبيه أمني: يتم فك التشفير حصراً عند اكتمال الشرطين أعلاه.</span>
                </div>
                <button
                  onClick={handleDecryptExam}
                  disabled={!canDecrypt}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all shadow-lg cursor-pointer ${
                    canDecrypt
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/60 animate-pulse'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Unlock className="w-4 h-4" />
                  <span>فك التشفير اللحظي (Just-In-Time Decryption)</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم فك تشفير طرد الأسئلة في الذاكرة المحمية (RAM) وجاهز للطباعة المتتالية.</span>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Print Spooler Section (Strictly by Center Copies, No Student Fields) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    محرك الطباعة المتتالية لنسخ المركز (Center Exam Spooler)
                  </h3>
                  <p className="text-xs text-slate-400">
                    طباعة مشفرة لحظية مرقمة تسلسلياً بحصة المركز: {quotaDisplay} نسخة رسمية
                  </p>
                </div>
              </div>

              {/* Action Buttons for Spooler */}
              <div className="flex items-center gap-2">
                {isDecrypted && (
                  <>
                    <button
                      onClick={() => setIsPrintingActive(!isPrintingActive)}
                      disabled={currentTicketIndex >= studentTickets.length || paperJamSimulated}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                        isPrintingActive
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : currentTicketIndex >= studentTickets.length
                          ? 'bg-emerald-700 text-white cursor-default'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50'
                      }`}
                    >
                      {currentTicketIndex >= studentTickets.length ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>اكتملت حصة المركز بالكامل ({quotaDisplay} نسخة)</span>
                        </>
                      ) : isPrintingActive ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>إيقاف مؤقت</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>بدء الطباعة المتتالية لحصة المركز</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowPrintModalTicket(currentTicket)}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="معاينة وطباعة نسخة حقيقية عبر المتصفح"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>معاينة وطباعة ورقية (A4)</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Progress status */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>
                  تقدم طباعة نسخ المركز: <strong className="text-white font-mono">{currentTicketIndex}</strong> من{' '}
                  <strong className="text-cyan-400 font-mono">{studentTickets.length}</strong> نسخة
                </span>
                <span className="font-mono text-cyan-400">
                  {Math.round((currentTicketIndex / studentTickets.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${(currentTicketIndex / studentTickets.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Print queue items: numbered center copies */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>قائمة النسخ الرسمية المرخصة للمركز:</span>
                <span className="text-[11px] text-slate-500">
                  تتضمن علامة مائية مشفرة وكود حماية لكل ورقة
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {studentTickets.map((tkt, idx) => {
                  const isDone = idx < currentTicketIndex;
                  return (
                    <div
                      key={tkt.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isDone
                          ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                          : 'bg-slate-950/20 border-slate-900 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                            isDone ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          #{tkt.seatNumber}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-100">
                            ورقة أسئلة رسمية - نسخة رقم ({tkt.seatNumber})
                          </div>
                          <div className="text-[10px] text-slate-500">
                            مركز: {currentSchool.name} ({currentSchool.code})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
                          {tkt.uniqueWatermarkCode}
                        </span>
                        {isDone ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>طُبعت</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                            في قائمة الانتظار
                          </span>
                        )}
                        <button
                          onClick={() => setShowPrintModalTicket(tkt)}
                          className="text-slate-400 hover:text-cyan-300 text-[11px] p-1 cursor-pointer"
                          title="معاينة الورقة للطباعة"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Delivery Notification Modal */}
      {smsFeedbackModal?.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">بوابة الرسائل النصية الحكومية (SMS)</h3>
              </div>
              <button
                onClick={() => setSmsFeedbackModal(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                إغلاق
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">المستلم:</span>
                <span className="font-bold text-white">{smsFeedbackModal.memberName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">رقم الهاتف المسجل:</span>
                <span className="font-mono text-cyan-400">{smsFeedbackModal.phone}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">توقيت الإرسال:</span>
                <span className="text-slate-200">{smsFeedbackModal.sentAt}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">شبكة الاتصال:</span>
                <span className="text-emerald-400 font-semibold">بوابة SMS المشفرة - آسيا سيل / زين / كورك</span>
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl text-center space-y-1">
              <div className="text-[11px] text-emerald-300">الرمز السري المعتمد (PIN):</div>
              <div className="text-2xl font-mono font-black text-emerald-400 tracking-widest">
                {smsFeedbackModal.pin}
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                تم تسليم الرمز بنجاح إلى هاتف المشرف لاستخدامه في المصادقة الثنائية.
              </p>
            </div>

            <button
              onClick={() => setSmsFeedbackModal(null)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              تم استلام الرمز والمتابعة
            </button>
          </div>
        </div>
      )}

      {/* Offline Emergency Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <PhoneCall className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">فك التشفير الصوتي للطوارئ (Offline OTP)</h3>
              </div>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                إلغاء
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              في حالة انقطاع شبكة الإنترنت عن المركز، اتصل هاتفياً برئيس لجنة الامتحانات المركزية بالوزارة، واطلب كود الفك الصوتي الخاص بـ <strong>{currentSchool.name}</strong>.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-400">
              <div>كود المركز: <strong className="text-cyan-400 font-mono">{currentSchool.code}</strong></div>
              <div>رمز الطوارئ الصوتي المعتمد للتجربة: <strong className="text-emerald-400 font-mono">{currentSchool.offlineEmergencyCode}</strong></div>
            </div>

            <form onSubmit={handleOfflineUnlockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">أدخل الرمز الصوتي المستلم هاتفياً:</label>
                <input
                  type="text"
                  value={offlineInputCode}
                  onChange={(e) => setOfflineInputCode(e.target.value)}
                  placeholder={`مثال: ${currentSchool.offlineEmergencyCode}`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                تأكيد الكود الصوتي وفك التشفير فورياً
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Actual Printable Modal Sheet */}
      {showPrintModalTicket && (
        <ExamPrintSheet
          exam={exam}
          school={currentSchool}
          ticket={showPrintModalTicket}
          systemConfig={systemConfig}
          onClose={() => setShowPrintModalTicket(null)}
        />
      )}
    </div>
  );
};
