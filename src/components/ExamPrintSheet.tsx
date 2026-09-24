import React from 'react';
import { ExamPackage, SchoolCenter, StudentTicket, SystemConfig } from '../types';
import { ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';

interface ExamPrintSheetProps {
  exam: ExamPackage;
  school: SchoolCenter;
  ticket: StudentTicket;
  systemConfig?: SystemConfig;
  onClose?: () => void;
}

export const ExamPrintSheet: React.FC<ExamPrintSheetProps> = ({
  exam,
  school,
  ticket,
  systemConfig,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const template = systemConfig?.examFormTemplate;
  const theme = systemConfig?.theme;
  const customFieldsToPrint = systemConfig?.customFields.filter(
    (cf) => cf.targetEntity === 'EXAM' && cf.showInPrintSheet
  ) || [];

  return (
    <div className="bg-slate-900/90 fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4 sm:p-6 backdrop-blur-sm no-print-backdrop">
      {/* Top action toolbar - hidden when printed */}
      <div className="no-print w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">معاينة ورقة الامتحان المخصصة للطباعة اللحظية للمركز</h3>
            <p className="text-xs text-slate-400">
              المركز: {school.name} ({school.code}) | نسخة رقم: <span className="font-bold text-white">{ticket.seatNumber}</span> من أصل <span className="font-bold text-cyan-300">{school.examCopiesQuota || school.registeredStudentsCount}</span> | الرمز المائي: <span className="font-mono text-cyan-300">{ticket.uniqueWatermarkCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-cyan-900/30 cursor-pointer text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الورقة الرسمية (Print Sheet)</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm cursor-pointer"
            >
              إغلاق المعاينة
            </button>
          )}
        </div>
      </div>

      {/* Actual A4 Printable Exam Page */}
      <div
        id="official-exam-sheet"
        className="exam-page-container bg-white text-slate-950 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 shadow-2xl relative overflow-hidden border border-slate-300 rounded-sm font-sans"
        style={{ direction: 'rtl' }}
      >
        {/* Subtle dynamic security watermark diagonal background (visible on print to prevent Telegram leak) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035] flex items-center justify-center select-none overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        >
          <div className="transform -rotate-45 text-center text-black font-black text-2xl tracking-widest leading-loose uppercase whitespace-nowrap">
            {theme?.watermarkText || `${school.code} • ${school.name} • نسخة رقم ${ticket.seatNumber} • ${ticket.uniqueWatermarkCode}`}
            <br />
            {school.code} • {school.name} • نسخة رقم ${ticket.seatNumber} • ${ticket.uniqueWatermarkCode}
            <br />
            {school.code} • {school.name} • نسخة رقم ${ticket.seatNumber} • ${ticket.uniqueWatermarkCode}
            <br />
            {theme?.watermarkText || `${school.code} • ${school.name} • نسخة رقم ${ticket.seatNumber} • ${ticket.uniqueWatermarkCode}`}
          </div>
        </div>

        {/* Micro-dot security edge bar */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-center text-[8px] font-mono text-slate-600 border-b border-dotted border-slate-300 pb-1">
          <span>SECURE_PRINT_ID: {ticket.uniqueWatermarkCode}</span>
          <span>TIMESTAMP: {ticket.printedAt || '2026-06-21 07:46:12'} | CENTER: {school.code}</span>
          <span>STATION_HASH: {school.watermarkSignatureKey}</span>
        </div>

        {/* Official Header */}
        <div className="border-b-2 border-black pb-4 pt-3 mb-4">
          <div className="flex items-center justify-between">
            {/* Right side - Country and Ministry */}
            <div className="text-right">
              <h1 className="font-bold text-sm sm:text-base leading-tight">
                {template?.defaultHeaderRepublic || 'جمهورية العراق - وزارة التربية'}
              </h1>
              <h2 className="font-semibold text-xs sm:text-sm text-slate-700">
                {template?.defaultHeaderDirectorate || 'اللجنة الدائمة للامتحانات العامة'}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                المديرية العامة للتربية في محافظة {school.governorate} / {school.directorate}
              </p>
              <p className="text-xs font-semibold text-slate-800">
                المركز الامتحاني: {school.name} ({school.code})
              </p>
            </div>

            {/* Center - Official Badge / Title */}
            <div className="text-center px-4">
              <div className="inline-block border border-slate-800 rounded px-3 py-1 bg-slate-50 mb-1">
                <span className="text-xs font-black text-slate-900 tracking-wider">
                  {exam.isAlternateModel ? `النموذج الاحتياطي (${exam.modelGroup})` : `النموذج الوزاري (${exam.modelGroup})`}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-black">{exam.title}</h3>
              <p className="text-xs font-bold text-slate-700">{exam.sessionRound} ({exam.academicYear})</p>
            </div>

            {/* Left side - Exam Timing & Center Copy Info */}
            <div className="text-left font-sans text-xs border-r border-slate-300 pr-4">
              <div className="bg-slate-100 p-2 rounded border border-slate-300 text-right">
                <div className="font-bold text-black text-xs">بيانات حصة المركز المعتمدة:</div>
                <div className="font-semibold text-cyan-900">
                  نسخة رسمية رقم: <strong className="font-bold text-black text-sm">{ticket.seatNumber}</strong> من إجمالي <strong className="text-black">{school.examCopiesQuota || school.registeredStudentsCount}</strong>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5 font-mono">الرمز المائي: {ticket.uniqueWatermarkCode.slice(-16)}</div>
              </div>
              <div className="mt-1 text-slate-700 text-right text-[11px]">
                الوقت المحدد: <strong>{exam.durationMinutes / 60} ساعات</strong>
              </div>
            </div>
          </div>

          {/* Optional Custom Fields Strip */}
          {customFieldsToPrint.length > 0 && exam.customFieldsData && (
            <div className="mt-2 pt-2 border-t border-dashed border-slate-300 flex flex-wrap gap-4 text-xs font-medium text-slate-700">
              {customFieldsToPrint.map((cf) => {
                const val = exam.customFieldsData?.[cf.key];
                if (val === undefined || val === '') return null;
                return (
                  <div key={cf.id} className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <span className="font-bold text-slate-900">{cf.label}:</span>
                    <span>{typeof val === 'boolean' ? (val ? 'مسموح / نعم' : 'ممنوع / كلا') : String(val)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* General instructions box */}
          <div className="mt-3 p-2 bg-slate-50 border border-slate-300 rounded text-xs leading-relaxed text-slate-800">
            <div className="font-bold text-black mb-1 flex items-center justify-between">
              <span>تنبيهات عامة وقواعد الإجابة:</span>
              {template?.defaultRulesNote && (
                <span className="text-[10px] font-normal text-slate-600">{template.defaultRulesNote}</span>
              )}
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {exam.generalInstructions.map((ins, idx) => (
                <li key={idx}>{ins}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Exam Questions Body */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-900 leading-relaxed">
          {exam.sections.map((sec) => (
            <div key={sec.id} className="border-b border-slate-200 pb-3 last:border-b-0">
              <div className="flex justify-between items-baseline mb-2 bg-slate-100/70 p-1.5 rounded">
                <span className="font-bold text-black text-xs sm:text-sm">{sec.title}</span>
                {sec.instructions && (
                  <span className="text-[11px] font-semibold text-slate-600">{sec.instructions}</span>
                )}
              </div>

              <div className="space-y-2 pr-2">
                {sec.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.questionText}</p>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                      ({item.maxScore} درجات)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legal notice from system template */}
        {template?.defaultFooterNotice && (
          <div className="mt-4 p-2 bg-slate-100 text-[10px] text-slate-700 rounded border border-slate-200 text-center font-medium">
            {template.defaultFooterNotice}
          </div>
        )}

        {/* Exam Footer & Official Stamp */}
        <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-end text-xs">
          <div className="text-right space-y-1">
            <div className="font-bold text-slate-900 mb-1">
              مصادقة وتوقيع أعضاء اللجنة الامتحانية الثلاثية بالمركز:
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
              <div>
                <span className="font-bold block text-slate-950">1. رئيس المركز الامتحاني:</span>
                <span className="text-slate-700">{school.examCommittee?.[0]?.name || school.chiefProctorName}</span>
                <div className="text-[9px] text-emerald-700 font-mono mt-0.5">✓ توقيع رقمي معتمد</div>
              </div>
              <div>
                <span className="font-bold block text-slate-950">2. المشرف التربوي / الوزاري:</span>
                <span className="text-slate-700">{school.examCommittee?.[1]?.name || 'المشرف التربوي المتابع'}</span>
                <div className="text-[9px] text-emerald-700 font-mono mt-0.5">✓ توقيع رقمي معتمد</div>
              </div>
              <div>
                <span className="font-bold block text-slate-950">3. عضو اللجنة (المراقب الأول):</span>
                <span className="text-slate-700">{school.examCommittee?.[2]?.name || 'المراقب الأول'}</span>
                <div className="text-[9px] text-emerald-700 font-mono mt-0.5">✓ توقيع رقمي معتمد</div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono pt-1">طابعة معتمدة: {school.printerModel} • {school.printerIp}</div>
          </div>

          {template?.requireCommitteeSeal !== false && (
            <div className="text-center border-2 border-dashed border-slate-400 p-2 rounded w-36 h-20 flex flex-col items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate-700 mb-0.5" />
              <span className="text-[9px] font-black text-slate-800 uppercase">
                {theme?.sealText || 'ختم المركز الامتحاني السري'}
              </span>
              <span className="text-[8px] text-slate-500 font-mono">COPY #{ticket.seatNumber}</span>
            </div>
          )}

          <div className="text-left font-mono text-[9px] text-slate-600 shrink-0">
            <div>HASH: {exam.sha256Checksum.slice(0, 20)}...</div>
            <div>WATERMARK: {ticket.uniqueWatermarkCode}</div>
            <div>طباعة لحظية فورية - يمنع التصوير</div>
          </div>
        </div>
      </div>
    </div>
  );
};
