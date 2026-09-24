import React, { useState, useMemo } from 'react';
import {
  INITIAL_EXAM_MODEL_A,
  INITIAL_EXAM_MODEL_B_BACKUP,
  INITIAL_EXAM_MODEL_C_BACKUP,
  INITIAL_EXAMS_LIST,
  INITIAL_USERS,
  INITIAL_SCHOOLS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_CONFIG,
  generateStudentTicketsForSchool,
} from './data/mockData';
import {
  ExamPackage,
  SchoolCenter,
  AuditLog,
  StudentTicket,
  AppUser,
  SystemConfig,
} from './types';
import { Header } from './components/Header';
import { MinistryHub } from './components/MinistryHub';
import { SchoolTerminal } from './components/SchoolTerminal';
import { ExamEditor } from './components/ExamEditor';
import { UserManagement } from './components/UserManagement';
import { ForensicInspector } from './components/ForensicInspector';
import { SecurityGuide } from './components/SecurityGuide';
import { LoginView } from './components/LoginView';
import { AccountProfile } from './components/AccountProfile';
import { CentersManagement } from './components/CentersManagement';
import { AdminSystemSettings } from './components/AdminSystemSettings';
import { soundManager } from './utils/security';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    | 'ministry'
    | 'school'
    | 'exam_editor'
    | 'users'
    | 'centers_mgmt'
    | 'system_config'
    | 'forensic'
    | 'security_guide'
    | 'profile'
  >('ministry');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [currentExam, setCurrentExam] = useState<ExamPackage>(INITIAL_EXAM_MODEL_A);
  const [examsList, setExamsList] = useState<ExamPackage[]>(INITIAL_EXAMS_LIST);
  const [schools, setSchools] = useState<SchoolCenter[]>(INITIAL_SCHOOLS);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(INITIAL_SCHOOLS[0].id);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>(INITIAL_USERS[0].id);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(INITIAL_SYSTEM_CONFIG);

  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  // Pre-generate student tickets for each school
  const studentTicketsMap = useMemo(() => {
    const map: Record<string, StudentTicket[]> = {};
    schools.forEach((sch) => {
      map[sch.id] = generateStudentTicketsForSchool(sch);
    });
    return map;
  }, [schools]);

  // Log an event to the immutable audit trail
  const handleLogAuditEvent = (
    description: string,
    severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' = 'INFO'
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const randomHex = Math.random().toString(16).substring(2, 10);

    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      eventType: severity === 'DANGER' ? 'TAMPER_ALERT' : 'PRINT_PAGE',
      operator: `${currentUser.name} (${currentUser.role})`,
      description,
      severity,
      hashSignature: `${randomHex}e9...`,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Switch current acting user to test permissions
  const handleSwitchUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUserId(userId);
      // If user is a school center, auto-switch to their center
      if (targetUser.role === 'SCHOOL_CENTER' && targetUser.assignedCenterId) {
        setSelectedSchoolId(targetUser.assignedCenterId);
        setActiveTab('school');
      }
      handleLogAuditEvent(`تم التبديل إلى حساب: ${targetUser.name} [${targetUser.role}]`, 'INFO');
    }
  };

  // Broadcast zero-hour unlock pulse to all schools simultaneously
  const handleBroadcastUnlock = () => {
    setSchools((prev) =>
      prev.map((sch) => {
        if (sch.isTampered) return sch;
        return {
          ...sch,
          status: 'AUTHORIZED_PRINT',
        };
      })
    );
    handleLogAuditEvent(
      'تم إرسال نبضة فك التشفير اللحظي الشاملة لجميع المراكز الامتحانية عند وقت الصفر (07:45 ص).',
      'SUCCESS'
    );
  };

  // Emergency Kill-Switch: Swap to Model B
  const handleTriggerEmergencyKillSwitch = () => {
    soundManager.playAlert();
    setIsEmergencyActive(true);
    setCurrentExam(INITIAL_EXAM_MODEL_B_BACKUP);

    // Reset printed counts and update statuses
    setSchools((prev) =>
      prev.map((sch) => ({
        ...sch,
        assignedExamId: INITIAL_EXAM_MODEL_B_BACKUP.id,
        status: 'AUTHORIZED_PRINT',
        currentPrintedCount: 0,
      }))
    );

    handleLogAuditEvent(
      'حالة طوارئ قصوى: تم تفعيل زر الإبادة وإلغاء النموذج A وتنشيط النموذج البديل (B) وتوزيعه لجميع المراكز فورياً لمنع التسريب.',
      'DANGER'
    );
  };

  // Emergency Model C: Swap to Model C
  const handleTriggerEmergencyModelC = () => {
    soundManager.playAlert();
    setIsEmergencyActive(true);
    setCurrentExam(INITIAL_EXAM_MODEL_C_BACKUP);

    setSchools((prev) =>
      prev.map((sch) => ({
        ...sch,
        assignedExamId: INITIAL_EXAM_MODEL_C_BACKUP.id,
        status: 'AUTHORIZED_PRINT',
        currentPrintedCount: 0,
      }))
    );

    handleLogAuditEvent(
      'إجراء استثنائي حرج: تم نشر النموذج الاحتياطي الثاني (C) وتصفير الطابعات لإحباط تداول أي نماذج سابقة.',
      'DANGER'
    );
  };

  // Restore normal Model A
  const handleRestoreNormalExam = () => {
    setIsEmergencyActive(false);
    setCurrentExam(INITIAL_EXAM_MODEL_A);
    handleLogAuditEvent('تمت استعادة النموذج الوزاري الأساسي (A).', 'INFO');
  };

  // Update real-time print counter for a school
  const handleUpdatePrintedCount = (schoolId: string, count: number) => {
    setSchools((prev) =>
      prev.map((sch) => {
        if (sch.id === schoolId) {
          const isDone = count >= sch.registeredStudentsCount;
          return {
            ...sch,
            currentPrintedCount: count,
            status: isDone ? 'PRINT_FINISHED' : 'PRINTING_ACTIVE',
            lastPrintTimestamp: new Date().toLocaleTimeString('ar-EG'),
          };
        }
        return sch;
      })
    );
  };

  // Unlock single school
  const handleSchoolUnlock = (schoolId: string) => {
    setSchools((prev) =>
      prev.map((sch) => (sch.id === schoolId ? { ...sch, status: 'AUTHORIZED_PRINT' } : sch))
    );
  };

  // Toggle school suspension
  const handleToggleSchoolSuspension = (schoolId: string) => {
    setSchools((prev) =>
      prev.map((sch) => {
        if (sch.id === schoolId) {
          const newTamperState = !sch.isTampered;
          handleLogAuditEvent(
            newTamperState
              ? `تم تجميد صلاحيات المركز الامتحاني (${sch.name}) لأسباب احترازية.`
              : `تم فك التجميد واستئناف صلاحيات المركز الامتحاني (${sch.name}).`,
            newTamperState ? 'DANGER' : 'SUCCESS'
          );
          return {
            ...sch,
            isTampered: newTamperState,
            status: newTamperState ? 'SUSPENDED' : 'AUTHORIZED_PRINT',
          };
        }
        return sch;
      })
    );
  };

  // Add a new school center dynamically
  const handleAddSchoolCenter = (newSchool: SchoolCenter) => {
    setSchools((prev) => [...prev, newSchool]);
    handleLogAuditEvent(
      `تمت إضافة وتفعيل مركز امتحاني جديد في المنظومة: ${newSchool.name} (${newSchool.code}) - المرحلة: ${newSchool.stageNameArabic}`,
      'SUCCESS'
    );
  };

  // Update Zero Hour unlock time dynamically (Administrator requirement)
  const handleUpdateZeroHour = (newTime: string) => {
    setCurrentExam((prev) => ({
      ...prev,
      zeroHourUnlockTime: newTime,
    }));
    setExamsList((prev) =>
      prev.map((e) => (e.id === currentExam.id ? { ...e, zeroHourUnlockTime: newTime } : e))
    );
    handleLogAuditEvent(
      `قام مسؤول النظام بتعديل موعد وقت الصفر الوزاري لفك الأسئلة إلى (${newTime}).`,
      'WARNING'
    );
  };

  // Update School Center data (e.g. Quota, Committee verification)
  const handleUpdateSchool = (updatedSchool: SchoolCenter) => {
    setSchools((prev) => prev.map((s) => (s.id === updatedSchool.id ? updatedSchool : s)));
  };

  // Save or Update Exam from ExamEditor
  const handleSaveExam = (savedExam: ExamPackage) => {
    setExamsList((prev) => {
      const idx = prev.findIndex((e) => e.id === savedExam.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedExam;
        return updated;
      }
      return [savedExam, ...prev];
    });

    // If currently active, sync it
    if (currentExam.id === savedExam.id) {
      setCurrentExam(savedExam);
    }

    handleLogAuditEvent(
      `تم حفظ وتحديث حزمة الامتحان المشفرة: ${savedExam.title} [النموذج ${savedExam.modelGroup}] بنجاح.`,
      'SUCCESS'
    );
  };

  // Deploy / Activate Exam to centers
  const handleDeployExamPackage = (examId: string) => {
    const examToDeploy = examsList.find((e) => e.id === examId) || currentExam;
    setCurrentExam(examToDeploy);
    setSchools((prev) =>
      prev.map((sch) => ({
        ...sch,
        assignedExamId: examToDeploy.id,
        currentPrintedCount: 0,
        status: 'PACKAGE_RECEIVED',
      }))
    );
    handleLogAuditEvent(
      `تم اعتماد وبث الامتحان المشفر (${examToDeploy.title}) [النموذج ${examToDeploy.modelGroup}] إلى كافة المراكز المتوافقة.`,
      'SUCCESS'
    );
    setActiveTab('ministry');
  };

  // User Management Handlers
  const handleAddUser = (userCandidate: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newUser: AppUser = {
      ...userCandidate,
      id: `USR-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [newUser, ...prev]);
    handleLogAuditEvent(
      `تم إرسال دعوة تسجيل وإضافة مستخدم جديد: ${newUser.name} (${newUser.email}) برتبة [${newUser.role}].`,
      'SUCCESS'
    );
  };

  const handleUpdateUser = (userId: string, updates: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
    handleLogAuditEvent(`تم تحديث صلاحيات وبيانات المستخدم ذي المعرف: ${userId}`, 'INFO');
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    handleLogAuditEvent(
      `تم حذف وصول المستخدم: ${target?.name || userId} من المنظومة نهائياً.`,
      'WARNING'
    );
  };

  const handleSendEmailInvitation = async (
    email: string,
    role: any,
    targetCenterId?: string
  ): Promise<boolean> => {
    // Simulated secure token dispatch
    const fakeToken = `INV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const newUser: AppUser = {
      id: `USR-INV-${Date.now().toString().slice(-4)}`,
      name: `مدعو جديد (${email.split('@')[0]})`,
      email,
      role,
      status: 'INVITED',
      createdAt: new Date().toISOString().split('T')[0],
      assignedCenterId: targetCenterId,
      invitationToken: fakeToken,
    };
    setUsers((prev) => [newUser, ...prev]);
    handleLogAuditEvent(
      `تم إرسال رابط دعوة مشفر إلى البريد الإلكتروني (${email}) للانضمام بدور [${role}].`,
      'SUCCESS'
    );
    return true;
  };

  const handleSelectSchoolTerminal = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setActiveTab('school');
    soundManager.playBeep();
  };

  // Authentication & Profile Handlers
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    if (user.role === 'SCHOOL_CENTER' && user.assignedCenterId) {
      setSelectedSchoolId(user.assignedCenterId);
      setActiveTab('school');
    } else {
      setActiveTab('ministry');
    }
  };

  const handleLogout = () => {
    handleLogAuditEvent(`تسجيل خروج آمن للمستخدم: ${currentUser.name}`, 'INFO');
    soundManager.playBeep();
    setIsAuthenticated(false);
  };

  const handleUpdateUserPassword = (userId: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );
  };

  const handleUpdateCurrentUser = (updatedUser: AppUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  };

  const totalQuota = schools.reduce((acc, s) => acc + s.registeredStudentsCount, 0);

  // If user is logged out, render the secure LoginView portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
        {/* Top Minimal Bar */}
        <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-bold">بوابة سياج المركزية للامتحانات الوزارية • جمهورية العراق</span>
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(true);
              soundManager.playSuccess();
            }}
            className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer text-[11px]"
          >
            تخطي واستعراض المنظومة كمسؤول
          </button>
        </div>

        <main className="flex-1 flex items-center justify-center p-4">
          <LoginView
            users={users}
            onLoginSuccess={handleLoginSuccess}
            onUpdateUserPassword={handleUpdateUserPassword}
            onLogAuditEvent={handleLogAuditEvent}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Platform Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isEmergencyActive={isEmergencyActive}
        connectedSchoolsCount={schools.length}
        totalStudentsQuota={totalQuota}
        activeExamTitle={currentExam.title}
        isAlternateModel={isEmergencyActive}
        currentUser={currentUser}
        allUsers={users}
        systemConfig={systemConfig}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
      />

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'ministry' && (
          <MinistryHub
            currentUser={currentUser}
            exam={currentExam}
            alternateExamB={INITIAL_EXAM_MODEL_B_BACKUP}
            alternateExamC={INITIAL_EXAM_MODEL_C_BACKUP}
            schools={schools}
            auditLogs={auditLogs}
            isEmergencyActive={isEmergencyActive}
            onBroadcastUnlock={handleBroadcastUnlock}
            onTriggerEmergencyKillSwitch={handleTriggerEmergencyKillSwitch}
            onTriggerEmergencyModelC={handleTriggerEmergencyModelC}
            onRestoreNormalExam={handleRestoreNormalExam}
            onSelectSchoolTerminal={handleSelectSchoolTerminal}
            onToggleSchoolSuspension={handleToggleSchoolSuspension}
            onAddSchoolCenter={handleAddSchoolCenter}
            onNavigateToCenters={() => setActiveTab('centers_mgmt')}
            onUpdateZeroHour={handleUpdateZeroHour}
          />
        )}

        {activeTab === 'school' && (
          <SchoolTerminal
            currentUser={currentUser}
            schools={schools}
            selectedSchoolId={selectedSchoolId}
            onSelectSchool={setSelectedSchoolId}
            exam={currentExam}
            studentTickets={studentTicketsMap[selectedSchoolId] || []}
            systemConfig={systemConfig}
            onUpdatePrintedCount={handleUpdatePrintedCount}
            onSchoolUnlock={handleSchoolUnlock}
            onLogAuditEvent={handleLogAuditEvent}
            onUpdateSchool={handleUpdateSchool}
            onUpdateZeroHour={handleUpdateZeroHour}
          />
        )}

        {activeTab === 'exam_editor' && (
          <ExamEditor
            currentUser={currentUser}
            exams={examsList}
            systemConfig={systemConfig}
            onSaveExam={handleSaveExam}
            onDeployExamPackage={handleDeployExamPackage}
            onLogAuditEvent={handleLogAuditEvent}
            onNavigateToSettings={() => setActiveTab('system_config')}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement
            currentUser={currentUser}
            users={users}
            schools={schools}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onSendEmailInvitation={handleSendEmailInvitation}
            onLogAuditEvent={handleLogAuditEvent}
          />
        )}

        {activeTab === 'centers_mgmt' && (
          <CentersManagement
            centers={schools}
            users={users}
            onUpdateCenters={setSchools}
            onUpdateUsers={setUsers}
            onLogAuditEvent={handleLogAuditEvent}
            defaultExamId={currentExam.id}
            onNavigateToSchoolTerminal={(schId) => {
              setSelectedSchoolId(schId);
              setActiveTab('school');
            }}
          />
        )}

        {activeTab === 'system_config' && currentUser.role === 'ADMIN' && (
          <AdminSystemSettings
            currentUser={currentUser}
            systemConfig={systemConfig}
            onUpdateSystemConfig={(newCfg) => {
              setSystemConfig(newCfg);
              handleLogAuditEvent(
                'قام مسؤول النظام بتحديث إعدادات مفاصل المنظومة وهيكلية حقول الامتحانات.',
                'WARNING'
              );
            }}
            onLogAuditEvent={handleLogAuditEvent}
            onNavigateToExams={() => setActiveTab('exam_editor')}
          />
        )}

        {activeTab === 'forensic' && (
          <ForensicInspector
            schools={schools}
            exam={currentExam}
            onFreezeSchool={handleToggleSchoolSuspension}
            onTriggerKillSwitch={handleTriggerEmergencyKillSwitch}
            onLogAuditEvent={handleLogAuditEvent}
          />
        )}

        {activeTab === 'profile' && (
          <AccountProfile
            currentUser={currentUser}
            auditLogs={auditLogs}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onLogAuditEvent={handleLogAuditEvent}
          />
        )}

        {activeTab === 'security_guide' && <SecurityGuide />}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <span>منظومة سياج لحماية وتوزيع الامتحانات الوزارية • وزارة التربية والتعليم</span>
            <span className="mx-2 text-slate-700">|</span>
            <span className="text-slate-400">
              المستخدم الحالي: <strong className="text-cyan-400">{currentUser.name}</strong> ({currentUser.role === 'ADMIN' ? 'مسؤول رئيسي' : currentUser.role === 'SUPERVISOR' ? 'مشرف وزاري' : 'مدير مركز امتحاني'})
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-600">
            <span>TLS v1.3 STRICT</span>
            <span>AES-256-GCM MULTI-MODEL ENCLAVE</span>
            <span>FORENSIC STEGANOGRAPHY v5</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
