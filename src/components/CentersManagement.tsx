import React, { useState, useMemo } from 'react';
import {
  Building2,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Edit3,
  Trash2,
  UserPlus,
  SlidersHorizontal,
  Server,
  Database,
  ArrowUpDown,
  Check,
  X,
  Radio,
  FileSpreadsheet,
  QrCode,
  Key,
  School,
  Lock,
  ChevronRight,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { SchoolCenter, AppUser, EducationStage, EmisEntity, EmisSyncConfig } from '../types';
import {
  DEFAULT_EMIS_CONFIG,
  OFFICIAL_EMIS_ENTITIES_ENTITY_1,
  fetchEmisEntities,
  syncEntitiesToSchoolCenters,
  syncEntitiesToUsers,
  FetchEmisResult,
} from '../utils/emisSync';
import { soundManager } from '../utils/security';

interface CentersManagementProps {
  centers: SchoolCenter[];
  users: AppUser[];
  onUpdateCenters: (centers: SchoolCenter[]) => void;
  onUpdateUsers: (users: AppUser[]) => void;
  onLogAuditEvent: (description: string, severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER') => void;
  defaultExamId: string;
  onNavigateToSchoolTerminal?: (centerId: string) => void;
}

export const CentersManagement: React.FC<CentersManagementProps> = ({
  centers,
  users,
  onUpdateCenters,
  onUpdateUsers,
  onLogAuditEvent,
  defaultExamId,
  onNavigateToSchoolTerminal,
}) => {
  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'emis_sync' | 'print_export'>('directory');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [govFilter, setGovFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // EMIS Integration states
  const [emisConfig, setEmisConfig] = useState<EmisSyncConfig>(DEFAULT_EMIS_CONFIG);
  const [customPayload, setCustomPayload] = useState<string>('');
  const [isFetchingEmis, setIsFetchingEmis] = useState(false);
  const [lastFetchResult, setLastFetchResult] = useState<FetchEmisResult | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewEntities, setPreviewEntities] = useState<EmisEntity[]>([]);
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());
  const [autoMapUsersOpt, setAutoMapUsersOpt] = useState(true);

  // Manual Add / Edit Center Modal
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<SchoolCenter | null>(null);
  const [centerFormData, setCenterFormData] = useState<Partial<SchoolCenter>>({
    code: '',
    name: '',
    educationStage: 'SECONDARY',
    stageNameArabic: 'المرحلة الإعدادية والثانوية',
    governorate: 'بغداد',
    directorate: 'المديرية العامة لتربية بغداد / الكرخ الأولى',
    chiefProctorName: '',
    chiefProctorPhone: '',
    chiefProctorEmail: '',
    registeredStudentsCount: 60,
    printerModel: 'HP LaserJet Enterprise High-Security Spooler',
    printerIp: '192.168.10.50 (VLAN-EXAM-SECURE)',
    status: 'PACKAGE_RECEIVED',
    hallsCount: 4,
  });

  // Unique Governorates in current centers
  const availableGovernorates = useMemo(() => {
    const set = new Set<string>();
    centers.forEach((c) => {
      if (c.governorate) set.add(c.governorate);
    });
    return Array.from(set);
  }, [centers]);

  // Filtered Centers list
  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.governorate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.directorate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.chiefProctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.emisSchoolCode && c.emisSchoolCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStage = stageFilter === 'ALL' || c.educationStage === stageFilter;
      const matchGov = govFilter === 'ALL' || c.governorate === govFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'SUSPENDED' && c.status === 'SUSPENDED') ||
        (statusFilter === 'ACTIVE' && c.status !== 'SUSPENDED') ||
        (statusFilter === 'EMIS_SYNCED' && !!c.emisSyncedAt);

      return matchSearch && matchStage && matchGov && matchStatus;
    });
  }, [centers, searchQuery, stageFilter, govFilter, statusFilter]);

  // Stats Calculations
  const stats = useMemo(() => {
    const total = centers.length;
    const totalStudents = centers.reduce((sum, c) => sum + (c.registeredStudentsCount || 0), 0);
    const emisSynced = centers.filter((c) => !!c.emisSyncedAt || !!c.emisEntityId).length;
    const activePrinters = centers.filter((c) => c.printerStatus === 'ONLINE' || c.printerStatus === 'PRINTING').length;
    const secondaryCount = centers.filter((c) => c.educationStage === 'SECONDARY').length;
    const intermediateCount = centers.filter((c) => c.educationStage === 'INTERMEDIATE').length;
    const primaryCount = centers.filter((c) => c.educationStage === 'PRIMARY').length;

    return { total, totalStudents, emisSynced, activePrinters, secondaryCount, intermediateCount, primaryCount };
  }, [centers]);

  // Handler: Execute EMIS Live Fetch
  const handleFetchFromEmis = async (testOnly = false) => {
    setIsFetchingEmis(true);
    soundManager.playBeep();

    try {
      const result = await fetchEmisEntities(emisConfig, customPayload);
      setLastFetchResult(result);

      if (result.success && result.entities.length > 0) {
        soundManager.playSuccess();
        setEmisConfig((prev) => ({
          ...prev,
          lastSyncStatus: 'SUCCESS',
          lastSyncTimestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          lastSyncMessage: result.message,
        }));

        if (!testOnly) {
          setPreviewEntities(result.entities);
          // Select all by default
          setSelectedEntityIds(new Set(result.entities.map((e) => String(e.id))));
          setShowPreviewModal(true);
        } else {
          onLogAuditEvent(`فحص الاتصال بخادم EMIS بنجاح: ${result.message}`, 'INFO');
        }
      } else {
        soundManager.playWarning();
        setEmisConfig((prev) => ({
          ...prev,
          lastSyncStatus: 'FAILED',
          lastSyncMessage: result.message,
        }));
        onLogAuditEvent(`تعذر سحب البيانات من EMIS: ${result.message}`, 'WARNING');
      }
    } catch (err) {
      soundManager.playAlert();
      const errMsg = err instanceof Error ? err.message : 'خطأ اتصال غير معروف';
      setEmisConfig((prev) => ({
        ...prev,
        lastSyncStatus: 'FAILED',
        lastSyncMessage: errMsg,
      }));
      onLogAuditEvent(`فشل الاتصال برابط EMIS: ${errMsg}`, 'DANGER');
    } finally {
      setIsFetchingEmis(false);
    }
  };

  // Handler: Confirm Sync of Selected Entities
  const handleConfirmSync = () => {
    const toSync = previewEntities.filter((e) => selectedEntityIds.has(String(e.id)));
    if (toSync.length === 0) return;

    soundManager.playSuccess();

    // 1. Sync Centers
    const { updatedCenters, createdCount, updatedCount } = syncEntitiesToSchoolCenters(
      toSync,
      centers,
      defaultExamId
    );
    onUpdateCenters(updatedCenters);

    // 2. Sync Users if option enabled
    let usersCreated = 0;
    let usersUpdated = 0;
    if (autoMapUsersOpt) {
      const userSyncRes = syncEntitiesToUsers(toSync, users, updatedCenters);
      onUpdateUsers(userSyncRes.updatedUsers);
      usersCreated = userSyncRes.createdCount;
      usersUpdated = userSyncRes.updatedCount;
    }

    onLogAuditEvent(
      `تمت مزامنة نظام إدارة المعلومات التربوية EMIS: إضافة ${createdCount} مركز، تحديث ${updatedCount} مركز، وإنشاء/تحديث ${usersCreated + usersUpdated} حساب مستخدم`,
      'SUCCESS'
    );

    setShowPreviewModal(false);
    setActiveSubTab('directory');
  };

  // Quick Direct Sync Handler
  const handleQuickEmisSync = async () => {
    setIsFetchingEmis(true);
    soundManager.playBeep();
    const result = await fetchEmisEntities(emisConfig);
    if (result.success && result.entities.length > 0) {
      const { updatedCenters, createdCount, updatedCount } = syncEntitiesToSchoolCenters(
        result.entities,
        centers,
        defaultExamId
      );
      onUpdateCenters(updatedCenters);

      if (autoMapUsersOpt) {
        const userSyncRes = syncEntitiesToUsers(result.entities, users, updatedCenters);
        onUpdateUsers(userSyncRes.updatedUsers);
      }

      soundManager.playSuccess();
      onLogAuditEvent(
        `مزامنة فورية سريعة مع EMIS: تم تحديث ${updatedCenters.length} مركزاً وربط حسابات المستخدمين`,
        'SUCCESS'
      );
      setEmisConfig((prev) => ({
        ...prev,
        lastSyncStatus: 'SUCCESS',
        lastSyncTimestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        lastSyncMessage: `تمت المزامنة بنجاح (+${createdCount} جديد، ~${updatedCount} محدث)`,
      }));
    }
    setIsFetchingEmis(false);
  };

  // Open Create Center Modal
  const handleOpenCreateCenter = () => {
    setEditingCenter(null);
    const randomCode = `SCH-${Math.floor(Math.random() * 800 + 200)}`;
    const randomPin = String(Math.floor(Math.random() * 9000 + 1000));
    setCenterFormData({
      code: randomCode,
      name: '',
      educationStage: 'SECONDARY',
      stageNameArabic: 'المرحلة الإعدادية والثانوية',
      governorate: 'بغداد',
      directorate: 'المديرية العامة لتربية بغداد / الكرخ الأولى',
      chiefProctorName: '',
      chiefProctorPhone: '',
      chiefProctorEmail: '',
      registeredStudentsCount: 60,
      printerModel: 'HP LaserJet Enterprise Secure Spooler',
      printerIp: `192.168.${Math.floor(Math.random() * 80 + 10)}.50 (VLAN-EXAM-SECURE)`,
      status: 'PACKAGE_RECEIVED',
      hallsCount: 4,
      twoFactorPin: randomPin,
      watermarkSignatureKey: `KEY-SIG-BGD-${randomCode}`,
      isTampered: false,
      offlineEmergencyCode: `EMG-${randomPin}-BGD-01`,
    });
    setShowCenterModal(true);
    soundManager.playBeep();
  };

  // Open Edit Center Modal
  const handleOpenEditCenter = (center: SchoolCenter) => {
    setEditingCenter(center);
    setCenterFormData({ ...center });
    setShowCenterModal(true);
    soundManager.playBeep();
  };

  // Save Center
  const handleSaveCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerFormData.name || !centerFormData.code) return;

    soundManager.playSuccess();

    if (editingCenter) {
      // Update
      const updated = centers.map((c) =>
        c.id === editingCenter.id ? ({ ...c, ...centerFormData } as SchoolCenter) : c
      );
      onUpdateCenters(updated);
      onLogAuditEvent(`تعديل بيانات المركز الامتحاني: ${centerFormData.name} (${centerFormData.code})`, 'INFO');
    } else {
      // Create
      const newId = centerFormData.code || `SCH-${Date.now().toString().slice(-4)}`;
      const newPin1 = centerFormData.twoFactorPin || String(Math.floor(Math.random() * 9000 + 1000));
      const newPin2 = String(Math.floor(Math.random() * 9000 + 1000));
      const newPin3 = String(Math.floor(Math.random() * 9000 + 1000));
      const quotaNum = Number(centerFormData.examCopiesQuota) || Number(centerFormData.registeredStudentsCount) || 60;

      const newCenter: SchoolCenter = {
        ...(centerFormData as SchoolCenter),
        id: newId,
        assignedExamId: defaultExamId,
        currentPrintedCount: 0,
        printerStatus: 'ONLINE',
        twoFactorPin: newPin1,
        examCopiesQuota: quotaNum,
        registeredStudentsCount: quotaNum,
        watermarkSignatureKey: centerFormData.watermarkSignatureKey || `KEY-SIG-${newId}`,
        isTampered: false,
        examCommittee: [
          {
            id: `COM-${newId}-1`,
            roleTitle: 'رئيس اللجنة الامتحانية بالمركز',
            name: centerFormData.chiefProctorName || 'أ. رئيس المركز الامتحاني',
            phone: centerFormData.chiefProctorPhone || '07700000000',
            twoFactorPin: newPin1,
            verified: false,
            smsStatus: 'DELIVERED',
            smsSentAt: '07:30 ص',
          },
          {
            id: `COM-${newId}-2`,
            roleTitle: 'المشرف التربوي / الوزاري المتابع',
            name: 'د. المشرف التربوي الوزاري المتابع',
            phone: '07801112233',
            twoFactorPin: newPin2,
            verified: false,
            smsStatus: 'DELIVERED',
            smsSentAt: '07:30 ص',
          },
          {
            id: `COM-${newId}-3`,
            roleTitle: 'عضو اللجنة الامتحانية (المراقب الأول)',
            name: 'أ. المراقب الأول للجنة الامتحانية',
            phone: '07703334455',
            twoFactorPin: newPin3,
            verified: false,
            smsStatus: 'DELIVERED',
            smsSentAt: '07:30 ص',
          },
        ],
      };
      onUpdateCenters([...centers, newCenter]);
      onLogAuditEvent(`إضافة مركز امتحاني جديد للنظام: ${newCenter.name} (${newCenter.code})`, 'SUCCESS');
    }

    setShowCenterModal(false);
  };

  // Toggle Suspend Status
  const handleToggleSuspendCenter = (center: SchoolCenter) => {
    soundManager.playWarning();
    const newStatus: SchoolCenter['status'] = center.status === 'SUSPENDED' ? 'PACKAGE_RECEIVED' : 'SUSPENDED';
    const updated = centers.map((c) => (c.id === center.id ? { ...c, status: newStatus } : c));
    onUpdateCenters(updated);
    onLogAuditEvent(
      `${newStatus === 'SUSPENDED' ? 'تعليق وتجميد' : 'إلغاء تعليق وتفعيل'} المركز الامتحاني: ${center.name}`,
      newStatus === 'SUSPENDED' ? 'WARNING' : 'INFO'
    );
  };

  // Delete Center
  const handleDeleteCenter = (center: SchoolCenter) => {
    if (!window.confirm(`هل أنت متأكد من حذف المركز الامتحاني "${center.name}" (${center.code})؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }
    soundManager.playAlert();
    const updated = centers.filter((c) => c.id !== center.id);
    onUpdateCenters(updated);
    onLogAuditEvent(`حذف المركز الامتحاني من المنظومة: ${center.name} (${center.code})`, 'DANGER');
  };

  // Generate / View User for Center
  const handleEnsureCenterUser = (center: SchoolCenter) => {
    const existingUser = users.find((u) => u.assignedCenterId === center.id);
    if (existingUser) {
      alert(`المركز مرتبط بالفعل بالحساب:\nالاسم: ${existingUser.name}\nالبريد: ${existingUser.email}\nالهاتف: ${existingUser.phone || 'غير مسجل'}`);
      return;
    }

    soundManager.playSuccess();
    const userEmail = center.chiefProctorEmail || `center.${center.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@moedu.gov.iq`;
    const newUser: AppUser = {
      id: `USR-${center.id}`,
      name: `${center.chiefProctorName || 'مدير المركز'} (${center.name})`,
      email: userEmail,
      role: 'SCHOOL_CENTER',
      password: 'Center@2026',
      department: `اللجنة الامتحانية - ${center.name}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      assignedCenterId: center.id,
      assignedStages: [center.educationStage],
      phone: center.chiefProctorPhone,
      twoFactorEnabled: false,
    };

    onUpdateUsers([...users, newUser]);
    onLogAuditEvent(`توليد حساب مستخدم جديد لرئيس المركز الامتحاني: ${newUser.name}`, 'SUCCESS');
    alert(`تم إنشاء حساب مستخدم للمركز بنجاح:\nالبريد: ${newUser.email}\nكلمة المرور المؤقتة: Center@2026`);
  };

  // Print Centers Directory
  const handlePrintDirectory = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Integration Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 rounded-xl text-cyan-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-wide">
                    إدارة المراكز الامتحانية ونظام المعلومات التربوية (EMIS)
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Entity 1 Connected
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  مزامنة لحظية للكيانات التعليمية والمدارس ومدراء المراكز مع قاعدة بيانات وزارة التربية عبر الرابط الحكومي المعتمد
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Live EMIS Status Badge */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Live Status indicator */}
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 text-[11px] font-medium font-mono">
                emisapi.moedu.gov.iq:8443
              </span>
            </div>

            {/* Quick Live Sync Button */}
            <button
              id="btn-quick-emis-sync"
              onClick={handleQuickEmisSync}
              disabled={isFetchingEmis}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-900/30 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingEmis ? 'animate-spin' : ''}`} />
              <span>{isFetchingEmis ? 'جاري المزامنة...' : 'مزامنة فورية مع EMIS'}</span>
            </button>

            {/* Add New Center Button */}
            <button
              id="btn-add-center-modal"
              onClick={handleOpenCreateCenter}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>إضافة مركز يدوي</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي المراكز المعتمدة</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-white">{stats.total}</span>
              <span className="text-[10px] text-slate-500">مركزاً امتحانياً</span>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">سعة الطلاب الموزعة</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-cyan-400">{stats.totalStudents}</span>
              <span className="text-[10px] text-cyan-600 font-bold">مقعد / طالب</span>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">مُزامنة مع نظام EMIS</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-400">{stats.emisSynced}</span>
              <span className="text-[10px] text-emerald-600 font-bold">
                ({Math.round((stats.emisSynced / (stats.total || 1)) * 100)}%)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">طابعات مؤمنة متصلة (Online)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-blue-400">{stats.activePrinters}</span>
              <span className="text-[10px] text-slate-500">شبكة VLAN مشفرة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'directory'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <School className="w-4 h-4 text-cyan-400" />
            <span>قائمة ودليل المراكز الامتحانية ({filteredCenters.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('emis_sync')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'emis_sync'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>لوحة الربط والمزامنة مع خادم EMIS</span>
            {emisConfig.lastSyncStatus === 'SUCCESS' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('print_export')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'print_export'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة وتصدير الكشوف الرسمية</span>
          </button>
        </div>

        {/* View mode toggle (Cards vs Table) */}
        {activeSubTab === 'directory' && (
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === 'table' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              جدول تفصيلي
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === 'cards' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              بطاقات المراكز
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tab 1: Centers Directory */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="البحث بالاسم، الرمز، المحافظة، المديرية، رئيس المركز..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">جميع المراحل الدراسية</option>
                <option value="SECONDARY">المرحلة الإعدادية</option>
                <option value="INTERMEDIATE">المرحلة المتوسطة</option>
                <option value="PRIMARY">المرحلة الابتدائية</option>
                <option value="ALL">مراكز شاملة</option>
              </select>

              {/* Governorate Filter */}
              <select
                value={govFilter}
                onChange={(e) => setGovFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">جميع المحافظات</option>
                {availableGovernorates.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="ACTIVE">المراكز النشطة</option>
                <option value="SUSPENDED">المراكز المعلقة</option>
                <option value="EMIS_SYNCED">المراكز المتزامنة مع EMIS</option>
              </select>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-3 w-12">#</th>
                      <th className="p-3">رمز المركز</th>
                      <th className="p-3">اسم المركز الامتحاني</th>
                      <th className="p-3">المرحلة والمديرية</th>
                      <th className="p-3">السعة والطلاب</th>
                      <th className="p-3">رئيس المركز المعتمد</th>
                      <th className="p-3">طابعة الامتحان الآمنة</th>
                      <th className="p-3">المزامنة مع EMIS</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCenters.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          لا توجد مراكز مطابقة لبحثك. اضغط على "إضافة مركز يدوي" أو قم بالمزامنة مع EMIS.
                        </td>
                      </tr>
                    ) : (
                      filteredCenters.map((center, idx) => {
                        const isSuspended = center.status === 'SUSPENDED';
                        const hasUser = users.some((u) => u.assignedCenterId === center.id);

                        return (
                          <tr
                            key={center.id}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isSuspended ? 'bg-rose-950/10 opacity-75' : ''
                            }`}
                          >
                            <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-cyan-300">
                              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {center.code}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span>{center.name}</span>
                                {isSuspended && (
                                  <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] rounded font-bold">
                                    معلق
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {center.governorate} • {center.directorate}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  center.educationStage === 'SECONDARY'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : center.educationStage === 'INTERMEDIATE'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : center.educationStage === 'PRIMARY'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {center.stageNameArabic}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-200">
                                {center.registeredStudentsCount}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">طالب</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">
                                {center.hallsCount ? `${center.hallsCount} قاعات` : '4 قاعات امتحانية'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="text-slate-200 font-medium">{center.chiefProctorName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{center.chiefProctorPhone}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-[11px] text-slate-300 truncate max-w-[150px]" title={center.printerModel}>
                                {center.printerModel}
                              </div>
                              <div className="text-[10px] text-emerald-400 font-mono">{center.printerIp}</div>
                            </td>
                            <td className="p-3">
                              {center.emisSyncedAt || center.emisEntityId ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3" />
                                    مُزامن EMIS
                                  </span>
                                  {center.emisSchoolCode && (
                                    <span className="text-[9px] text-slate-400 font-mono block">
                                      {center.emisSchoolCode}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                  محلي فقط
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* Ensure/Link User account */}
                                <button
                                  onClick={() => handleEnsureCenterUser(center)}
                                  title={hasUser ? 'الحساب مرتبط' : 'توليد حساب للمركز'}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    hasUser
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400 hover:text-cyan-300 border-slate-700'
                                  }`}
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Center */}
                                <button
                                  onClick={() => handleOpenEditCenter(center)}
                                  title="تعديل بيانات المركز"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Suspend/Resume */}
                                <button
                                  onClick={() => handleToggleSuspendCenter(center)}
                                  title={isSuspended ? 'إعادة التفعيل' : 'تجميد وتعليق المركز'}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isSuspended
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                  }`}
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Center */}
                                <button
                                  onClick={() => handleDeleteCenter(center)}
                                  title="حذف المركز"
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCenters.map((center) => {
                const isSuspended = center.status === 'SUSPENDED';
                const hasUser = users.some((u) => u.assignedCenterId === center.id);

                return (
                  <div
                    key={center.id}
                    className={`bg-slate-900 border rounded-xl p-4 space-y-3 transition-all ${
                      isSuspended
                        ? 'border-rose-900/50 bg-rose-950/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {center.code}
                          </span>
                          {center.emisSyncedAt && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              EMIS
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1.5">{center.name}</h3>
                        <p className="text-xs text-slate-400">
                          {center.governorate} • {center.directorate}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          center.educationStage === 'SECONDARY'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : center.educationStage === 'INTERMEDIATE'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : center.educationStage === 'PRIMARY'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {center.stageNameArabic}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">رئيس المركز:</span>
                        <span className="font-medium text-slate-200">{center.chiefProctorName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">الهاتف:</span>
                        <span className="font-mono text-slate-400">{center.chiefProctorPhone}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">سعة الطلاب:</span>
                        <span className="font-bold text-cyan-400">
                          {center.registeredStudentsCount} طالب ({center.hallsCount || 4} قاعات)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">طابعة الامتحان:</span>
                        <span className="text-[11px] text-emerald-400 font-mono">{center.printerIp}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEnsureCenterUser(center)}
                          className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1 font-medium transition-all ${
                            hasUser
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                          }`}
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>{hasUser ? 'الحساب نشط' : 'توليد حساب'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditCenter(center)}
                          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-all"
                        >
                          تعديل
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleSuspendCenter(center)}
                          className={`p-1.5 rounded text-xs border ${
                            isSuspended
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCenter(center)}
                          className="p-1.5 rounded text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: EMIS Integration Console */}
      {activeSubTab === 'emis_sync' && (
        <div className="space-y-6">
          {/* Main Integration Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    إعدادات الاتصال بنظام إدارة المعلومات التربوية (EMIS API)
                  </h2>
                  <p className="text-xs text-slate-400">
                    الربط مع البوابة الحكومية الموحدة لوزارة التربية العراقية (Epic EMIS Server)
                  </p>
                </div>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">حالة الربط:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  مُهيأ ومتصل
                </span>
              </div>
            </div>

            {/* Config Fields Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>عنوان خادم EMIS الوزاري (API Base URL):</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Port: 8443</span>
                </label>
                <input
                  type="text"
                  value={emisConfig.apiUrl}
                  onChange={(e) => setEmisConfig({ ...emisConfig, apiUrl: e.target.value })}
                  placeholder="https://emisapi.moedu.gov.iq:8443"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  الخادم الرسمي المعتمد لوزارة التربية العراقية
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>مسار الكيان المطلوب (Entity Endpoint):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Entity 1 Hierarchy</span>
                </label>
                <input
                  type="text"
                  value={emisConfig.entityEndpoint}
                  onChange={(e) => setEmisConfig({ ...emisConfig, entityEndpoint: e.target.value })}
                  placeholder="/entities/1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  يمثل الكيان رقم 1 (المديريات العامة والمراكز والمدارس التابعة لها)
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  رمز المصادقة الوزاري (Bearer Token / API Key - اختياري):
                </label>
                <input
                  type="password"
                  value={emisConfig.apiKeyOrToken || ''}
                  onChange={(e) => setEmisConfig({ ...emisConfig, apiKeyOrToken: e.target.value })}
                  placeholder="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  يُستخدم عند الاتصال الآمن من خارج شبكة الوزارة الحكومية
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  وضع توجيه الاتصال (Connection Mode):
                </label>
                <select
                  value={emisConfig.connectionMode}
                  onChange={(e) =>
                    setEmisConfig({
                      ...emisConfig,
                      connectionMode: e.target.value as 'PROXY' | 'DIRECT' | 'CACHED_FALLBACK',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="PROXY">توجيه عبر الخادم الوسيط (Proxy Bypass - مُوصى به لتجاوز CORS)</option>
                  <option value="DIRECT">اتصال مباشر (Direct Browser Fetch)</option>
                  <option value="CACHED_FALLBACK">قاعدة بيانات الكيان الوزاري 1 المعتمدة (Offline/Fallback Mode)</option>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  الوكيل يتكفل بحل شهادات SSL الحكومية وتجاوز قيود المنافذ
                </span>
              </div>
            </div>

            {/* Direct JSON Payload Pasting (Backup Method) */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>إدخال بيانات JSON مباشرة من تصدير EMIS (اختياري / بديل سريع):</span>
                </label>
                {customPayload && (
                  <button
                    onClick={() => setCustomPayload('')}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    مسح
                  </button>
                )}
              </div>
              <textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder='لصق حمولة بيانات EMIS بتنسيق JSON هنا مثل: [{"id": 101, "name": "ثانوية المتفوقين", "governorate": "بغداد", "studentCapacity": 80, ...}]'
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Checkbox Options */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoMapUsersOpt}
                  onChange={(e) => setAutoMapUsersOpt(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>توليد وتحديث حسابات المستخدمين لمدراء المراكز المستوردة تلقائياً</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={emisConfig.autoGenerateCredentials}
                  onChange={(e) =>
                    setEmisConfig({ ...emisConfig, autoGenerateCredentials: e.target.checked })
                  }
                  className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>توليد مفاتيح تشفير ورموز PIN أمنية للمراكز الجديدة</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => handleFetchFromEmis(false)}
                disabled={isFetchingEmis}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingEmis ? 'animate-spin' : ''}`} />
                <span>
                  {isFetchingEmis ? 'جاري الاتصال وسحب البيانات...' : 'بدء جلب الكيانات والمراكز من EMIS'}
                </span>
              </button>

              <button
                onClick={() => handleFetchFromEmis(true)}
                disabled={isFetchingEmis}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Server className="w-4 h-4 text-cyan-400" />
                <span>فحص استجابة الخادم فقط (Ping Test)</span>
              </button>
            </div>

            {/* Last Fetch Diagnostics */}
            {lastFetchResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  lastFetchResult.success
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    {lastFetchResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{lastFetchResult.message}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80">
                    المصدر: {lastFetchResult.source}
                  </span>
                </div>

                {lastFetchResult.rawResponseSnippet && (
                  <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-300 break-all">
                    {lastFetchResult.rawResponseSnippet}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ministry Entity 1 Reference Guide */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>حول هيكل الكيان الوزاري (EMIS Entity 1):</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              وفقاً لنظام إدارة المعلومات التربوية التابع لوزارة التربية العراقية، يمثل المسار{' '}
              <code className="bg-slate-950 px-2 py-0.5 rounded text-cyan-300 font-mono">
                /entities/1
              </code>{' '}
              الكيان الوزاري الرئيسي والمركزي الذي ترتبط به المديريات العامة للتربية في بغداد والمحافظات (الكرخ الأولى، الرصافة الأولى، البصرة، نينوى، النجف، كربلاء، ذي قار، كركوك...). عند المزامنة، يقوم النظام بمطابقة المدارس مع المراكز الامتحانية واستيراد السعات الرسمية وأرقام هواتف المدراء وبيانات الطابعات المؤمنة تلقائياً.
            </p>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Official Print & Export Directory */}
      {activeSubTab === 'print_export' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                دليل المراكز الامتحانية المعتمد - وزارة التربية العراقية
              </h3>
              <p className="text-xs text-slate-400">
                نسخة رسمية للطباعة والتوزيع على اللجان الامتحانية وغرفة العمليات الوزارية
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintDirectory}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-amber-900/30"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الكشف الرسمي الآن</span>
              </button>
            </div>
          </div>

          {/* Printable Document Container */}
          <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-6 border border-slate-300 print:shadow-none print:border-none print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">جمهورية العراق</h4>
                <h3 className="text-lg font-black text-slate-950">وزارة التربية - اللجنة الدائمة للامتحانات العامة</h3>
                <p className="text-xs text-slate-600">منظومة سياج المركزية لتوزيع الأسئلة المشفرة • كشف المراكز الامتحانية</p>
              </div>
              <div className="text-left space-y-1 text-xs">
                <div><strong>تاريخ الإصدار:</strong> {new Date().toLocaleDateString('ar-IQ')}</div>
                <div><strong>إجمالي المراكز:</strong> {centers.length} مركزاً</div>
                <div><strong>السعة الإجمالية:</strong> {stats.totalStudents} طالباً</div>
                <div><strong>حالة الربط:</strong> EMIS Verified</div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-right border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
                  <th className="p-2 border border-slate-300">#</th>
                  <th className="p-2 border border-slate-300">رمز المركز</th>
                  <th className="p-2 border border-slate-300">اسم المركز الامتحاني</th>
                  <th className="p-2 border border-slate-300">المحافظة / المديرية</th>
                  <th className="p-2 border border-slate-300">المرحلة الدراسية</th>
                  <th className="p-2 border border-slate-300">سعة الطلاب</th>
                  <th className="p-2 border border-slate-300">رئيس المركز</th>
                  <th className="p-2 border border-slate-300">رقم الهاتف</th>
                  <th className="p-2 border border-slate-300">طراز الطابعة والـ IP</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((c, i) => (
                  <tr key={c.id} className="border-b border-slate-200">
                    <td className="p-2 border border-slate-300 font-mono text-center">{i + 1}</td>
                    <td className="p-2 border border-slate-300 font-mono font-bold">{c.code}</td>
                    <td className="p-2 border border-slate-300 font-bold">{c.name}</td>
                    <td className="p-2 border border-slate-300">{c.governorate} - {c.directorate}</td>
                    <td className="p-2 border border-slate-300">{c.stageNameArabic}</td>
                    <td className="p-2 border border-slate-300 font-bold text-center">{c.registeredStudentsCount}</td>
                    <td className="p-2 border border-slate-300">{c.chiefProctorName}</td>
                    <td className="p-2 border border-slate-300 font-mono">{c.chiefProctorPhone}</td>
                    <td className="p-2 border border-slate-300 text-[10px] font-mono">{c.printerIp}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer and Stamps */}
            <div className="pt-8 border-t border-slate-300 flex items-center justify-between text-xs text-slate-700">
              <div className="text-center space-y-4">
                <p className="font-bold">مسؤول قسم إدارة المعلومات (EMIS)</p>
                <div className="h-12 border-b border-dashed border-slate-400 w-48 mx-auto" />
                <p className="text-[10px] text-slate-500">التوقيع والختم الرسمي</p>
              </div>

              <div className="text-center space-y-4">
                <p className="font-bold">رئيس اللجنة الدائمة للامتحانات</p>
                <div className="h-12 border-b border-dashed border-slate-400 w-48 mx-auto" />
                <p className="text-[10px] text-slate-500">التوقيع والمصادقة الوزارية</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: EMIS Sync Preview & Selective Import */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    معاينة واعتماد مزامنة كيانات EMIS ({previewEntities.length} مركزاً تم جلبه)
                  </h3>
                  <p className="text-xs text-slate-400">
                    حدد المراكز والمدارس التي ترغب في استيرادها ومزامنتها في قاعدة بيانات المنظومة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Bulk Select Bar */}
            <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setSelectedEntityIds(new Set(previewEntities.map((e) => String(e.id))))
                  }
                  className="text-cyan-400 hover:underline font-bold"
                >
                  تحديد الكل ({previewEntities.length})
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => setSelectedEntityIds(new Set())}
                  className="text-slate-400 hover:underline"
                >
                  إلغاء تحديد الكل
                </button>
              </div>

              <span className="text-slate-300 font-medium">
                المحدد: <strong className="text-emerald-400">{selectedEntityIds.size}</strong> من{' '}
                {previewEntities.length}
              </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-800/80">
              {previewEntities.map((entity) => {
                const isSelected = selectedEntityIds.has(String(entity.id));
                const existing = centers.find(
                  (c) => c.code === entity.code || c.name === entity.name || c.emisEntityId === String(entity.id)
                );

                return (
                  <div
                    key={entity.id}
                    onClick={() => {
                      const next = new Set(selectedEntityIds);
                      if (isSelected) next.delete(String(entity.id));
                      else next.add(String(entity.id));
                      setSelectedEntityIds(next);
                    }}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-slate-850/80 hover:bg-slate-800' : 'hover:bg-slate-950/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="rounded bg-slate-950 border-slate-700 text-cyan-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {entity.code}
                          </span>
                          <h4 className="text-sm font-bold text-white">{entity.name}</h4>
                          {existing ? (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded font-bold">
                              تحديث مركز موجود
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-bold">
                              مركز جديد
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>{entity.governorate} • {entity.directorate}</span>
                          <span>|</span>
                          <span>رئيس المركز: <strong className="text-slate-200">{entity.principalName}</strong></span>
                          <span>|</span>
                          <span>السعة: <strong className="text-cyan-400">{entity.studentCapacity} طالب</strong></span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded border whitespace-nowrap ${
                        entity.stage === 'SECONDARY'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : entity.stage === 'INTERMEDIATE'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : entity.stage === 'PRIMARY'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {entity.stageNameArabic}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {autoMapUsersOpt && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    سيتم توليد وربط حسابات المستخدمين لمدراء المراكز تلقائياً
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmSync}
                  disabled={selectedEntityIds.size === 0}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                >
                  تأكيد مزامنة ({selectedEntityIds.size}) مركزاً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add / Edit Center Modal */}
      {showCenterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingCenter ? 'تعديل بيانات المركز الامتحاني' : 'إضافة مركز امتحاني جديد للمنظومة'}
                </h3>
              </div>
              <button
                onClick={() => setShowCenterModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCenter} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">رمز المركز الامتحاني (Code):</label>
                  <input
                    type="text"
                    required
                    value={centerFormData.code || ''}
                    onChange={(e) => setCenterFormData({ ...centerFormData, code: e.target.value })}
                    placeholder="SCH-108"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">اسم المركز الامتحاني:</label>
                  <input
                    type="text"
                    required
                    value={centerFormData.name || ''}
                    onChange={(e) => setCenterFormData({ ...centerFormData, name: e.target.value })}
                    placeholder="ثانوية المتميزين النموذجية"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">المرحلة الدراسية:</label>
                  <select
                    value={centerFormData.educationStage}
                    onChange={(e) => {
                      const stage = e.target.value as EducationStage;
                      const stageNameArabic =
                        stage === 'PRIMARY'
                          ? 'المرحلة الابتدائية'
                          : stage === 'INTERMEDIATE'
                          ? 'المرحلة المتوسطة'
                          : stage === 'ALL'
                          ? 'مركز شامل لكافة المراحل'
                          : 'المرحلة الإعدادية والثانوية';
                      setCenterFormData({ ...centerFormData, educationStage: stage, stageNameArabic });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SECONDARY">المرحلة الإعدادية (السادس الإعدادي)</option>
                    <option value="INTERMEDIATE">المرحلة المتوسطة (الثالث المتوسط)</option>
                    <option value="PRIMARY">المرحلة الابتدائية (السادس الابتدائي)</option>
                    <option value="ALL">مركز شامل لكافة المراحل</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">المحافظة:</label>
                  <input
                    type="text"
                    required
                    value={centerFormData.governorate || ''}
                    onChange={(e) => setCenterFormData({ ...centerFormData, governorate: e.target.value })}
                    placeholder="بغداد"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">المديرية العامة للتربية:</label>
                  <input
                    type="text"
                    required
                    value={centerFormData.directorate || ''}
                    onChange={(e) => setCenterFormData({ ...centerFormData, directorate: e.target.value })}
                    placeholder="المديرية العامة لتربية بغداد / الكرخ الأولى"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">رئيس المركز الامتحاني:</label>
                  <input
                    type="text"
                    required
                    value={centerFormData.chiefProctorName || ''}
                    onChange={(e) => setCenterFormData({ ...centerFormData, chiefProctorName: e.target.value })}
                    placeholder="أ. د. عبد الله كاظم"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={centerFormData.chiefProctorPhone || ''}
                    onChange={(e) => setCenterFormData({ ...centerFormData, chiefProctorPhone: e.target.value })}
                    placeholder="07701234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">سعة الطلاب المخصصة:</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={centerFormData.registeredStudentsCount || 60}
                    onChange={(e) =>
                      setCenterFormData({
                        ...centerFormData,
                        registeredStudentsCount: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">طراز الطابعة المؤمنة:</label>
                  <input
                    type="text"
                    value={centerFormData.printerModel || ''}
                    onChange={(e) => setCenterFormData({ ...centerFormData, printerModel: e.target.value })}
                    placeholder="HP LaserJet Enterprise Secure Spooler"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">عنوان IP لطابعة المركز (شبكة VLAN):</label>
                  <input
                    type="text"
                    value={centerFormData.printerIp || ''}
                    onChange={(e) => setCenterFormData({ ...centerFormData, printerIp: e.target.value })}
                    placeholder="192.168.10.42 (VLAN-EXAM-SECURE)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/80 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCenterModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-900/30 cursor-pointer"
                >
                  {editingCenter ? 'حفظ التعديلات' : 'إضافة المركز'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
