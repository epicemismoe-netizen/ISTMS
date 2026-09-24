import React from 'react';
import {
  ShieldCheck,
  Lock,
  Printer,
  Smartphone,
  WifiOff,
  AlertOctagon,
  FileCheck2,
  Cpu,
  Layers,
  CheckCircle2,
  KeyRound,
  Eye,
  FileText,
} from 'lucide-react';

export const SecurityGuide: React.FC = () => {
  const securityPillars = [
    {
      id: 'pillar-1',
      title: '1. حل معضلة تسريب التيليغرام وشبكات التواصل (Anti-Telegram Leak)',
      icon: Smartphone,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/30',
      vulnerability: 'يقوم مراقب فاسد أو طالب بتصوير ورقة الامتحان بكاميرا الموبايل ونشرها في مجموعات الغش خلال الدقائق الأولى.',
      solution: 'العلامة المائية الجنائية الدقيقة والمتغيرة لكل طالب (Dynamic Micro-Dot Steganography):',
      details: [
        'كل ورقة تُطبع بشكل لحظي تحتوي على كود مشفر في الحواف وفي خلفية الأسئلة يتضمن: (رمز المحافظة، المدرسة، رقم القاعة، ورقم مقعد الطالب المتسلسل، وتوقيت الطباعة بالثانية).',
        'بمجرد التقاط أي صورة للورقة وظهور جزء صغير منها على الإنترنت، تقوم أداة الفحص الجنائي الوزارية بإدخال الرمز، ليظهر اسم المدرسة ورئيس المركز ورقم مقعد الطالب المتورط خلال 3 ثوانٍ فقط!',
        'الردع النفسي والقانوني: الطالب والمراقب يعلمان مسبقاً أن الورقة موسومة باسمهما ورقم مقعدهما، مما يقضي على دافع التصوير نهائياً.',
      ],
    },
    {
      id: 'pillar-2',
      title: '2. حل مخاطر اختراق أو اعتراض ملفات الأسئلة مسبقاً (Zero-Hour Time Lock)',
      icon: Lock,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30',
      vulnerability: 'محاولات اختراق شبكة الإنترنت أو أجهزة المدارس قبل أيام أو ساعات من الامتحان لسرقة ملف الأسئلة.',
      solution: 'التشفير العسكري ثنائي القناة والكبسولة المقفلة زمنياً (AES-256-GCM Capsule):',
      details: [
        'ترسل حزم الأسئلة إلى المدارس قبل موعد الامتحان مشفرة بالكامل بتشفير عسكري AES-256-GCM لا يمكن اختراقه.',
        'مفتاح فك التشفير غير موجود على أجهزة المدارس! بل يُطلق مركزياً من غرفة العمليات بوزارة التربية عند وقت الصفر (الساعة 07:45 ص، أي قبل الامتحان بـ 15 دقيقة فقط).',
        'حتى لو سُرق الجهاز أو سُحب القرص الصلب في الساعة 07:00 ص، فلن يجد السارق سوى نصوص عشوائية مشفرة مستحيلة الفك.',
      ],
    },
    {
      id: 'pillar-3',
      title: '3. حل مشكلة طباعة نسخ إضافية للتسريب أو البيع (Strict Quota Lock)',
      icon: Printer,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      vulnerability: 'قيام مسؤولي الطابعة في المدرسة بطباعة 20 أو 50 نسخة إضافية سراً وإخراجها خارج المركز قبل توزيعها على الطلاب.',
      solution: 'سياج الحصة الرقمية الصارم وتفريغ الذاكرة (In-Memory Direct Spooler):',
      details: [
        'النظام مقيد برقم تسلسلي وحصة صارمة مسجلة في الوزارة؛ فالمدرسة المسجل بها 65 طالباً لا تسمح المنظومة بطباعة سوى 65 نسخة بالضبط مسلسلة بأرقام المقاعد من 1 إلى 65.',
        'الطباعة تتم مباشرة من ذاكرة الرام المعزولة (RAM Enclave) إلى الطابعة فوراً دون إنشاء أو حفظ أي ملف PDF أو وورد على سطح المكتب.',
        'أي محاولة لإرسال أمر طباعة إضافي تطلق إنذاراً أمنياً أحمر في شاشة الوزارة وتجمد المركز فورياً.',
      ],
    },
    {
      id: 'pillar-4',
      title: '4. حل مشكلة انقطاع الإنترنت أو الكهرباء بالمدرسة (Offline Emergency OTP)',
      icon: WifiOff,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      vulnerability: 'انقطاع شبكة الإنترنت أو ضعف التغطية في بعض المدارس والقرى النائية في وقت إطلاق الامتحان.',
      solution: 'فك التشفير الصوتي للطوارئ عبر الاتصال الهاتفي المؤمن (Voice-Read OTP):',
      details: [
        'الحزمة المشفرة محملة مسبقاً في خادم المدرسة المحلي، فإذا انقطع النت في تمام 07:45 ص، لا يتوقف الامتحان.',
        'يتصل رئيس المركز هاتفياً بالخط الساخن المشفر لغرفة العمليات المركزية بالوزارة.',
        'يملي عليه رئيس اللجنة كود OTP صواريخ الطوارئ المشفر (مثال: EMG-8841-K1-99)، يدخله المشرف في المحطة فيتم فك التشفير محلياً وتبدأ الطباعة فوراً دون تأخير دقيقة واحدة.',
      ],
    },
    {
      id: 'pillar-5',
      title: '5. حل الطوارئ القصوى وسيناريو التسريب المسبق (Panic Kill-Switch)',
      icon: AlertOctagon,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
      vulnerability: 'حدوث تسريب غير متوقع لأحد الأسئلة قبل دقائق من بدء الامتحان والحاجة لإلغائه وطنياً فوراً.',
      solution: 'زر الإبادة والتحويل التلقائي للنموذج الاحتياطي B في 10 ثوانٍ:',
      details: [
        'تحتفظ المنظومة دائماً بثلاثة نماذج وزارية مشفرة (نموذج أ، نموذج ب، نموذج ج).',
        'بضغطة زر واحدة من الوزير في غرفة العمليات، يتم إرسال إشارة إيقاف قسرية فورية لجميع طابعات المدارس، وتلغى صلاحية النموذج A فورياً.',
        'يتم تنشيط مفتاح النموذج الاحتياطي B تلقائياً والبدء بطباعته فوراً، مما يحبط خطة المسربين ويوفر مليارات الدنانير التي كانت تُهدر بإلغاء الامتحانات وتأجيلها.',
      ],
    },
    {
      id: 'pillar-6',
      title: '6. حل مشاكل الطابعات وانحشار الورق (Smart Resumption & Jam Recovery)',
      icon: Layers,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
      vulnerability: 'حدوث عطل مفاجئ في الطابعة أو انحشار للورق، مما يثير هلع المراقبين أو يتسبب في تكرار أو نقص أوراق الطلاب.',
      solution: 'المحرك الذكي لتتبع النسخ التالفة والتحويل للطابعة الاحتياطية:',
      details: [
        'تتبع تلقائي للورقة المتوقفة؛ فإذا طُبعت 32 ورقة وانحشرت الطابعة، يستأنف النظام من الورقة رقم 33 تلقائياً دون تكرار أي نسخة سابقة.',
        'في حال تلف ورقة، يتم اختيار "بدل تالف" فيقوم النظام بطباعة ورقة موسومة بعبارة (بدل تالف رسمي) برقم متسلسل جديد مع توثيق اسم المراقب.',
        'إمكانية التحويل التلقائي لطابعة احتياطية متصلة بالشبكة الداخلية للمدرسة بضغطة زر واحدة.',
      ],
    },
    {
      id: 'pillar-7',
      title: '7. السجل الجنائي المشفر غير القابل للمسح (Tamper-Proof Audit Trail)',
      icon: FileCheck2,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10 border-teal-500/30',
      vulnerability: 'إنكار مسؤولي المدرسة قيامهم بفتح الأسئلة مبكراً أو التلاعب بالتوقيت.',
      solution: 'سلسلة كتل التجزئة الرقمية المشفرة (SHA-256 Event Chain):',
      details: [
        'تسجيل فوري لكل حركة (تسجيل دخول، فتح طرد، ضغط زر طباعة، استخراج ورقة) وتوقيعها رقمياً ببصمة SHA-256.',
        'السجل مشفر ومحفوظ سحابياً في الوزارة ومحلياً، ولا يستطيع أي مسؤول مدرسة أو مهندس تعديل أو حذف ثانية واحدة من السجل.',
        'يصلح السجل كدليل إدانة جنائي قطعي أمام القضاء وهيئات النزاهة.',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold">
                الدليل المعماري والأمني الشامل
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                بروتوكول الأمان والخيارات والحلول لمنظومة طباعة الأسئلة اللحظية
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                تم تصميم هذه المنظومة خصيصاً للقضاء على كافة أشكال التسريب والغش والتلاعب في الامتحانات العامة، عبر الدمج بين التشفير العسكري، العلامات المائية الجنائية، والتحكم الوزاري اللحظي.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pillars Grid */}
      <div className="space-y-4">
        {securityPillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${pillar.bgColor} ${pillar.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">{pillar.title}</h3>
                </div>
              </div>

              {/* Problem vs Solution Callouts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-rose-950/20 border border-rose-900/40 p-3.5 rounded-xl space-y-1 text-slate-300">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>المخاطر والثغرة التقليدية (Vulnerability):</span>
                  </div>
                  <p className="leading-relaxed">{pillar.vulnerability}</p>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-xl space-y-1 text-slate-300">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>الحل التقني المطبق في المنظومة (Solution):</span>
                  </div>
                  <p className="leading-relaxed font-semibold text-slate-200">{pillar.solution}</p>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>تفاصيل وآلية العمل الفنية:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside pr-1">
                  {pillar.details.map((detail, dIdx) => (
                    <li key={dIdx} className="leading-relaxed">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hardware & Infrastructure Recommendations */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span>المتطلبات التقنية والمعدات الموصى بها في المدارس (Hardware Specs)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300">1. طابعة ليزرية مؤمنة عالية السرعة:</div>
            <p className="text-slate-400 leading-relaxed">
              طابعة ليزرية شبكية تدعم سرعة لا تقل عن 50 إلى 60 صفحة بالدقيقة (PPM) مع ذاكرة داخلية مشفرة وتأمين منافذ USB.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300">2. وحدة حاسوب مخصصة بنظام معزول (Kiosk):</div>
            <p className="text-slate-400 leading-relaxed">
              جهاز كمبيوتر يعمل بوضع Kiosk Mode بدون متصفح مفتوح ومنافذ مقفلة، متصل بشبكة VLAN خاصة بالامتحانات مع عازل كهربائي (UPS).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300">3. كاميرا مراقبة موجهة للطابعة:</div>
            <p className="text-slate-400 leading-relaxed">
              كاميرا مراقبة CCTV متصلة مباشرة بغرفة العمليات بالوزارة تراقب خروج الورق وتسليمه للمراقبين لحظة بلحظة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
