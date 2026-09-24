import React, { useState } from 'react';
import {
  Sliders,
  Settings2,
  FileText,
  Palette,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Database,
  Printer,
  Shield,
  HelpCircle,
  Eye,
  Edit3,
  Copy,
  Tag,
  Check,
  X,
  FileCode,
  LayoutTemplate,
  Monitor,
  Bell,
  Lock,
  Compass,
  ListPlus,
  MoveVertical,
  CheckSquare,
} from 'lucide-react';
import {
  SystemConfig,
  CustomFieldDefinition,
  AppUser,
  EducationStage,
} from '../types';
import { soundManager } from '../utils/security';
import { INITIAL_SYSTEM_CONFIG } from '../data/mockData';

interface AdminSystemSettingsProps {
  currentUser: AppUser;
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (newConfig: SystemConfig) => void;
  onLogAuditEvent: (desc: string, severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER') => void;
  onNavigateToExams?: () => void;
}

export const AdminSystemSettings: React.FC<AdminSystemSettingsProps> = ({
  currentUser,
  systemConfig,
  onUpdateSystemConfig,
  onLogAuditEvent,
  onNavigateToExams,
}) => {
  // Working copy of config
  const [config, setConfig] = useState<SystemConfig>(systemConfig);
  const [activeTab, setActiveTab] = useState<
    'custom_fields' | 'exam_form' | 'look_and_feel' | 'lists_options' | 'raw_json'
  >('custom_fields');

  // Success banner feedback
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Field Filter by Entity
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<
    'ALL' | CustomFieldDefinition['targetEntity']
  >('ALL');

  // Modal for Adding / Editing Custom Field
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldFormData, setFieldFormData] = useState<Partial<CustomFieldDefinition>>({
    targetEntity: 'EXAM',
    key: '',
    label: '',
    type: 'TEXT',
    options: [],
    defaultValue: '',
    required: false,
    placeholder: '',
    description: '',
    section: 'بيانات مخصصة إضافية',
    showInPrintSheet: false,
  });
  const [optionsInputRaw, setOptionsInputRaw] = useState<string>('');

  // Lists & Options tab input buffers
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [newGradeInput, setNewGradeInput] = useState('');
  const [newRoundInput, setNewRoundInput] = useState('');
  const [newGovernorateInput, setNewGovernorateInput] = useState('');
  const [newPrinterInput, setNewPrinterInput] = useState('');

