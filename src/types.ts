export type SecurityStatus = 'SECURE' | 'RESTRICTED' | 'ALERT' | 'REVOKED';

// Educational Stages
export type EducationStage = 'PRIMARY' | 'INTERMEDIATE' | 'SECONDARY' | 'ALL';

// User Roles
export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'SCHOOL_CENTER';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  assignedCenterId?: string; // For SCHOOL_CENTER role
  assignedGovernorate?: string; // For SUPERVISOR role
  assignedStages?: EducationStage[]; // Stages supervised or managed
  phone?: string;
  department?: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  createdAt: string;
  lastLogin?: string;
  invitationToken?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string[];
  customFieldsData?: Record<string, string | number | boolean>;
}

export interface QuestionChoice {
  id: string;
  text: string;
}

export interface QuestionItem {
  id: string;
  number: number;
  questionText: string;
  choices?: string[];
  maxScore: number;
  subQuestions?: string[];
  note?: string;
  customFieldsData?: Record<string, string | number | boolean>;
}

export interface QuestionSection {
  id: string;
  title: string; // e.g. "السؤال الأول: اختر الإجابة الصحيحة (20 درجة)"
  instructions?: string;
  totalScore: number;
  items: QuestionItem[];
}

export interface CommitteeMember {
  id: string;
  roleTitle: string; // 'رئيس اللجنة الامتحانية' | 'المشرف التربوي / الوزاري' | 'عضو اللجنة الامتحانية (المراقب الأول)'
  name: string;
  phone: string; // Iraqi Mobile: 0770xxxxxxx, 0780xxxxxxx, 0750xxxxxxx
  nationalId?: string;
  twoFactorPin: string; // PIN / OTP code
  verified: boolean;
  verifiedAt?: string;
  smsSentAt?: string;
  smsStatus?: 'NOT_SENT' | 'SENT' | 'DELIVERED';
}

export interface CenterExamSheetCopy {
  copyNumber: number; // 1, 2, 3 ...
  totalCopies: number; // Quota
  centerCode: string;
  centerName: string;
  uniqueWatermarkCode: string;
  printedAt?: string;
  isPrinted: boolean;
}

// Retain for backward compatibility in case of lingering imports, mapped to CenterExamSheetCopy
export interface StudentTicket {
  id: string;
  seatNumber: number;
  studentName: string;
  hallNumber: number;
  uniqueWatermarkCode: string;
  printedAt?: string;
  isPrinted: boolean;
  reprintCount: number;
}

export interface SmsDispatchConfig {
  mode: 'AUTO_BEFORE_ZERO_HOUR' | 'EXACT_TIME' | 'MANUAL';
  scheduledTime: string; // e.g. "07:30 ص"
  leadMinutesBeforeZeroHour: number; // e.g. 15 minutes
  isDispatched: boolean;
  lastDispatchedAt?: string;
  gatewayStatus: 'ONLINE' | 'STANDBY';
}

export interface ExamPackage {
  id: string;
  code: string; // e.g. "EXAM-2026-MTH-S6"
  title: string; // e.g. "امتحان مادة الرياضيات - السادس الإعدادي العلمي"
  subject: string; // e.g. "الرياضيات"
  educationStage: EducationStage; // PRIMARY, INTERMEDIATE, SECONDARY
  gradeLevel: string; // e.g. "السادس الابتدائي", "الثالث المتوسط", "السادس الإعدادي"
  academicYear: string; // "2025 - 2026"
  sessionRound: string; // "الدور الأول"
  durationMinutes: number; // 180 (3 hours)
  totalQuestions: number;
  totalScore: number;
  scheduledDate: string; // "2026-06-21"
  zeroHourUnlockTime: string; // "07:45 ص" (قابل للتعديل ديناميكياً من قبل المسؤول)
  examStartTime: string; // "08:00 ص"
  status: 'SCHEDULED' | 'DISPATCHED' | 'UNLOCKED' | 'PRINTING' | 'REVOKED';
  modelGroup: 'A' | 'B' | 'C'; // Group A (Primary), B (Backup 1), C (Backup 2)
  isAlternateModel: boolean;
  sha256Checksum: string;
  encryptionAlgorithm: string; // "AES-256-GCM (Zero-Knowledge Envelope)"
  ciphertextPreview: string;
  sections: QuestionSection[];
  generalInstructions: string[];
  customFieldsData?: Record<string, string | number | boolean>;
}

export interface SchoolCenter {
  id: string;
  code: string; // e.g. "SCH-101"
  name: string; // e.g. "مركز ثانوية المتميزين للبنين"
  educationStage: EducationStage; // PRIMARY, INTERMEDIATE, SECONDARY, ALL
  stageNameArabic: string; // "التعليم الثانوي", "التعليم الأساسي/الابتدائي", "المتوسط", "شامل لكافة المراحل"
  assignedGrades: string[]; // e.g. ["السادس الإعدادي", "الثالث المتوسط"]
  directorate: string; // e.g. "الرصافة الأولى"
  governorate: string; // e.g. "بغداد"
  examCommittee: CommitteeMember[]; // اللجنة الامتحانية الثلاثية (المصادقة الثنائية تتطلب الـ 3 مشرفين)
  chiefProctorName: string; // رئيس اللجنة الامتحانية
  chiefProctorPhone: string;
  chiefProctorEmail?: string;
  registeredStudentsCount: number; // حصة نسخ الأسئلة المخصصة للمركز (قابلة للتعديل)
  examCopiesQuota?: number; // الحصة المعتمدة القابلة للتعديل
  printerModel: string; // e.g. "HP LaserJet Enterprise M612 - Secure Spooler"
  printerStatus: 'ONLINE' | 'PRINTING' | 'COMPLETED' | 'PAPER_JAM' | 'OFFLINE';
  printerIp: string;
  assignedExamId: string;
  status: 'IDLE' | 'PACKAGE_RECEIVED' | 'WAITING_ZERO_HOUR' | 'AUTHORIZED_PRINT' | 'PRINTING_ACTIVE' | 'PRINT_FINISHED' | 'SUSPENDED';
  currentPrintedCount: number;
  lastPrintTimestamp?: string;
  twoFactorPin: string; // Proctor secret PIN
  watermarkSignatureKey: string;
  isTampered: boolean;
  offlineEmergencyCode?: string;
  emisEntityId?: string;
  emisSchoolCode?: string;
  emisSyncedAt?: string;
  buildingType?: string;
  hallsCount?: number;
  capacityMax?: number;
  customFieldsData?: Record<string, string | number | boolean>;
}

