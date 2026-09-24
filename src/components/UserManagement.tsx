import React, { useState } from 'react';
import { AppUser, UserRole, SchoolCenter, EducationStage } from '../types';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Key,
  School,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Edit,
  Search,
  Filter,
  Copy,
  Check,
  Building2,
  MapPin,
  Lock,
  Eye,
  Sliders,
  AlertCircle,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { soundManager } from '../utils/security';

interface UserManagementProps {
  currentUser: AppUser;
  users: AppUser[];
  schools: SchoolCenter[];
  onAddUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onUpdateUser: (userId: string, updates: Partial<AppUser>) => void;
  onDeleteUser: (userId: string) => void;
  onSendEmailInvitation: (email: string, role: UserRole, targetCenterId?: string) => Promise<boolean>;
  onLogAuditEvent: (desc: string, severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER') => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  users,
  schools,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSendEmailInvitation,
  onLogAuditEvent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users_list' | 'invite_email' | 'roles_matrix'>('users_list');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('SCHOOL_CENTER');
  const [inviteCenterId, setInviteCenterId] = useState<string>(schools[0]?.id || '');
  const [inviteGovernorate, setInviteGovernorate] = useState('بغداد');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<string | null>(null);

  // New Direct User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('SCHOOL_CENTER');
  const [newUserCenterId, setNewUserCenterId] = useState<string>(schools[0]?.id || '');
  const [newUserGov, setNewUserGov] = useState('بغداد');
  const [newUserStages, setNewUserStages] = useState<EducationStage[]>(['SECONDARY']);

  const canManageAll = currentUser.role === 'ADMIN';

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleCopyLink = (token: string) => {
    const link = `https://moe-exam-seaj.gov.iq/auth/invite?token=${token}`;
    navigator.clipboard?.writeText(link);
    setCopiedToken(token);
    soundManager.playBeep();
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    setIsSendingInvite(true);
    soundManager.playBeep();

    const success = await onSendEmailInvitation(
      inviteEmail,
      inviteRole,
      inviteRole === 'SCHOOL_CENTER' ? inviteCenterId : undefined
    );

    setIsSendingInvite(false);
    if (success) {
      setInviteSuccessMessage(`تم إرسال رابط دعوة التسجيل بنجاح إلى البريد الإلكتروني: ${inviteEmail}`);
      onLogAuditEvent(
        `تم إرسال دعوة تسجيل رقمية مشفرة للمستخدم الجديد (${inviteName} - ${inviteEmail}) بصلاحية [${inviteRole === 'ADMIN' ? 'مسؤول رئيسي' : inviteRole === 'SUPERVISOR' ? 'مشرف وزارة' : 'مركز امتحاني'}]`,
        'SUCCESS'
      );
      setInviteEmail('');
      setInviteName('');
      setTimeout(() => setInviteSuccessMessage(null), 5000);
    }
  };

  const handleCreateDirectUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    onAddUser({
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
      status: 'ACTIVE',
      assignedCenterId: newUserRole === 'SCHOOL_CENTER' ? newUserCenterId : undefined,
      assignedGovernorate: newUserRole === 'SUPERVISOR' ? newUserGov : undefined,
      assignedStages: newUserRole === 'ADMIN' ? ['PRIMARY', 'INTERMEDIATE', 'SECONDARY', 'ALL'] : newUserStages,
    });

    onLogAuditEvent(
      `تم إنشاء وتفعيل حساب مستخدم جديد مباشرة من لوحة الإدارة: ${newUserName} (${newUserEmail}) برتبة [${newUserRole}]`,
      'SUCCESS'
    );

    soundManager.playBeep();
    setShowAddModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-xl shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  إدارة مستخدمي المنظومة والصلاحيات الهرمية
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Role-Based Access Control (RBAC)
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                التحكم بمستويات المسؤولين، المشرفين الوزاريين، ورؤساء المراكز الامتحانية، مع دعم إرسال دعوات التسجيل عبر البريد
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canManageAll && (
              <>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-900/30 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء مستخدم مباشر</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('invite_email')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-sm font-medium transition-all"
                >
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>إرسال دعوة بريد</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('users_list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'users_list'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>قائمة المستخدمين ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('invite_email')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'invite_email'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>دعوة مستخدم جديد بالبريد الإلكتروني</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roles_matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'roles_matrix'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>مصفوفة المستويات والصلاحيات (3 مستويات)</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeSubTab === 'users_list' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، البريد أو الهاتف..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-10 pl-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> تصفية الرتبة:
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">جميع الرتب</option>
                <option value="ADMIN">المسؤول الرئيسي (Admin)</option>
                <option value="SUPERVISOR">مشرف وزارة (Supervisor)</option>
                <option value="SCHOOL_CENTER">مركز امتحاني (Center)</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs font-semibold">
                    <th className="py-3.5 px-4">المستخدم والبريد الإلكتروني</th>
                    <th className="py-3.5 px-4">المستوى والصلاحية</th>
                    <th className="py-3.5 px-4">الارتباط (المركز / المحافظة)</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4">آخر نشاط</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredUsers.map((u) => {
                    const assignedSchool = schools.find((s) => s.id === u.assignedCenterId);
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                u.role === 'ADMIN'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : u.role === 'SUPERVISOR'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                {u.name}
                                {u.id === currentUser.id && (
                                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded">
                                    أنت (الحساب الحالي)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                                <span>{u.email}</span>
                                {u.phone && <span className="text-slate-500">• {u.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {u.role === 'ADMIN' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <Shield className="w-3.5 h-3.5" />
                              مسؤول رئيسي (صلاحيات كاملة)
                            </span>
                          )}
                          {u.role === 'SUPERVISOR' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Sliders className="w-3.5 h-3.5" />
                              مشرف وزارة (صلاحيات متوسطة)
                            </span>
                          )}
                          {u.role === 'SCHOOL_CENTER' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              <Building2 className="w-3.5 h-3.5" />
                              مركز امتحاني (طباعة المركز)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {u.role === 'SCHOOL_CENTER' ? (
                            assignedSchool ? (
                              <div className="text-xs">
                                <span className="text-slate-200 font-medium flex items-center gap-1">
                                  <School className="w-3.5 h-3.5 text-cyan-400" />
                                  {assignedSchool.name}
                                </span>
                                <span className="text-slate-500">
                                  {assignedSchool.governorate} • كود: {assignedSchool.code}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-400">غير مرتبط بمركز محدد</span>
                            )
                          ) : u.role === 'SUPERVISOR' ? (
                            <div className="text-xs">
                              <span className="text-slate-300 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                {u.assignedGovernorate ? `نطاق: ${u.assignedGovernorate}` : 'إشراف عام'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">جميع المحافظات والمراكز</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {u.status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              نشط
                            </span>
                          )}
                          {u.status === 'INVITED' && (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                                <Clock className="w-3 h-3" />
                                مدعو (بانتظار التسجيل)
                              </span>
                              {u.invitationToken && (
                                <button
                                  onClick={() => handleCopyLink(u.invitationToken!)}
                                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                                >
                                  {copiedToken === u.invitationToken ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">تم نسخ الرابط!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>نسخ رابط الدعوة</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                          {u.status === 'SUSPENDED' && (
                            <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              معلّق مؤقتاً
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                          {u.lastLogin || 'لم يسجل دخول بعد'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canManageAll && u.id !== currentUser.id ? (
                              <>
                                <button
                                  onClick={() => {
                                    const nextStatus = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
                                    onUpdateUser(u.id, { status: nextStatus });
                                    onLogAuditEvent(
                                      `تم تغيير حالة المستخدم (${u.name}) إلى [${nextStatus}]`,
                                      nextStatus === 'ACTIVE' ? 'SUCCESS' : 'WARNING'
                                    );
                                  }}
                                  title={u.status === 'SUSPENDED' ? 'إعادة التنشيط' : 'تجميد الحساب'}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    u.status === 'SUSPENDED'
                                      ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                      : 'text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                  }`}
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من حذف حساب (${u.name}) نهائياً؟`)) {
                                      onDeleteUser(u.id);
                                      onLogAuditEvent(`تم حذف المستخدم (${u.name}) نهائياً من المنظومة`, 'DANGER');
                                    }
                                  }}
                                  title="حذف الحساب"
                                  className="p-1.5 rounded-lg text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-600">محمي</span>
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
        </div>
      )}

      {/* Invite By Email Tab */}
      {activeSubTab === 'invite_email' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">إرسال دعوة تسجيل رقمية عبر البريد الإلكتروني</h3>
                <p className="text-slate-400 text-xs">
                  يصل للمستخدم بريد رسمي يحتوي على رمز تحقق فريد (Secure Invitation Token) لتسجيل حسابه وضبط كلمة مروره
                </p>
              </div>
            </div>

            {inviteSuccessMessage && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <span>{inviteSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم المدعو بالكامل / المنصب الرسمي *
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="مثال: أ. د. رياض كامل التميمي (رئيس مركز إمتحاني)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني الرسمي للمدعو *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@moe-iq.net أو gmail.com..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    الرتبة ومستوى الصلاحية *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SCHOOL_CENTER">مركز امتحاني (صلاحية المركز فقط)</option>
                    <option value="SUPERVISOR">مشرف من الوزارة (صلاحية إشرافية)</option>
                    <option value="ADMIN">مسؤول رئيسي (صلاحيات كاملة للنظام)</option>
                  </select>
                </div>

                {inviteRole === 'SCHOOL_CENTER' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      تخصيص المركز الامتحاني *
                    </label>
                    <select
                      value={inviteCenterId}
                      onChange={(e) => setInviteCenterId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      {schools.map((sch) => (
                        <option key={sch.id} value={sch.id}>
                          {sch.name} ({sch.governorate} - {sch.code})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      المحافظة المشرف عليها
                    </label>
                    <select
                      value={inviteGovernorate}
                      onChange={(e) => setInviteGovernorate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="بغداد">بغداد</option>
                      <option value="البصرة">البصرة</option>
                      <option value="نينوى">نينوى</option>
                      <option value="كركوك">كركوك</option>
                      <option value="كربلاء المقدسة">كربلاء المقدسة</option>
                      <option value="أربيل">أربيل</option>
                      <option value="النجف الأشرف">النجف الأشرف</option>
                      <option value="ذي قار">ذي قار</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
                >
                  {isSendingInvite ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري تشفير وإرسال الدعوة...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال دعوة التسجيل بالبريد فوراً</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Email Preview Mockup */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-3 pb-3 border-b border-slate-800">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>معاينة البريد الإلكتروني الذي سيتلقاه المدعو:</span>
              </div>

              <div className="bg-white text-slate-900 rounded-xl p-5 shadow-md text-xs space-y-3 font-sans">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="font-bold text-slate-900 text-sm">وزارة التربية والتعليم - العراق</div>
                  <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-[10px] font-mono">منظومة سياج</span>
                </div>
                <p className="text-slate-700">
                  السيد/السيدة: <strong>{inviteName || 'الاسم الكريم'}</strong> المحترم،
                </p>
                <p className="text-slate-600 leading-relaxed">
                  تمت دعوتك رسمياً للانضمام إلى <strong>منظومة "سياج" للأسئلة الوزارية الآمنة والطباعة اللحظية</strong> برتبة:
                  <span className="font-bold text-indigo-700 mx-1">
                    {inviteRole === 'ADMIN'
                      ? 'مسؤول رئيسي'
                      : inviteRole === 'SUPERVISOR'
                      ? 'مشرف وزارة'
                      : 'رئيس مركز امتحاني'}
                  </span>
                  .
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 font-mono text-[11px]">
                  <div>البريد: {inviteEmail || 'user@moe-iq.net'}</div>
                  <div>الصلاحية: {inviteRole}</div>
                  <div>صلاحية الرابط: 48 ساعة فقط</div>
                </div>
                <div className="text-center pt-2">
                  <div className="inline-block bg-cyan-600 text-white font-bold px-4 py-2 rounded shadow text-xs">
                    قبول الدعوة وتعيين كلمة المرور
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  هذا البريد مؤمن ومشفر بالكامل عبر البوابة الوطنية للاتصالات التعليمية
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                ملاحظة أمنية: لا يتم إعطاء أي صلاحية للمدعو إلا بعد فتح الرابط في بريده وتوثيق هويته وضبط كلمة مرور قوية وتفعيل المصادقة الثنائية.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Roles Matrix Tab */}
      {activeSubTab === 'roles_matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Level 1: Admin */}
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-rose-500 to-red-600" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/30">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono text-rose-400 font-bold">LEVEL 1 • الإدارة العليا</span>
                <h3 className="text-lg font-bold text-white">المسؤول الرئيسي (Admin)</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              يمتلك كامل الصلاحيات المطلقة لإدارة النظام، تكوين المراحل الدراسية، كتابة وحزم الأسئلة (A/B/C)، وتفعيل زر الإبادة والطوارئ.
            </p>

            <div className="space-y-2 border-t border-slate-800 pt-4 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>إضافة وتعديل وحزم الأسئلة ومجموعات (A, B, C)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>إدارة المستخدمين وإنشاء الحسابات وإرسال الدعوات</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>التحكم في المراكز من الابتدائي وحتى الثانوي</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>إطلاق نبضة وقت الصفر وزر الإبادة (Kill-Switch)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>تعديل إعدادات التشفير ومفاتيح البصمة الجنائية</span>
              </div>
            </div>
          </div>

          {/* Level 2: Supervisor */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 to-yellow-600" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold">LEVEL 2 • الإشراف الميداني</span>
                <h3 className="text-lg font-bold text-white">مشرف من الوزارة (Supervisor)</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              صلاحيات متوسطة تتركز في المتابعة الميدانية للمراكز الامتحانية بالمحافظة، التحقيق الجنائي في التسريب، ورصد الطابعات.
            </p>

            <div className="space-y-2 border-t border-slate-800 pt-4 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>مراقبة تقدم طباعة المراكز الامتحانية اللحظية</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>إضافة وتحديث مسودات الأسئلة للمراجعة والاعتماد</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>استخدام الفاحص الجنائي لكشف المسربين وهوية المركز</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>تجميد مركز امتحاني مشتبه به احترازياً</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-4 h-4 flex items-center justify-center font-bold text-rose-500">✕</span>
                <span>لا يمكنه تفعيل زر الإبادة أو تغيير مفاتيح التشفير</span>
              </div>
            </div>
          </div>

          {/* Level 3: Center */}
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">LEVEL 3 • المحطة المحلية</span>
                <h3 className="text-lg font-bold text-white">مركز امتحاني (School Center)</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              صلاحية مقيدة ومحصورة بمركزه الامتحاني فقط؛ فك تشفير الطرد وقت الصفر، وطباعة حصة المركز بحسب عدد الطلبة المسجلين.
            </p>

            <div className="space-y-2 border-t border-slate-800 pt-4 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>تسجيل الدخول بالمصادقة الثنائية لمركزه المخصص</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>فك تشفير طرد الأسئلة في الذاكرة الحية عند وقت الصفر</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>الطباعة اللحظية بحصته المعتمدة فقط دون زيادة</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>إدخال رمز الطوارئ الصوتي في حال انقطاع الإنترنت</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-4 h-4 flex items-center justify-center font-bold text-rose-500">✕</span>
                <span>لا يستطيع رؤية أي مركز آخر أو الاطلاع على بنك الأسئلة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Direct User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>إنشاء وتفعيل حساب مستخدم مباشر</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirectUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: أ. مازن سعيد عبد الله"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@moe-iq.net"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف الرسمي</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="0770xxxxxxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الرتبة والمستوى *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="SCHOOL_CENTER">مركز امتحاني (School Center)</option>
                  <option value="SUPERVISOR">مشرف من الوزارة (Supervisor)</option>
                  <option value="ADMIN">مسؤول رئيسي كامل الصلاحيات (Admin)</option>
                </select>
              </div>

              {newUserRole === 'SCHOOL_CENTER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المركز المرتبط به *</label>
                  <select
                    value={newUserCenterId}
                    onChange={(e) => setNewUserCenterId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.governorate} - {s.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newUserRole === 'SUPERVISOR' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">نطاق المحافظة</label>
                  <select
                    value={newUserGov}
                    onChange={(e) => setNewUserGov(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="بغداد">بغداد</option>
                    <option value="البصرة">البصرة</option>
                    <option value="نينوى">نينوى</option>
                    <option value="كركوك">كركوك</option>
                    <option value="كربلاء المقدسة">كربلاء المقدسة</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/40"
                >
                  حفظ وتفعيل الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
