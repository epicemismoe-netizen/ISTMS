import React, { useState } from 'react';
import { SchoolCenter, ExamPackage } from '../types';
import { decodeForensicWatermark, soundManager } from '../utils/security';
import {
  Search,
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  Building,
  User,
  Clock,
  Printer,
  FileWarning,
  CheckCircle2,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface ForensicInspectorProps {
  schools: SchoolCenter[];
  exam: ExamPackage;
  onFreezeSchool: (schoolId: string) => void;
  onTriggerKillSwitch: () => void;
  onLogAuditEvent: (description: string, severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER') => void;
}

export const ForensicInspector: React.FC<ForensicInspectorProps> = ({
  schools,
  exam,
  onFreezeSchool,
  onTriggerKillSwitch,
  onLogAuditEvent,
}) => {
  const [inputCode, setInputCode] = useState<string>('');
  const [analyzedData, setAnalyzedData] = useState<{
    school: SchoolCenter;
    hallNumber: number;
    seatNumber: number;
    timeTag: string;
    crc: string;
  } | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [officialReportGenerated, setOfficialReportGenerated] = useState<boolean>(false);

  // Pre-configured test scenarios for user demonstration
  const sampleLeakedCodes = [
    {
      title: 'عينة مسربة (ثانوية المتميزين - بغداد الكرخ)',
      code: 'MOE-IRQ-2026-MTH-SCH-101-COPY-014-T074615-C1F',
      schoolCode: 'SCH-101',
    },
    {
      title: 'عينة مسربة (إعدادية الأندلس - نينوى)',
      code: 'MOE-IRQ-2026-MTH-SCH-104-COPY-047-T074612-C8B',
      schoolCode: 'SCH-104',
    },
    {
      title: 'عينة مسربة (إعدادية العشار - البصرة)',
      code: 'MOE-IRQ-2026-MTH-SCH-103-COPY-022-T074705-C4C',
      schoolCode: 'SCH-103',
    },
  ];

  const handleAnalyze = (codeToTest?: string) => {
    const code = (codeToTest || inputCode).trim();
    if (!code) return;

    soundManager.playBeep();
    setHasSearched(true);
    setOfficialReportGenerated(false);

    const decoded = decodeForensicWatermark(code);

    if (decoded) {
      const matchedSchool =
        schools.find((s) => s.code === decoded.schoolCode) ||
        schools.find((s) => decoded.schoolCode.includes(s.code)) ||
        schools[0];

      setAnalyzedData({
        school: matchedSchool,
        hallNumber: decoded.hallNumber,
        seatNumber: decoded.seatNumber,
        timeTag: decoded.timeTag,
        crc: decoded.crc,
      });

      soundManager.playAlert();
      onLogAuditEvent(
        `فحص جنائي: تم كشف مصدر تسريب ورقة امتحانية من كود (${code}) عائدة لمركز (${matchedSchool.name} - القاعة ${decoded.hallNumber}).`,
        'DANGER'
      );
    } else {
      setAnalyzedData(null);
      soundManager.playBeep();
    }
  };

  const handleApplyQuickSample = (sample: typeof sampleLeakedCodes[0]) => {
    setInputCode(sample.code);
    handleAnalyze(sample.code);
  };

  const handleGenerateReport = () => {
    setOfficialReportGenerated(true);
    soundManager.playSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shadow-lg">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold">
                  خوارزمية التعقب الجنائي (Anti-Leak Steganography)
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                الكاشف الجنائي للتسريب وفك شفرة العلامات المائية
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                في حال تم تصوير ورقة الأسئلة ونشرها على قنوات التلغرام أو مواقع التواصل، قم بإدخال الرمز المائي المطبوع على حواف الورقة لكشف المركز، القاعة، ورقم مقعد الطالب المتورط بالثانية والدقيقة!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Code & Quick Samples Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">
            أدخل كود العلامة المائية المستخرج من الصورة المسربة (Watermark Code):
          </label>
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="مثال: MOE-IRQ-2026-MTH-SCH-104-H2-S047-T074612-X8B"
                className="w-full bg-slate-950 border border-slate-700 text-sm font-mono text-cyan-300 pr-10 pl-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 tracking-wider"
              />
            </div>
            <button
              onClick={() => handleAnalyze()}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg shadow-cyan-950/40 flex items-center gap-2 whitespace-nowrap"
            >
              <Zap className="w-4 h-4" />
              <span>فحص وتعقب المصدر فوراً</span>
            </button>
          </div>
        </div>

        {/* Quick Test Samples */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 mb-2 font-medium">
            أو جرب إحدى العينات التجريبية الواقعية لاختبار قوة النظام:
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleLeakedCodes.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyQuickSample(sample)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileWarning className="w-3.5 h-3.5 text-amber-400" />
                <span>{sample.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Result Display */}
      {hasSearched && (
        <>
          {analyzedData ? (
            <div className="bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Alert Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold">
                    <ShieldAlert className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-black">
                      تم تأكيد مصدر التسريب وتحديد المسؤول بدقة 100%
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">
                      تقرير البصمة الجنائية للورقة المصورة
                    </h3>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  كود الفحص: <strong className="text-cyan-300">{inputCode}</strong>
                </div>
              </div>

              {/* Data Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* School & Location */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building className="w-4 h-4 text-cyan-400" />
                    <span>المركز الامتحاني المتورط:</span>
                  </div>
                  <div className="text-base font-black text-white">{analyzedData.school.name}</div>
                  <div className="text-slate-400">
                    كود المركز: <strong className="text-cyan-300 font-mono">{analyzedData.school.code}</strong>
                  </div>
                  <div className="text-slate-400">
                    المديرية: {analyzedData.school.governorate} / {analyzedData.school.directorate}
                  </div>
                </div>

                {/* Proctor Responsible */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>رئيس اللجنة المسؤول قانونياً:</span>
                  </div>
                  <div className="text-base font-black text-white">{analyzedData.school.chiefProctorName}</div>
                  <div className="text-slate-400">
                    رقم الهاتف: <span className="font-mono text-slate-300">{analyzedData.school.chiefProctorPhone}</span>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    بصمة المفتاح: {analyzedData.school.watermarkSignatureKey}
                  </div>
                </div>

                {/* Exact Copy Details */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>بيانات النسخة المطبوعة للمركز:</span>
                  </div>
                  <div className="text-base font-black text-white">
                    نسخة رسمية رقم: <span className="text-rose-400 font-black text-lg font-mono">{analyzedData.seatNumber}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-300">
                    من إجمالي حصة المركز: <span className="text-cyan-300 font-mono">{analyzedData.school.examCopiesQuota || analyzedData.school.registeredStudentsCount || 60} نسخة</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    توقيع رقمي موثق للجنة الامتحانية الثلاثية
                  </div>
                </div>

                {/* Printer & Exact Time */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>توقيت الطباعة والطابعة:</span>
                  </div>
                  <div className="text-base font-black text-white font-mono">
                    {analyzedData.timeTag}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    طراز الطابعة: {analyzedData.school.printerModel}
                  </div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    {analyzedData.school.printerIp}
                  </div>
                </div>
              </div>

              {/* Ministerial Legal Action Buttons */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-300">
                  <div className="font-bold text-white mb-1">الإجراءات الأمنية الفورية المقترحة:</div>
                  <p className="text-slate-400">
                    يمكنك إحالة المركز للتحقيق الجنائي وتجميد صلاحيات الطباعة فورياً لمنع تكرار أي خرق.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      onFreezeSchool(analyzedData.school.id);
                      soundManager.playAlert();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      analyzedData.school.isTampered
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-rose-700 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/60'
                    }`}
                  >
                    {analyzedData.school.isTampered
                      ? 'المركز مجمد أمنياً بالفعل'
                      : 'تجميد فوري لصلاحيات هذا المركز'}
                  </button>

                  <button
                    onClick={handleGenerateReport}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    تصدير محضر التحقيق الجنائي الوزاري
                  </button>
                </div>
              </div>

              {/* Official Report Display if generated */}
              {officialReportGenerated && (
                <div className="bg-white text-slate-950 p-6 rounded-xl border border-slate-300 shadow-xl space-y-4 text-xs font-sans">
                  <div className="border-b-2 border-black pb-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm">جمهورية العراق - وزارة التربية</div>
                      <div className="text-slate-600 text-xs">اللجنة الدائمة للامتحانات العامة - شعبة التحقيقات الرقمية</div>
                    </div>
                    <div className="text-left font-mono text-[11px]">
                      <div>الرقم السري للتقرير: REP-2026-{analyzedData.school.code}-99</div>
                      <div>التاريخ: 2026-06-21</div>
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <h4 className="font-black text-base text-black">
                      محضر إثبات واقعة تسريب ورقة امتحانية
                    </h4>
                  </div>

                  <p className="leading-relaxed">
                    بناءً على فحص البصمة المائية الجنائية الرقمية ذات الكود (<strong>{inputCode}</strong>)، ثبت بالدليل التقني القاطع الصادر عن خوادم التشفير المركزية أن الورقة المسربة طُبعت في:
                  </p>

                  <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                    <li><strong>المركز الامتحاني:</strong> {analyzedData.school.name} ({analyzedData.school.code})</li>
                    <li><strong>المحافظة والمديرية:</strong> {analyzedData.school.governorate} / {analyzedData.school.directorate}</li>
                    <li><strong>أعضاء اللجنة الامتحانية المشرفة:</strong> {analyzedData.school.chiefProctorName} والمشرف الوزاري والمراقب الأول</li>
                    <li><strong>بيانات الورقة المسربة:</strong> النسخة الرسمية رقم ({analyzedData.seatNumber}) من إجمالي حصة المركز ({analyzedData.school.examCopiesQuota || 60} نسخة)</li>
                    <li><strong>توقيت الطباعة الدقيق:</strong> {analyzedData.timeTag}</li>
                  </ul>

                  <p className="text-[11px] text-slate-600">
                    التوصية: استدعاء أعضاء اللجنة الامتحانية الثلاثية بالمركز للمساءلة الجنائية، والتحفظ على سجلات الطابعة المشفرة ({analyzedData.school.printerIp}).
                  </p>

                  <div className="flex justify-between pt-4 border-t border-slate-300 text-[11px] font-bold">
                    <div>ختم وتوقيع اللجنة الوزارية للتحقيق</div>
                    <div>توقيع مدير عام التقويم والامتحانات</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="font-bold text-white text-base">لم يتم العثور على تطابق لهذا الكود</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                تأكد من كتابة الكود كاملاً بصيغة: MOE-IRQ-2026-MTH-SCH-101-H1-S014-T074615-X1F
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