export interface EmisEntity {
  id: string | number;
  code: string;
  name: string;
  type: string; // 'مدرسة' | 'مركز امتحاني' | 'مديرية' | 'إشراف'
  governorate: string;
  directorate: string;
  stage: EducationStage;
  stageNameArabic: string;
  principalName: string;
  phone: string;
  email: string;
  studentCapacity: number;
  hallsCount: number;
  address: string;
  printerModel?: string;
  printerIp?: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  lastUpdated: string;
}

export interface EmisSyncConfig {
  apiUrl: string;
  entityEndpoint: string;
  apiKeyOrToken?: string;
  autoMapUsers: boolean;
  autoGenerateCredentials: boolean;
  lastSyncTimestamp?: string;
  lastSyncStatus?: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'IDLE';
  lastSyncMessage?: string;
  connectionMode: 'DIRECT' | 'PROXY' | 'CACHED_FALLBACK';
}

export interface EmisSyncPreviewItem {
  entity: EmisEntity;
  action: 'CREATE' | 'UPDATE' | 'SKIP';
  existingCenter?: SchoolCenter;
  selected: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType:
    | 'DISPATCH'
    | 'KEY_RELEASE'
    | 'STATION_AUTH'
    | 'DECRYPT'
    | 'PRINT_PAGE'
    | 'PRINT_COMPLETED'
    | 'TAMPER_ALERT'
    | 'KILL_SWITCH'
    | 'USER_MANAGEMENT'
    | 'EXAM_CREATED'
    | 'LOGIN'
    | 'LOGOUT'
    | 'PASSWORD_RESET'
    | 'PASSWORD_CHANGE'
    | '2FA_ENABLED'
    | '2FA_DISABLED'
    | '2FA_VERIFIED'
    | 'PROFILE_UPDATE'
    | 'EMIS_SYNC'
    | 'CENTER_CREATED'
    | 'CENTER_UPDATED'
    | 'CENTER_DELETED'
    | 'SYSTEM_CONFIG_UPDATED';
  schoolCode?: string;
  schoolName?: string;
  description: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  hashSignature: string;
  operator: string;
}

export interface CustomFieldDefinition {
  id: string;
  targetEntity: 'EXAM' | 'QUESTION' | 'CENTER' | 'USER';
  key: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'BOOLEAN' | 'DATE' | 'TIME' | 'TEXTAREA';
  options?: string[]; // for SELECT
  defaultValue?: string | number | boolean;
  required: boolean;
  placeholder?: string;
  description?: string;
  section?: string;
  showInPrintSheet?: boolean;
}

export interface SystemThemeConfig {
  appName: string;
  appSubtitle: string;
  ministryName: string;
  departmentName: string;
  primaryColor: 'cyan' | 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';
  darkThemeIntensity: 'deep_slate' | 'pitch_black' | 'midnight_navy';
  watermarkText: string;
  sealText: string;
  headerBadgeText: string;
  systemNotice: string;
  systemNoticeActive: boolean;
  securityClearanceLabel: string;
  allowEmergencyCodes: boolean;
  enableSoundEffects: boolean;
  enableDetailedForensics: boolean;
  maxExamDurationMinutes: number;
  defaultPasscodeDuration: number;
}

export interface ExamFormTemplateConfig {
  defaultHeaderRepublic: string;
  defaultHeaderMinistry: string;
  defaultHeaderDirectorate: string;
  defaultCommitteeName: string;
  defaultRulesNote: string;
  defaultFooterNotice: string;
  enableSubQuestions: boolean;
  enableMultipleChoiceChoices: boolean;
  enableSectionInstructions: boolean;
  allowTeacherCustomInstructions: boolean;
  requireDirectorSignature: boolean;
  requireCommitteeSeal: boolean;
  defaultQuestionsCount: number;
  defaultSectionsCount: number;
  defaultScorePerQuestion: number;
  availableSubjects: string[];
  availableGrades: string[];
  availableRounds: string[];
}

export interface SystemConfig {
  theme: SystemThemeConfig;
  examFormTemplate: ExamFormTemplateConfig;
  customFields: CustomFieldDefinition[];
  governoratesList: string[];
  educationStagesList: { key: EducationStage; label: string }[];
  printerModelsList: string[];
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface ForensicResult {
  codeScanned: string;
  isValid: boolean;
  schoolCode: string;
  schoolName: string;
  governorate: string;
  directorate: string;
  examTitle: string;
  copyNumber: number;
  totalCenterCopies: number;
  printTimestamp: string;
  proctorName: string;
  printerIp: string;
  modelType: string;
  confidenceScore: number;
  committeeSummary?: string;
}
