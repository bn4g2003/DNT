/**
 * Lịch Bồi Bài - Make-up Class Manager
 * Quản lý các buổi học kèm, bồi dưỡng kiến thức
 */

import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Calendar, Clock, X, Check, Trash2, Users, Circle, CheckCircle2, CalendarCheck, Sparkles } from 'lucide-react';
import { useTutoring } from '../src/hooks/useTutoring';
import { TutoringData, TutoringType, TutoringStatus } from '../src/services/tutoringService';
import { useStudents } from '../src/hooks/useStudents';
import { useClasses } from '../src/hooks/useClasses';
import { usePermissions } from '../src/hooks/usePermissions';
import { useAuth } from '../src/hooks/useAuth';
import { useStaff } from '../src/hooks/useStaff';

// Status Stepper Component - Visual progress indicator
const StatusStepper: React.FC<{
  currentStatus: TutoringStatus;
  onStatusChange: (status: TutoringStatus) => void;
  disabled?: boolean;
}> = ({ currentStatus, onStatusChange, disabled }) => {
  const steps = [
    { status: 'Chưa bồi' as TutoringStatus, label: 'Chưa bồi', icon: Circle, color: 'rose' },
    { status: 'Đã hẹn' as TutoringStatus, label: 'Đã hẹn', icon: CalendarCheck, color: 'amber' },
    { status: 'Đã bồi' as TutoringStatus, label: 'Xong', icon: CheckCircle2, color: 'emerald' },
  ];

  const currentIndex = steps.findIndex(s => s.status === currentStatus);

  return (
    <div className="flex items-center gap-0.5">
      {steps.map((step, index) => {
        const isActive = step.status === currentStatus;
        const isPast = index < currentIndex;
        const isFuture = index > currentIndex;
        const Icon = step.icon;

        return (
          <button
            key={step.status}
            onClick={() => !disabled && onStatusChange(step.status)}
            disabled={disabled}
            className={`
              group relative flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold
              transition-all duration-300 ease-out
              ${isActive 
                ? step.color === 'rose' 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200 scale-105' 
                  : step.color === 'amber'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 scale-105'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 scale-105'
                : isPast
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }
              ${!disabled && 'cursor-pointer hover:scale-105'}
              ${disabled && 'opacity-60 cursor-not-allowed'}
            `}
            title={`Chuyển sang: ${step.label}`}
          >
            <Icon size={12} className={isActive ? 'animate-pulse' : ''} />
            <span className={`${isActive ? '' : 'hidden group-hover:inline'} transition-all`}>
              {step.label}
            </span>
            
            {/* Active indicator dot */}
            {isActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full shadow animate-ping" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export const TutoringManager: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTutoring, setSelectedTutoring] = useState<TutoringData | null>(null);
  const [filterStatus, setFilterStatus] = useState<TutoringStatus | ''>('');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default today

  // Permissions
  const { shouldShowOnlyOwnClasses, staffId, canCreate, canDelete } = usePermissions();
  const { staffData } = useAuth();
  const onlyOwnClasses = shouldShowOnlyOwnClasses('tutoring');
  const canCreateTutoring = canCreate('tutoring');
  const canDeleteTutoring = canDelete('tutoring');

  const { tutoringList: allTutoringList, loading, error, createTutoring, scheduleTutoring, completeTutoring, deleteTutoring } = useTutoring({});
  const { students } = useStudents();
  const { classes: allClasses } = useClasses();
  const { staff } = useStaff();

  // Get unique teachers from staff (filter by position)
  const teachers = useMemo(() => {
    return staff.filter(s => 
      s.position?.toLowerCase().includes('giáo viên') || 
      s.position?.toLowerCase().includes('teacher') ||
      s.position?.toLowerCase().includes('gv')
    );
  }, [staff]);

  // Filter classes for teachers
  const classes = useMemo(() => {
    if (!onlyOwnClasses || !staffData) return allClasses;
    const myName = staffData.name;
    const myId = staffData.id || staffId;
    return allClasses.filter(cls => 
      cls.teacher === myName || 
      cls.teacherId === myId ||
      cls.assistant === myName ||
      cls.assistantId === myId
    );
  }, [allClasses, onlyOwnClasses, staffData, staffId]);

  // Filter tutoring list for teachers (only their classes)
  const tutoringList = useMemo(() => {
    if (!onlyOwnClasses || !staffData) return allTutoringList;
    const myClassNames = classes.map(c => c.name);
    return allTutoringList.filter(t => myClassNames.includes(t.className));
  }, [allTutoringList, onlyOwnClasses, staffData, classes]);

  // Filter by status and date
  const filteredList = useMemo(() => {
    let result = tutoringList;
    if (filterStatus) {
      result = result.filter(t => t.status === filterStatus);
    }
    if (filterDate) {
      result = result.filter(t => t.scheduledDate === filterDate);
    }
    return result;
  }, [tutoringList, filterStatus, filterDate]);

  // Count for today
  const todayCount = tutoringList.filter(t => t.scheduledDate === new Date().toISOString().split('T')[0]).length;

  const getStatusBadge = (status: TutoringStatus) => {
    const styles: Record<TutoringStatus, { bg: string; text: string; label: string }> = {
      'Chưa bồi': { bg: 'bg-red-100', text: 'text-red-700', label: 'Chưa bồi' },
      'Đã hẹn': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Đã hẹn' },
      'Đã bồi': { bg: 'bg-green-100', text: 'text-green-700', label: 'Hoàn thành' },
      'Hủy': { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Đã hủy' },
    };
    return styles[status];
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Xác nhận đã hoàn thành bồi bài?')) return;
    try {
      console.log('Completing tutoring:', id);
      await completeTutoring(id);
      alert('Đã cập nhật trạng thái thành công!');
    } catch (err: any) {
      console.error('Complete error:', err);
      alert(`Không thể cập nhật trạng thái: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa lịch bồi bài này?')) return;
    try {
      await deleteTutoring(id);
    } catch (err) {
      alert('Không thể xóa');
    }
  };

  const handleStatusChange = async (session: TutoringData, newStatus: TutoringStatus) => {
    if (!session.id) return;
    try {
      if (newStatus === 'Đã bồi') {
        await completeTutoring(session.id);
      } else if (newStatus === 'Đã hẹn' && session.status === 'Chưa bồi') {
        setSelectedTutoring(session);
        setShowScheduleModal(true);
        return;
      }
    } catch (err: any) {
      alert(`Không thể cập nhật: ${err?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex justify-between items-start bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-200">
            <BookOpen className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Lịch bồi bài</h2>
            <p className="text-sm text-slate-500 mt-0.5">Quản lý các buổi học kèm, bồi dưỡng kiến thức</p>
          </div>
        </div>
        
        {/* FAB-style Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="group relative flex items-center gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white pl-4 pr-5 py-3 rounded-full hover:shadow-xl hover:shadow-purple-300/50 transition-all duration-300 hover:scale-105 font-semibold text-sm"
        >
          {/* Animated ring */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 animate-pulse opacity-50" />
          
          {/* Icon with sparkle effect */}
          <span className="relative flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          </span>
          
          <span className="relative flex items-center gap-1.5">
            <Sparkles size={14} className="animate-pulse" />
            Đặt hẹn lịch bồi
          </span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-100">
        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200"
          >
            Hôm nay ({todayCount})
          </button>
          <button
            onClick={() => setFilterDate('')}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
          >
            Tất cả ngày
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Status Filter */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === '' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả ({tutoringList.filter(t => !filterDate || t.scheduledDate === filterDate).length})
          </button>
          <button
            onClick={() => setFilterStatus('Chưa bồi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'Chưa bồi' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            Chưa bồi
          </button>
          <button
            onClick={() => setFilterStatus('Đã hẹn')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'Đã hẹn' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
          >
            Đã hẹn
          </button>
          <button
            onClick={() => setFilterStatus('Đã bồi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'Đã bồi' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            Hoàn thành
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          Lỗi: {error}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p>Không có lịch bồi bài nào</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-indigo-600 hover:underline text-sm"
          >
            + Tạo lịch bồi bài mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredList.map((session) => {
            const badge = getStatusBadge(session.status);
            return (
              <div
                key={session.id}
                className="group bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:border-violet-200 hover:-translate-y-0.5"
              >
                {/* Header Row - Status Stepper */}
                <div className="flex justify-between items-center mb-3">
                  <StatusStepper
                    currentStatus={session.status}
                    onStatusChange={(newStatus) => handleStatusChange(session, newStatus)}
                  />
                  <button
                    onClick={() => session.id && handleDelete(session.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-all"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Student Info */}
                <div className="mb-2">
                  <h3 className="font-bold text-slate-800 text-sm truncate leading-tight">{session.studentName}</h3>
                  <p className="text-violet-600 text-xs truncate font-medium">{session.className}</p>
                </div>

                {/* Details - Horizontal Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {session.scheduledDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                      <Calendar size={10} />
                      {new Date(session.scheduledDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                  {session.scheduledTime && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-medium">
                      <Clock size={10} />
                      {session.scheduledTime}
                    </span>
                  )}
                  {session.tutorName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full text-[10px] font-medium">
                      <Users size={10} />
                      {session.tutorName}
                    </span>
                  )}
                </div>

                {/* Note - Styled */}
                {session.note && (
                  <div className="mt-2 px-2 py-1.5 bg-amber-50 border-l-2 border-amber-300 rounded-r-lg">
                    <p className="text-[10px] text-amber-700 italic truncate" title={session.note}>
                      {session.note}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTutoringModal
          students={students}
          classes={classes}
          teachers={teachers}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await createTutoring(data);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedTutoring && (
        <ScheduleModal
          tutoring={selectedTutoring}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedTutoring(null);
          }}
          onSubmit={async (date, time, tutorId, tutorName) => {
            if (selectedTutoring.id) {
              await scheduleTutoring(selectedTutoring.id, date, time, tutorId, tutorName);
            }
            setShowScheduleModal(false);
            setSelectedTutoring(null);
          }}
        />
      )}
    </div>
  );
};

// ============================================
// CREATE TUTORING MODAL
// ============================================
interface CreateModalProps {
  students: Array<{ id: string; fullName: string; class?: string }>;
  classes: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; name: string; position?: string }>;
  onClose: () => void;
  onSubmit: (data: Omit<TutoringData, 'id'>) => Promise<void>;
}

const CreateTutoringModal: React.FC<CreateModalProps> = ({ students, classes, teachers, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    type: 'Nghỉ học' as TutoringType,
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '15:00',
    tutorName: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);

  const selectedStudent = students.find(s => s.id === formData.studentId);
  const selectedClass = classes.find(c => c.name === selectedStudent?.class);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setLoading(true);
      await onSubmit({
        studentId: formData.studentId,
        studentName: selectedStudent.fullName,
        classId: selectedClass?.id || '',
        className: selectedStudent.class || '',
        type: formData.type,
        status: formData.tutorName ? 'Đã hẹn' : 'Chưa bồi',
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        tutorName: formData.tutorName,
        note: formData.note,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Đặt hẹn lịch bồi</h3>
              <p className="text-white/70 text-xs">Tạo lịch bồi bài mới cho học sinh</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Student Select - Styled */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Học sinh <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-800 font-medium transition-all"
            >
              <option value="">-- Chọn học sinh --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} - {s.class || 'Chưa có lớp'}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time - Card style */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                <Calendar size={12} />
                Ngày bồi
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-0 py-1 bg-transparent border-0 text-slate-800 font-semibold focus:ring-0"
              />
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <label className="flex items-center gap-2 text-xs font-semibold text-blue-500 mb-2">
                <Clock size={12} />
                Giờ bồi
              </label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full px-0 py-1 bg-transparent border-0 text-slate-800 font-semibold focus:ring-0"
              />
            </div>
          </div>

          {/* Tutor Name - Dropdown */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              <Users size={12} />
              Giáo viên bồi
            </label>
            <select
              value={formData.tutorName}
              onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-800 font-medium transition-all"
            >
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.name}>
                  {t.name} {t.position && `(${t.position})`}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              <BookOpen size={12} />
              Nội dung bồi
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-800 resize-none transition-all"
              placeholder="VD: Ôn tập Unit 3, luyện nghe..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !formData.studentId}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-50 font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Đặt hẹn
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// SCHEDULE MODAL
// ============================================
interface ScheduleModalProps {
  tutoring: TutoringData;
  onClose: () => void;
  onSubmit: (date: string, time: string, tutorId: string, tutorName: string) => Promise<void>;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ tutoring, onClose, onSubmit }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('15:00');
  const [tutorName, setTutorName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit(date, time, '', tutorName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-bold text-gray-800">Đặt lịch bồi bài</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Học sinh</p>
            <p className="font-bold text-gray-900">{tutoring.studentName}</p>
            <p className="text-sm text-indigo-600">{tutoring.className}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bồi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bồi <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giáo viên bồi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={tutorName}
              onChange={(e) => setTutorName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Tên giáo viên bồi bài"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !tutorName}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Đặt lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