  // JSON Raw view state
  const [rawJsonText, setRawJsonText] = useState(JSON.stringify(config, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Save changes handler
  const handleSaveAllChanges = (overrideConfig?: SystemConfig) => {
    const target = overrideConfig || config;
    const updated: SystemConfig = {
      ...target,
      lastModifiedBy: currentUser.name,
      lastModifiedAt: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setConfig(updated);
    setRawJsonText(JSON.stringify(updated, null, 2));
    onUpdateSystemConfig(updated);
    soundManager.playSuccess();
    onLogAuditEvent(
      `قام المسؤول [${currentUser.name}] بتحديث وضبط مفاصل النظام، الحقول المخصصة، وفورمة الامتحان`,
      'SUCCESS'
    );
    setSaveSuccessMsg('تم حفظ وتطبيق كافة التعديلات على مستوى المنظومة بنجاح!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Reset to Factory Defaults
  const handleResetToDefaults = () => {
    if (
      !window.confirm(
        'تحذير أمني: هل تريد استرجاع كافة الإعدادات والخيارات الافتراضية لمنظومة وزارة التربية؟ ستفقد أي تعديلات غير محفوظة.'
      )
    ) {
      return;
    }
    soundManager.playAlert();
    setConfig(INITIAL_SYSTEM_CONFIG);
    setRawJsonText(JSON.stringify(INITIAL_SYSTEM_CONFIG, null, 2));
    onUpdateSystemConfig(INITIAL_SYSTEM_CONFIG);
    onLogAuditEvent('تمت استعادة الإعدادات المصنعية لمنظومة الامتحانات', 'WARNING');
    setSaveSuccessMsg('تمت استعادة الإعدادات الأصلية الافتراضية بنجاح.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Open Create Custom Field
  const handleOpenAddField = (presetTarget?: CustomFieldDefinition['targetEntity']) => {
    setEditingFieldId(null);
    setFieldFormData({
      id: `CF-${Date.now().toString().slice(-6)}`,
      targetEntity: presetTarget || (selectedEntityFilter === 'ALL' ? 'EXAM' : selectedEntityFilter),
      key: '',
      label: '',
      type: 'TEXT',
      options: [],
      defaultValue: '',
      required: false,
      placeholder: '',
      description: '',
      section: 'بيانات مخصصة إضافية',
      showInPrintSheet: false,
    });
    setOptionsInputRaw('');
    setShowFieldModal(true);
    soundManager.playBeep();
  };

  // Open Edit Custom Field
  const handleOpenEditField = (field: CustomFieldDefinition) => {
    setEditingFieldId(field.id);
    setFieldFormData({ ...field });
    setOptionsInputRaw(field.options ? field.options.join('\n') : '');
    setShowFieldModal(true);
    soundManager.playBeep();
  };

  // Save Custom Field
  const handleSaveFieldForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldFormData.key?.trim() || !fieldFormData.label?.trim()) {
      alert('يرجى كتابة المفتاح التعريفي (Key) واسم الحقل (Label).');
      return;
    }

    // Clean Key (lowercase/camelCase identifier)
    const cleanedKey = fieldFormData.key
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/^\d+/, '');

    const parsedOptions =
      fieldFormData.type === 'SELECT'
        ? optionsInputRaw
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: CustomFieldDefinition = {
      id: editingFieldId || `CF-${Date.now().toString().slice(-6)}`,
      targetEntity: fieldFormData.targetEntity || 'EXAM',
      key: cleanedKey || `field_${Date.now().toString().slice(-4)}`,
      label: fieldFormData.label.trim(),
      type: fieldFormData.type || 'TEXT',
      options: parsedOptions,
      defaultValue: fieldFormData.defaultValue,
      required: !!fieldFormData.required,
      placeholder: fieldFormData.placeholder?.trim(),
      description: fieldFormData.description?.trim(),
      section: fieldFormData.section?.trim() || 'بيانات مخصصة إضافية',
      showInPrintSheet: !!fieldFormData.showInPrintSheet,
    };

    let updatedList: CustomFieldDefinition[];
    if (editingFieldId) {
      updatedList = config.customFields.map((f) => (f.id === editingFieldId ? newField : f));
    } else {
      updatedList = [...config.customFields, newField];
    }

    const updatedConfig: SystemConfig = {
      ...config,
      customFields: updatedList,
    };

    setConfig(updatedConfig);
    setShowFieldModal(false);
    handleSaveAllChanges(updatedConfig);
  };

  // Delete Custom Field
  const handleDeleteField = (fieldId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحقل من المنظومة نهائياً؟')) return;
    soundManager.playAlert();
    const updatedList = config.customFields.filter((f) => f.id !== fieldId);
    const updatedConfig: SystemConfig = {
      ...config,
      customFields: updatedList,
    };
    setConfig(updatedConfig);
    handleSaveAllChanges(updatedConfig);
  };

  // Filtered custom fields
  const filteredFields = config.customFields.filter(
    (f) => selectedEntityFilter === 'ALL' || f.targetEntity === selectedEntityFilter
  );

  // Quick Add Item Helper for lists
  const handleAddListItem = (
    listType: 'subjects' | 'grades' | 'rounds' | 'govs' | 'printers'
  ) => {
    soundManager.playBeep();
    if (listType === 'subjects' && newSubjectInput.trim()) {
      if (!config.examFormTemplate.availableSubjects.includes(newSubjectInput.trim())) {
        const updated = {
          ...config,
          examFormTemplate: {
            ...config.examFormTemplate,
            availableSubjects: [...config.examFormTemplate.availableSubjects, newSubjectInput.trim()],
          },
        };
        setConfig(updated);
        setNewSubjectInput('');
        handleSaveAllChanges(updated);
      }
    } else if (listType === 'grades' && newGradeInput.trim()) {
      if (!config.examFormTemplate.availableGrades.includes(newGradeInput.trim())) {
        const updated = {
          ...config,
          examFormTemplate: {
            ...config.examFormTemplate,
            availableGrades: [...config.examFormTemplate.availableGrades, newGradeInput.trim()],
          },
        };
        setConfig(updated);
        setNewGradeInput('');
        handleSaveAllChanges(updated);
      }
    } else if (listType === 'rounds' && newRoundInput.trim()) {
      if (!config.examFormTemplate.availableRounds.includes(newRoundInput.trim())) {
        const updated = {
          ...config,
          examFormTemplate: {
            ...config.examFormTemplate,
            availableRounds: [...config.examFormTemplate.availableRounds, newRoundInput.trim()],
          },
        };
        setConfig(updated);
        setNewRoundInput('');
        handleSaveAllChanges(updated);
      }
    } else if (listType === 'govs' && newGovernorateInput.trim()) {
      if (!config.governoratesList.includes(newGovernorateInput.trim())) {
        const updated = {
          ...config,
          governoratesList: [...config.governoratesList, newGovernorateInput.trim()],
        };
        setConfig(updated);
        setNewGovernorateInput('');
        handleSaveAllChanges(updated);
      }
    } else if (listType === 'printers' && newPrinterInput.trim()) {
      if (!config.printerModelsList.includes(newPrinterInput.trim())) {
        const updated = {
          ...config,
          printerModelsList: [...config.printerModelsList, newPrinterInput.trim()],
        };
        setConfig(updated);
        setNewPrinterInput('');
        handleSaveAllChanges(updated);
      }
    }
  };

  // Remove Item Helper for lists
  const handleRemoveListItem = (
    listType: 'subjects' | 'grades' | 'rounds' | 'govs' | 'printers',
    itemValue: string
  ) => {
    soundManager.playAlert();
    let updated = { ...config };
    if (listType === 'subjects') {
      updated.examFormTemplate.availableSubjects = updated.examFormTemplate.availableSubjects.filter(
        (s) => s !== itemValue
      );
    } else if (listType === 'grades') {
      updated.examFormTemplate.availableGrades = updated.examFormTemplate.availableGrades.filter(
        (g) => g !== itemValue
      );
    } else if (listType === 'rounds') {
      updated.examFormTemplate.availableRounds = updated.examFormTemplate.availableRounds.filter(
        (r) => r !== itemValue
      );
    } else if (listType === 'govs') {
      updated.governoratesList = updated.governoratesList.filter((g) => g !== itemValue);
    } else if (listType === 'printers') {
      updated.printerModelsList = updated.printerModelsList.filter((p) => p !== itemValue);
    }
    setConfig(updated);
    handleSaveAllChanges(updated);
  };

  // JSON Raw Apply
  const handleApplyRawJson = () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      setConfig(parsed);
      setJsonError(null);
      handleSaveAllChanges(parsed);
    } catch (err) {
      soundManager.playAlert();
      setJsonError(err instanceof Error ? err.message : 'بنية JSON غير صحيحة');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 border border-indigo-500/40 rounded-2xl text-indigo-400 shadow-inner">
              <Sliders className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-wide">
                  مركز تحكم المسؤول: تخصيص وتعديل مفاصل النظام بالكامل
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Full System Architect
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                صلاحية إدارية مطلقة لإضافة وحذف وتعديل الحقول، قوالب فورمة الأسئلة، مظهر وهوية المنظومة، والقوائم المنسدلة في كافة الواجهات
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {onNavigateToExams && (
              <button
                onClick={onNavigateToExams}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold border border-cyan-500/30 transition-all cursor-pointer"
                title="الانتقال إلى محرر ومولد الامتحانات لتجربة الحقول والقوالب"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>معاينة بنك الأسئلة</span>
              </button>
            )}

            <button
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
              title="استرجاع القيم الافتراضية للمنظومة"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>استعادة الافتراضي</span>
            </button>

            <button
              id="btn-save-master-system-config"
              onClick={() => handleSaveAllChanges()}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-950/50 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق كافة التعديلات</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-2 text-emerald-300 text-xs font-bold animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block">إجمالي الحقول المخصصة النشطة</span>
            <span className="text-base font-black text-indigo-300 mt-0.5 block">
              {config.customFields.length} حقل مدعوم
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block">قوالب المواد الدراسية</span>
            <span className="text-base font-black text-cyan-300 mt-0.5 block">
              {config.examFormTemplate.availableSubjects.length} مادة معتمدة
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block">المحافظات والمديريات المسجلة</span>
            <span className="text-base font-black text-emerald-300 mt-0.5 block">
              {config.governoratesList.length} محافظة / إقليم
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block">آخر تعديل وتطبيق</span>
            <span className="text-xs font-bold text-slate-300 mt-1 block font-mono">
              {config.lastModifiedAt || 'منذ الإقلاع'} • {config.lastModifiedBy || 'النظام'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('custom_fields')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'custom_fields'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-300" />
          <span>إدارة وإضافة وتعديل الحقول (Custom Fields)</span>
          <span className="px-1.5 py-0.2 bg-indigo-500/30 rounded-full text-[10px] font-mono">
            {config.customFields.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('exam_form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'exam_form'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <LayoutTemplate className="w-4 h-4 text-cyan-300" />
          <span>تخصيص فورمة الأسئلة والترويسة الوزارية</span>
        </button>

        <button
          onClick={() => setActiveTab('look_and_feel')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'look_and_feel'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Palette className="w-4 h-4 text-purple-300" />
          <span>هيئة النظام، المظهر، والنصوص الرسمية</span>
        </button>

        <button
          onClick={() => setActiveTab('lists_options')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'lists_options'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ListPlus className="w-4 h-4 text-emerald-300" />
          <span>القوائم والخيارات (المواد، المحافظات، الطابعات)</span>
        </button>

        <button
          onClick={() => setActiveTab('raw_json')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'raw_json'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4 text-amber-400" />
          <span>المحرر المباشر (Raw JSON Config)</span>
        </button>
      </div>

      {/* Tab 1: Custom Fields Manager */}
      {activeTab === 'custom_fields' && (
        <div className="space-y-5">
          {/* Sub Toolbar & Filter */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold ml-1">تصفية حسب مَفصل النظام:</span>
              <button
                onClick={() => setSelectedEntityFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedEntityFilter === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                الكل ({config.customFields.length})
              </button>
              <button
                onClick={() => setSelectedEntityFilter('EXAM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedEntityFilter === 'EXAM'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                الامتحان والنموذج ({config.customFields.filter((f) => f.targetEntity === 'EXAM').length})
              </button>
              <button
                onClick={() => setSelectedEntityFilter('QUESTION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedEntityFilter === 'QUESTION'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                الأسئلة والبنود ({config.customFields.filter((f) => f.targetEntity === 'QUESTION').length})
              </button>
              <button
                onClick={() => setSelectedEntityFilter('CENTER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedEntityFilter === 'CENTER'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                المراكز الامتحانية ({config.customFields.filter((f) => f.targetEntity === 'CENTER').length})
              </button>
              <button
                onClick={() => setSelectedEntityFilter('USER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedEntityFilter === 'USER'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                المستخدمون والرؤساء ({config.customFields.filter((f) => f.targetEntity === 'USER').length})
              </button>
            </div>

            <button
              id="btn-add-new-custom-field"
              onClick={() => handleOpenAddField()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 cursor-pointer w-full md:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حقل جديد للنظام</span>
            </button>
          </div>

          {/* Fields Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFields.length === 0 ? (
              <div className="col-span-full bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
                <Database className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-bold">لا توجد حقول مخصصة في هذا القسم</p>
                <p className="text-slate-500 text-xs mt-1">
                  اضغط على "إضافة حقل جديد للنظام" لإنشاء حقل ديناميكي يظهر فوراً في الواجهات.
                </p>
              </div>
            ) : (
              filteredFields.map((field) => (
                <div
                  key={field.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                          field.targetEntity === 'EXAM'
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                            : field.targetEntity === 'QUESTION'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : field.targetEntity === 'CENTER'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}
                      >
                        {field.targetEntity === 'EXAM'
                          ? 'استمارة الامتحان'
                          : field.targetEntity === 'QUESTION'
                          ? 'بند وسؤال'
                          : field.targetEntity === 'CENTER'
                          ? 'مركز امتحاني'
                          : 'ملف المستخدم'}
                      </span>

                      <div className="flex items-center gap-1">
                        {field.required && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded font-bold">
                            إلزامي
                          </span>
                        )}
                        {field.showInPrintSheet && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded font-bold flex items-center gap-1">
                            <Printer className="w-2.5 h-2.5" />
                            في الطباعة
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white">{field.label}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                        <span className="text-slate-500">Key:</span>
                        <span className="text-indigo-300">{field.key}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-400 text-[11px]">[{field.type}]</span>
                      </div>
                    </div>

                    {field.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">{field.description}</p>
                    )}

                    {field.type === 'SELECT' && field.options && (
                      <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800 text-[11px] space-y-1">
                        <span className="text-slate-500 block font-bold">الخيارات المتاحة ({field.options.length}):</span>
                        <div className="flex flex-wrap gap-1">
                          {field.options.slice(0, 4).map((opt, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 text-[10px]"
                            >
                              {opt}
                            </span>
                          ))}
                          {field.options.length > 4 && (
                            <span className="text-[10px] text-slate-500 self-center">
                              +{field.options.length - 4} آخرين
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">القسم: {field.section || 'عام'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditField(field)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition-all cursor-pointer"
                        title="حذف الحقل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Exam Form Template Editor */}
      {activeTab === 'exam_form' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  تعديل وتخصيص فورمة ورقة الامتحان والترويسة الوزارية
                </h3>
                <p className="text-xs text-slate-400">
                  التحكم بالترويسة المطبوعة رسمياً، الشروط، صيغ التنبيهات، وعناصر ورقة الامتحان المعتمدة
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSaveAllChanges()}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              حفظ الإعدادات
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الترويسة 1 (الجمهورية والوزارة):</label>
              <input
                type="text"
                value={config.examFormTemplate.defaultHeaderRepublic}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    examFormTemplate: {
                      ...config.examFormTemplate,
                      defaultHeaderRepublic: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الترويسة 2 (المديرية العامة):</label>
              <input
                type="text"
                value={config.examFormTemplate.defaultHeaderMinistry}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    examFormTemplate: {
                      ...config.examFormTemplate,
                      defaultHeaderMinistry: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الترويسة 3 (اللجنة الامتحانية):</label>
              <input
                type="text"
                value={config.examFormTemplate.defaultHeaderDirectorate}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    examFormTemplate: {
                      ...config.examFormTemplate,
                      defaultHeaderDirectorate: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">ملاحظة القواعد والإجابة أعلى الورقة (Rules Note):</label>
            <textarea
              rows={2}
              value={config.examFormTemplate.defaultRulesNote}
              onChange={(e) =>
                setConfig({
                  ...config,
                  examFormTemplate: {
                    ...config.examFormTemplate,
                    defaultRulesNote: e.target.value,
                  },
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">تنبيه العقوبات والتحذير الأمني أسفل الورقة (Footer Legal Notice):</label>
            <textarea
              rows={2}
              value={config.examFormTemplate.defaultFooterNotice}
              onChange={(e) =>
                setConfig({
                  ...config,
                  examFormTemplate: {
                    ...config.examFormTemplate,
                    defaultFooterNotice: e.target.value,
                  },
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {/* Form Structure Toggle switches */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-slate-300">خصائص ومكونات فورمة الأسئلة التفاعلية:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={config.examFormTemplate.enableSubQuestions}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      examFormTemplate: {
                        ...config.examFormTemplate,
                        enableSubQuestions: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">الفروع والأسئلة الفرعية (أ، ب، جـ)</span>
                  <span className="text-[10px] text-slate-500">تمكين تقسيم السؤال لعدة أفرع اختيارية</span>
                </div>
              </label>

              <label className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={config.examFormTemplate.enableMultipleChoiceChoices}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      examFormTemplate: {
                        ...config.examFormTemplate,
                        enableMultipleChoiceChoices: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">خيارات الاختيار من متعدد (MCQ)</span>
                  <span className="text-[10px] text-slate-500">عرض حقول البدائل والخيارات للأسئلة</span>
                </div>
              </label>

              <label className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={config.examFormTemplate.enableSectionInstructions}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      examFormTemplate: {
                        ...config.examFormTemplate,
                        enableSectionInstructions: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">تعليمات كل سؤال/قسم</span>
                  <span className="text-[10px] text-slate-500">مثل: "أجب عن فرعين فقط (لكل فرع 10 درجات)"</span>
                </div>
              </label>

              <label className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={config.examFormTemplate.requireCommitteeSeal}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      examFormTemplate: {
                        ...config.examFormTemplate,
                        requireCommitteeSeal: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">ختم اللجنة الوزارية في الطباعة</span>
                  <span className="text-[10px] text-slate-500">طباعة ختم التوثيق الرسمي في أسفل الورقة</span>
                </div>
              </label>

              <label className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={config.examFormTemplate.requireDirectorSignature}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      examFormTemplate: {
                        ...config.examFormTemplate,
                        requireDirectorSignature: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">توقيع ومصادقة مدير المركز</span>
                  <span className="text-[10px] text-slate-500">حقل توقيع مدير المركز والمشرف الميداني</span>
                </div>
              </label>

              <label className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={config.examFormTemplate.allowTeacherCustomInstructions}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      examFormTemplate: {
                        ...config.examFormTemplate,
                        allowTeacherCustomInstructions: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">تعليمات خاصة إضافية لواضعي الأسئلة</span>
                  <span className="text-[10px] text-slate-500">السماح بإضافة قائمة تعليمات حرة</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Look, Feel & Branding */}
      {activeTab === 'look_and_feel' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تخصيص هوية المنظومة ومظهرها والنصوص العامة</h3>
                <p className="text-xs text-slate-400">
                  تعديل أسماء الجهات، شريط الإعلانات العام، والعلامات المائية المنعكسة على واجهات النظام
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSaveAllChanges()}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              حفظ التعديلات
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">اسم المنظومة الرئيسي (App Name):</label>
              <input
                type="text"
                value={config.theme.appName}
                onChange={(e) =>
                  setConfig({ ...config, theme: { ...config.theme, appName: e.target.value } })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الوصف والشعار الفرعي (Subtitle):</label>
              <input
                type="text"
                value={config.theme.appSubtitle}
                onChange={(e) =>
                  setConfig({ ...config, theme: { ...config.theme, appSubtitle: e.target.value } })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الوزارة والجهة العليا:</label>
              <input
                type="text"
                value={config.theme.ministryName}
                onChange={(e) =>
                  setConfig({ ...config, theme: { ...config.theme, ministryName: e.target.value } })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">القسم أو الدائرة المسؤولة:</label>
              <input
                type="text"
                value={config.theme.departmentName}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    theme: { ...config.theme, departmentName: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">نص العلامة المائية المشفرة بالخلفية (Security Watermark):</label>
            <input
              type="text"
              value={config.theme.watermarkText}
              onChange={(e) =>
                setConfig({ ...config, theme: { ...config.theme, watermarkText: e.target.value } })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* System Security Notice Banner Control */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.theme.systemNoticeActive}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      theme: { ...config.theme, systemNoticeActive: e.target.checked },
                    })
                  }
                  className="rounded text-purple-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>تفعيل شريط التنبيه الأمني العام (System Alert Notice)</span>
              </label>

              <span className="text-[10px] text-slate-500 font-mono">
                يظهر أعلى لوحة الوزارة والمراكز
              </span>
            </div>

            <input
              type="text"
              value={config.theme.systemNotice}
              onChange={(e) =>
                setConfig({ ...config, theme: { ...config.theme, systemNotice: e.target.value } })
              }
              disabled={!config.theme.systemNoticeActive}
              placeholder="نص التنبيه الأمني..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
          </div>

          {/* General Security & Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.theme.enableSoundEffects}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    theme: { ...config.theme, enableSoundEffects: e.target.checked },
                  })
                }
                className="rounded text-purple-500 focus:ring-0 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-300">المؤثرات الصوتية للأمان والطباعة</span>
            </label>

            <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.theme.allowEmergencyCodes}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    theme: { ...config.theme, allowEmergencyCodes: e.target.checked },
                  })
                }
                className="rounded text-purple-500 focus:ring-0 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-300">السماح بأكواد الطوارئ الميدانية</span>
            </label>

            <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.theme.enableDetailedForensics}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    theme: { ...config.theme, enableDetailedForensics: e.target.checked },
                  })
                }
                className="rounded text-purple-500 focus:ring-0 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-300">الفحص الجنائي المتقدم للأوراق</span>
            </label>
          </div>
        </div>
      )}

      {/* Tab 4: Dropdowns and Options Management */}
      {activeTab === 'lists_options' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subjects List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-black text-white">
                    قائمة المواد الدراسية ({config.examFormTemplate.availableSubjects.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500">تظهر في استمارة الأسئلة</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="أدخل اسم مادة جديدة..."
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddListItem('subjects')}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleAddListItem('subjects')}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-1">
                {config.examFormTemplate.availableSubjects.map((sub, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  >
                    <span>{sub}</span>
                    <button
                      onClick={() => handleRemoveListItem('subjects', sub)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Grades List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-black text-white">
                    المراحل والصفوف الدراسية ({config.examFormTemplate.availableGrades.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500">تظهر في استمارة الأسئلة والمراكز</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="أدخل مرحلة أو صف دراسي..."
                  value={newGradeInput}
                  onChange={(e) => setNewGradeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddListItem('grades')}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => handleAddListItem('grades')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-1">
                {config.examFormTemplate.availableGrades.map((grade, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  >
                    <span>{grade}</span>
                    <button
                      onClick={() => handleRemoveListItem('grades', grade)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Governorates List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black text-white">
                    المحافظات والمديريات العامة ({config.governoratesList.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500">تظهر في المراكز والمشرفين</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="أدخل محافظة أو مديرية جديدة..."
                  value={newGovernorateInput}
                  onChange={(e) => setNewGovernorateInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddListItem('govs')}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleAddListItem('govs')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-1">
                {config.governoratesList.map((gov, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  >
                    <span>{gov}</span>
                    <button
                      onClick={() => handleRemoveListItem('govs', gov)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Approved Secure Printers */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-white">
                    طرازات الطابعات المعتمدة ({config.printerModelsList.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500">تظهر في المراكز الامتحانية</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="طراز طابعة ليزرية جديدة..."
                  value={newPrinterInput}
                  onChange={(e) => setNewPrinterInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddListItem('printers')}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => handleAddListItem('printers')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto p-1">
                {config.printerModelsList.map((printer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  >
                    <span className="font-mono text-[11px] truncate">{printer}</span>
                    <button
                      onClick={() => handleRemoveListItem('printers', printer)}
                      className="text-slate-500 hover:text-rose-400 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Raw JSON Editor */}
      {activeTab === 'raw_json' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>محرر البنية التحتية المباشر (Raw System JSON Tree)</span>
              </h3>
              <p className="text-xs text-slate-400">
                يمكن للمطورين والمسؤولين التقنيين استيراد وتصدير وتعديل كامل مفاصل النظام ككود JSON موحد
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rawJsonText);
                  soundManager.playSuccess();
                  alert('تم نسخ كود إعدادات النظام بالكامل للحافظة.');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>نسخ الكود</span>
              </button>

              <button
                onClick={handleApplyRawJson}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>تطبيق وتحقق من الـ JSON</span>
              </button>
            </div>
          </div>

          {jsonError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>خطأ في بنية JSON: {jsonError}</span>
            </div>
          )}

          <textarea
            rows={18}
            value={rawJsonText}
            onChange={(e) => setRawJsonText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-amber-500 leading-relaxed text-left dir-ltr"
            dir="ltr"
          />
        </div>
      )}

      {/* Modal: Add / Edit Custom Field */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingFieldId ? 'تعديل حقل في المنظومة' : 'إضافة حقل جديد لكافة مفاصل النظام'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    الحقل يندمج تلقائياً في الاستمارات، نماذج التحرير، وقواعد البيانات
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFieldModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFieldForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">المفصل المستهدف (Target Entity):</label>
                  <select
                    value={fieldFormData.targetEntity}
                    onChange={(e) =>
                      setFieldFormData({
                        ...fieldFormData,
                        targetEntity: e.target.value as CustomFieldDefinition['targetEntity'],
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EXAM">استمارة الامتحان (Exam Package)</option>
                    <option value="QUESTION">بند أو سؤال فردي (Question Item)</option>
                    <option value="CENTER">المراكز الامتحانية (School Center)</option>
                    <option value="USER">حساب المستخدم / الرئيس (App User)</option>
                    <option value="STUDENT">بطاقة الطالب المموهة (Student Ticket)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">نوع البيانات (Field Type):</label>
                  <select
                    value={fieldFormData.type}
                    onChange={(e) =>
                      setFieldFormData({
                        ...fieldFormData,
                        type: e.target.value as CustomFieldDefinition['type'],
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="TEXT">نصي قصير (Single-line Text)</option>
                    <option value="TEXTAREA">نصي متعدد الأسطر (Textarea)</option>
                    <option value="NUMBER">رقمي (Number / Score / Count)</option>
                    <option value="SELECT">قائمة منسدلة (Dropdown Select)</option>
                    <option value="BOOLEAN">اختيار منطقي (نعم / لا Checkbox)</option>
                    <option value="DATE">تاريخ (Date Picker)</option>
                    <option value="TIME">توقيت (Time Picker)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">اسم الحقل بالعربية (Label):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: التصنيف المعياري للصعوبة"
                    value={fieldFormData.label || ''}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, label: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">المفتاح البرمجي الفريد (Unique Key):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: difficultyStandard"
                    value={fieldFormData.key || ''}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, key: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 text-left dir-ltr"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Options for SELECT */}
              {fieldFormData.type === 'SELECT' && (
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="font-bold text-slate-300 flex items-center justify-between">
                    <span>الخيارات المتاحة للقائمة (سطر لكل خيار):</span>
                    <span className="text-[10px] text-cyan-400 font-mono">One option per line</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={`خيار 1\nخيار 2\nخيار 3`}
                    value={optionsInputRaw}
                    onChange={(e) => setOptionsInputRaw(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">نص التلميح (Placeholder):</label>
                  <input
                    type="text"
                    placeholder="تلميح توضيحي داخل الحقل..."
                    value={fieldFormData.placeholder || ''}
                    onChange={(e) =>
                      setFieldFormData({ ...fieldFormData, placeholder: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">عنوان قسم التبويب (Section):</label>
                  <input
                    type="text"
                    placeholder="مثال: البيانات الفنية والتربوية"
                    value={fieldFormData.section || ''}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, section: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">شرح أو وصف توضيحي للحقل (Description):</label>
                <input
                  type="text"
                  placeholder="وصف مختصر لمساعدة مدخل البيانات..."
                  value={fieldFormData.description || ''}
                  onChange={(e) =>
                    setFieldFormData({ ...fieldFormData, description: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!fieldFormData.required}
                    onChange={(e) =>
                      setFieldFormData({ ...fieldFormData, required: e.target.checked })
                    }
                    className="rounded text-indigo-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">حقل إلزامي (Required)</span>
                    <span className="text-[10px] text-slate-500">لا يمكن الحفظ بدونه</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!fieldFormData.showInPrintSheet}
                    onChange={(e) =>
                      setFieldFormData({ ...fieldFormData, showInPrintSheet: e.target.checked })
                    }
                    className="rounded text-blue-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">إدراج في الورقة المطبوعة</span>
                    <span className="text-[10px] text-slate-500">يظهر في ترويسة أو ذيل الامتحان</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-black shadow-lg shadow-indigo-900/40 transition-all cursor-pointer"
                >
                  {editingFieldId ? 'حفظ التعديلات' : 'إضافة الحقل فوراً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
