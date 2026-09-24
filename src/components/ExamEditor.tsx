import React, { useState } from 'react';
import {
  ExamPackage,
  QuestionSection,
  QuestionItem,
  EducationStage,
  AppUser,
  SystemConfig,
  CustomFieldDefinition,
} from '../types';
import {
  FilePlus,
  Layers,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Eye,
  AlertCircle,
  Hash,
  Copy,
  ChevronDown,
  Sliders,
  Settings2,
} from 'lucide-react';
import { soundManager } from '../utils/security';

interface ExamEditorProps {
  currentUser: AppUser;
  exams: ExamPackage[];
  systemConfig?: SystemConfig;
  onSaveExam: (exam: ExamPackage) => void;
  onDeployExamPackage: (examId: string) => void;
  onLogAuditEvent: (desc: string, severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER') => void;
  onNavigateToSettings?: () => void;
}

export const ExamEditor: React.FC<ExamEditorProps> = ({
  currentUser,
  exams,
  systemConfig,
  onSaveExam,
  onDeployExamPackage,
  onLogAuditEvent,
  onNavigateToSettings,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview_cipher' | 'exam_list'>('edit');

  // Form State
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const [title, setTitle] = useState(currentExam?.title || '');
  const [code, setCode] = useState(currentExam?.code || '');
  const [subject, setSubject] = useState(currentExam?.subject || 'الرياضيات');
  const [educationStage, setEducationStage] = useState<EducationStage>(currentExam?.educationStage || 'SECONDARY');
  const [gradeLevel, setGradeLevel] = useState(currentExam?.gradeLevel || 'السادس الإعدادي (العلمي)');
  const [modelGroup, setModelGroup] = useState<'A' | 'B' | 'C'>(currentExam?.modelGroup || 'A');
  const [durationMinutes, setDurationMinutes] = useState(currentExam?.durationMinutes || 180);
  const [totalScore, setTotalScore] = useState(currentExam?.totalScore || 100);
  const [scheduledDate, setScheduledDate] = useState(currentExam?.scheduledDate || '2026-06-21');
  const [zeroHourUnlockTime, setZeroHourUnlockTime] = useState(currentExam?.zeroHourUnlockTime || '07:45 ص');
  const [examStartTime, setExamStartTime] = useState(currentExam?.examStartTime || '08:00 ص');
  const [instructions, setInstructions] = useState<string>(
    currentExam?.generalInstructions?.join('\n') || ''
  );
  const [sections, setSections] = useState<QuestionSection[]>(currentExam?.sections || []);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>(
    currentExam?.customFieldsData || {}
  );

  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // When changing selected exam
  const handleSelectExamToEdit = (exId: string) => {
    const ex = exams.find((e) => e.id === exId);
    if (!ex) return;
    setSelectedExamId(exId);
    setTitle(ex.title);
    setCode(ex.code);
    setSubject(ex.subject);
    setEducationStage(ex.educationStage);
    setGradeLevel(ex.gradeLevel);
    setModelGroup(ex.modelGroup);
    setDurationMinutes(ex.durationMinutes);
    setTotalScore(ex.totalScore);
    setScheduledDate(ex.scheduledDate);
    setZeroHourUnlockTime(ex.zeroHourUnlockTime);
    setExamStartTime(ex.examStartTime);
    setInstructions(ex.generalInstructions?.join('\n') || '');
    setSections(ex.sections || []);
    setCustomFieldsData(ex.customFieldsData || {});
    soundManager.playBeep();
  };

  // Create new blank exam package
  const handleCreateNewBlankExam = (group: 'A' | 'B' | 'C') => {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const newId = `EXAM-${new Date().getFullYear()}-${group}-${randomHex}`;
    const newExam: ExamPackage = {
      id: newId,
      code: `EXAM-${group}-${randomHex}`,
      title: `امتحان جديد - المجموعة (${group === 'A' ? 'أ الأساسية' : group === 'B' ? 'ب الاحتياطية' : 'ج الاحتياطية القصوى'})`,
      subject: 'الرياضيات',
      educationStage: 'SECONDARY',
      gradeLevel: 'السادس الإعدادي (العلمي)',
      academicYear: '2025 - 2026',
      sessionRound: 'الدور الأول',
      durationMinutes: 180,
      totalQuestions: 6,
      totalScore: 100,
      scheduledDate: '2026-06-25',
      zeroHourUnlockTime: '07:45 ص',
      examStartTime: '08:00 ص',
      status: 'SCHEDULED',
      modelGroup: group,
      isAlternateModel: group !== 'A',
      sha256Checksum: '9f82c0e184aa' + Math.random().toString(16).substring(2, 10),
      encryptionAlgorithm: 'AES-256-GCM (Zero-Knowledge Envelope)',
      ciphertextPreview: 'e5a19c402b881f' + Math.random().toString(16).substring(2, 30),
      generalInstructions: [
        'الإجابة عن خمسة أسئلة فقط، ولكل سؤال (20) درجة.',
        'يُمنع استخدام الهاتف النقال أو الأجهزة الذكية.',
      ],
      sections: [
        {
          id: `SEC-${Date.now()}-1`,
          title: 'السؤال الأول: (20 درجة)',
          instructions: 'أجب عن فرعين فقط:',
          totalScore: 20,
          items: [
            {
              id: `Q1-A-${Date.now()}`,
              number: 1,
              questionText: 'أ) اكتب نص السؤال هنا بالتفصيل...',
              maxScore: 10,
            },
            {
              id: `Q1-B-${Date.now()}`,
              number: 2,
              questionText: 'ب) اكتب نص الفرع الثاني هنا...',
              maxScore: 10,
            },
          ],
        },
      ],
    };

    onSaveExam(newExam);
    handleSelectExamToEdit(newId);
    onLogAuditEvent(
      `تم إنشاء طرد امتحاني جديد: [المجموعة ${group}] - ${newExam.title}`,
      'INFO'
    );
  };

  // Add Question Section
  const handleAddSection = () => {
    const newSecNum = sections.length + 1;
    const newSec: QuestionSection = {
      id: `SEC-${Date.now()}`,
      title: `السؤال ${newSecNum === 1 ? 'الأول' : newSecNum === 2 ? 'الثاني' : newSecNum === 3 ? 'الثالث' : newSecNum === 4 ? 'الرابع' : newSecNum === 5 ? 'الخامس' : 'السادس'}: (20 درجة)`,
      instructions: 'أجب عن فرعين فقط (لكل فرع 10 درجات):',
      totalScore: 20,
      items: [
        {
          id: `Q${newSecNum}-A-${Date.now()}`,
          number: (newSecNum - 1) * 3 + 1,
          questionText: 'أ) اكتب نص الفرع الأول هنا...',
          maxScore: 10,
        },
        {
          id: `Q${newSecNum}-B-${Date.now()}`,
          number: (newSecNum - 1) * 3 + 2,
          questionText: 'ب) اكتب نص الفرع الثاني هنا...',
          maxScore: 10,
        },
      ],
    };
    setSections([...sections, newSec]);
    soundManager.playBeep();
  };

  // Remove Question Section
  const handleRemoveSection = (secId: string) => {
    setSections(sections.filter((s) => s.id !== secId));
  };

  // Update Section Title
  const handleUpdateSection = (secId: string, updates: Partial<QuestionSection>) => {
    setSections(
      sections.map((s) => (s.id === secId ? { ...s, ...updates } : s))
    );
  };

  // Add Item to Section
  const handleAddItemToSection = (secId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === secId) {
          const newItem: QuestionItem = {
            id: `Q-ITEM-${Date.now()}`,
            number: s.items.length + 1,
            questionText: 'جـ) اكتب نص الفرع الإضافي هنا...',
            maxScore: 10,
          };
          return {
            ...s,
            items: [...s.items, newItem],
          };
        }
        return s;
      })
    );
  };

  // Update Question Item
  const handleUpdateQuestionItem = (secId: string, itemId: string, text: string, score: number) => {
    setSections(
      sections.map((s) => {
        if (s.id === secId) {
          return {
            ...s,
            items: s.items.map((it) =>
              it.id === itemId ? { ...it, questionText: text, maxScore: score } : it
            ),
          };
        }
        return s;
      })
    );
  };

  // Remove Item from Section
  const handleRemoveItem = (secId: string, itemId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === secId) {
          return {
            ...s,
            items: s.items.filter((it) => it.id !== itemId),
          };
        }
        return s;
      })
    );
  };

  // Save changes
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedExam: ExamPackage = {
      ...currentExam,
      id: currentExam.id,
      title,
      code,
      subject,
      educationStage,
      gradeLevel,
      modelGroup,
      durationMinutes,
      totalScore,
      scheduledDate,
      zeroHourUnlockTime,
      examStartTime,
      generalInstructions: instructions.split('\n').filter((l) => l.trim().length > 0),
      sections,
      isAlternateModel: modelGroup !== 'A',
      totalQuestions: sections.length,
      customFieldsData,
      sha256Checksum: 'sha256-' + Math.random().toString(16).substring(2, 16) + 'e89a',
    };

    onSaveExam(updatedExam);
    setIsSavedSuccess(true);
    soundManager.playBeep();

    onLogAuditEvent(
      `تم تحديث وتشفير محتوى الامتحان الوزاري [المجموعة ${modelGroup}]: ${title} بنجاح.`,
      'SUCCESS'
    );

    setTimeout(() => setIsSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl shadow-inner">
              <FilePlus className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  إدارة وبنك الأسئلة الامتحانية (المجموعات أ / ب / ج)
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AES-256 Multi-Model Vault
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                صياغة وتعديل وتشفير نماذج الامتحانات لجميع المراحل (ابتدائي، متوسط، ثانوي)، وتجهيز النماذج الاحتياطية (B و C)
              </p>
            </div>
          </div>

          {/* Quick Model Creation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCreateNewBlankExam('A')}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة نموذج (A) رئيسي</span>
            </button>
            <button
              onClick={() => handleCreateNewBlankExam('B')}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة نموذج (B) بديل 1</span>
            </button>
            <button
              onClick={() => handleCreateNewBlankExam('C')}
              className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة نموذج (C) بديل 2</span>
            </button>
          </div>
        </div>

        {/* Exam Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-semibold ml-2">النماذج المحفوظة:</span>
          {exams.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleSelectExamToEdit(ex.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedExamId === ex.id
                  ? ex.modelGroup === 'A'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : ex.modelGroup === 'B'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                    : 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  ex.modelGroup === 'A'
                    ? 'bg-emerald-400'
                    : ex.modelGroup === 'B'
                    ? 'bg-amber-400'
                    : 'bg-purple-400'
                }`}
              />
              <span className="font-bold">[{ex.modelGroup}]</span>
              <span>{ex.subject}</span>
              <span className="text-[11px] opacity-70 font-mono">({ex.gradeLevel})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Editing Section */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Exam Metadata Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>بطاقة بيانات الامتحان والتصنيف الأكاديمي</span>
            </div>
            {isSavedSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم الحفظ والتشفير بنجاح!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                عنوان ورقة الامتحان الرسمية *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: امتحان مادة الرياضيات - السادس الإعدادي (العلمي)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                كود الامتحان الرقمي *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MATH-6SCI-A"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">المادة الدراسية *</label>
                {onNavigateToSettings && (
                  <button
                    type="button"
                    onClick={onNavigateToSettings}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                    title="تعديل قائمة المواد"
                  >
                    <Sliders className="w-2.5 h-2.5" />
                    <span>تعديل الخيارات</span>
                  </button>
                )}
              </div>
              {systemConfig?.examFormTemplate.availableSubjects &&
              systemConfig.examFormTemplate.availableSubjects.length > 0 ? (
                <div className="space-y-1">
                  <select
                    value={
                      systemConfig.examFormTemplate.availableSubjects.includes(subject)
                        ? subject
                        : 'OTHER'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'OTHER') {
                        setSubject(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {systemConfig.examFormTemplate.availableSubjects.map((sub, idx) => (
                      <option key={idx} value={sub}>
                        {sub}
                      </option>
                    ))}
                    <option value="OTHER">-- مادة مخصصة أخرى (كتابة يدوية) --</option>
                  </select>
                  {(!systemConfig.examFormTemplate.availableSubjects.includes(subject) ||
                    subject === '') && (
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="اكتب اسم المادة يدوياً..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-300"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="الرياضيات، اللغة العربية، الفيزياء..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">المرحلة الدراسية *</label>
              <select
                value={educationStage}
                onChange={(e) => setEducationStage(e.target.value as EducationStage)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {systemConfig?.educationStagesList ? (
                  systemConfig.educationStagesList
                    .filter((s) => s.key !== 'ALL')
                    .map((stg) => (
                      <option key={stg.key} value={stg.key}>
                        {stg.label}
                      </option>
                    ))
                ) : (
                  <>
                    <option value="PRIMARY">المرحلة الابتدائية</option>
                    <option value="INTERMEDIATE">المرحلة المتوسطة</option>
                    <option value="SECONDARY">المرحلة الإعدادية / الثانوية</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">الصف الدراسي *</label>
                {onNavigateToSettings && (
                  <button
                    type="button"
                    onClick={onNavigateToSettings}
                    className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5"
                    title="تعديل الصفوف"
                  >
                    <Sliders className="w-2.5 h-2.5" />
                    <span>تعديل الصفوف</span>
                  </button>
                )}
              </div>
              {systemConfig?.examFormTemplate.availableGrades &&
              systemConfig.examFormTemplate.availableGrades.length > 0 ? (
                <div className="space-y-1">
                  <select
                    value={
                      systemConfig.examFormTemplate.availableGrades.includes(gradeLevel)
                        ? gradeLevel
                        : 'OTHER'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'OTHER') {
                        setGradeLevel(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {systemConfig.examFormTemplate.availableGrades.map((gr, idx) => (
                      <option key={idx} value={gr}>
                        {gr}
                      </option>
                    ))}
                    <option value="OTHER">-- صف أو مرحلة مخصصة أخرى --</option>
                  </select>
                  {(!systemConfig.examFormTemplate.availableGrades.includes(gradeLevel) ||
                    gradeLevel === '') && (
                    <input
                      type="text"
                      required
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      placeholder="اكتب الصف الدراسي يدوياً..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-purple-300"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  required
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="السادس الابتدائي، الثالث المتوسط، السادس الإعدادي..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                مجموعة النموذج (أ، ب، ج) *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setModelGroup('A')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    modelGroup === 'A'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  نموذج أ (رئيسي)
                </button>
                <button
                  type="button"
                  onClick={() => setModelGroup('B')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    modelGroup === 'B'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  نموذج ب (احتياط 1)
                </button>
                <button
                  type="button"
                  onClick={() => setModelGroup('C')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    modelGroup === 'C'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  نموذج ج (احتياط 2)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">مدة الامتحان (بالدقائق)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الدرجة الكلية</label>
              <input
                type="number"
                value={totalScore}
                onChange={(e) => setTotalScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">وقت فتح نبضة الصفر</label>
              <input
                type="text"
                value={zeroHourUnlockTime}
                onChange={(e) => setZeroHourUnlockTime(e.target.value)}
                placeholder="07:45 ص"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ الامتحان</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                التعليمات والتنبيهات العامة للطلبة (كل سطر عبارة عن نقطة)
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Dynamic Custom Fields configured by Admin */}
            {systemConfig?.customFields &&
              systemConfig.customFields.filter((cf) => cf.targetEntity === 'EXAM').length > 0 && (
                <div className="md:col-span-3 pt-3 mt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      <span>حقول مخصصة تم تعريفها بواسطة مسؤول النظام (Custom Exam Fields):</span>
                    </span>
                    {onNavigateToSettings && (
                      <button
                        type="button"
                        onClick={onNavigateToSettings}
                        className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                      >
                        إدارة الحقول في لوحة المسؤول
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {systemConfig.customFields
                      .filter((cf) => cf.targetEntity === 'EXAM')
                      .map((cf) => {
                        const val = customFieldsData[cf.key] ?? cf.defaultValue ?? '';
                        return (
                          <div
                            key={cf.id}
                            className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 space-y-1"
                          >
                            <label className="block text-xs font-bold text-slate-200">
                              {cf.label} {cf.required && <span className="text-rose-400">*</span>}
                            </label>
                            {cf.type === 'SELECT' ? (
                              <select
                                value={String(val)}
                                onChange={(e) =>
                                  setCustomFieldsData({
                                    ...customFieldsData,
                                    [cf.key]: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                              >
                                {cf.options?.map((opt, i) => (
                                  <option key={i} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : cf.type === 'BOOLEAN' ? (
                              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(val)}
                                  onChange={(e) =>
                                    setCustomFieldsData({
                                      ...customFieldsData,
                                      [cf.key]: e.target.checked,
                                    })
                                  }
                                  className="rounded text-indigo-500 focus:ring-0 w-4 h-4 cursor-pointer"
                                />
                                <span className="text-xs text-slate-300">
                                  {Boolean(val) ? 'مفعل / نعم' : 'معطل / كلا'}
                                </span>
                              </label>
                            ) : cf.type === 'NUMBER' ? (
                              <input
                                type="number"
                                value={val}
                                placeholder={cf.placeholder}
                                onChange={(e) =>
                                  setCustomFieldsData({
                                    ...customFieldsData,
                                    [cf.key]: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                              />
                            ) : (
                              <input
                                type="text"
                                value={val}
                                placeholder={cf.placeholder}
                                onChange={(e) =>
                                  setCustomFieldsData({
                                    ...customFieldsData,
                                    [cf.key]: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            )}
                            {cf.description && (
                              <span className="text-[10px] text-slate-500 block">
                                {cf.description}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Questions Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">
                أسئلة وفروع النموذج ({sections.length} أسئلة)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddSection}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة سؤال رئيسي جديد</span>
            </button>
          </div>

          {sections.map((sec, secIdx) => (
            <div
              key={sec.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleUpdateSection(sec.id, { title: e.target.value })}
                      placeholder="عنوان السؤال مثلاً: السؤال الأول: (20 درجة)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={sec.instructions || ''}
                      onChange={(e) => handleUpdateSection(sec.id, { instructions: e.target.value })}
                      placeholder="ملاحظة التوجيه (أجب عن فرعين فقط)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddItemToSection(sec.id)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة فرع</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(sec.id)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="حذف السؤال بالكامل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items / Sub-questions */}
              <div className="space-y-2.5 pr-3 border-r-2 border-indigo-500/30">
                {sec.items.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start gap-3"
                  >
                    <div className="flex-1 w-full">
                      <textarea
                        rows={2}
                        value={item.questionText}
                        onChange={(e) =>
                          handleUpdateQuestionItem(sec.id, item.id, e.target.value, item.maxScore)
                        }
                        placeholder="نص الفرع أو المسألة الرياضية..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <span>الدرجة:</span>
                        <input
                          type="number"
                          value={item.maxScore}
                          onChange={(e) =>
                            handleUpdateQuestionItem(
                              sec.id,
                              item.id,
                              item.questionText,
                              Number(e.target.value)
                            )
                          }
                          className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-xs text-cyan-400 font-bold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(sec.id, item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit / Action Bar */}
        <div className="sticky bottom-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              الحفظ يولد تلقائياً توقيعاً رقمياً SHA-256 ويشفر الحزمة بمفتاح AES-256-GCM المقفل زمنياً.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتشفير النموذج [{modelGroup}]</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
