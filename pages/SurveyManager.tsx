/**
 * Survey Manager Page
 * Quản lý form khảo sát templates và gán cho học viên
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText, Plus, Edit, Trash2, X, Users, Send, Eye,
  CheckCircle, Clock, AlertCircle, Copy, Settings, List,
  MessageSquare, User as UserIcon, ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { useSurveyTemplates, useSurveyAssignments, useSurveyResponses } from '../src/hooks/useSurvey';
import { useStudents } from '../src/hooks/useStudents';
import { useClasses } from '../src/hooks/useClasses';
import { SurveyTemplate, SurveyQuestion, SurveyAssignment, SurveyResponse } from '../src/types/surveyTypes';

type TabType = 'templates' | 'assignments' | 'responses';

export const SurveyManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SurveyTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);

  const { templates, loading: templatesLoading, createTemplate, updateTemplate, deleteTemplate, initDefaults } = useSurveyTemplates();
  const { assignments, loading: assignmentsLoading, assignSurvey, cancelAssignment } = useSurveyAssignments();
  const { responses, loading: responsesLoading } = useSurveyResponses();
  const { students } = useStudents();
  const { classes } = useClasses();

  // Initialize default templates on first load
  useEffect(() => {
    if (!templatesLoading && templates.length === 0) {
      initDefaults();
    }
  }, [templatesLoading, templates.length]);

  // Stats
  const stats = useMemo(() => ({
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.status === 'active').length,
    pendingAssignments: assignments.filter(a => a.status === 'pending').length,
    submittedResponses: responses.length,
  }), [templates, assignments, responses]);

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Xóa form khảo sát này?')) return;
    await deleteTemplate(id);
  };

  const handleCancelAssignment = async (id: string) => {
    if (!confirm('Hủy gán khảo sát này?')) return;
    await cancelAssignment(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="text-indigo-600" size={24} />
              Quản lý Form Khảo sát
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Tạo form mẫu → Gán cho học viên → Thu thập phản hồi
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'templates' && (
              <button
                onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Plus size={18} /> Tạo form mới
              </button>
            )}
            {activeTab === 'assignments' && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Send size={18} /> Gán khảo sát
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-indigo-600">{stats.totalTemplates}</p>
            <p className="text-sm text-gray-600">Form mẫu</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-600">{stats.activeTemplates}</p>
            <p className="text-sm text-gray-600">Đang hoạt động</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingAssignments}</p>
            <p className="text-sm text-gray-600">Chờ điền</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-600">{stats.submittedResponses}</p>
            <p className="text-sm text-gray-600">Đã nhận</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4 border-t pt-4">
          {[
            { id: 'templates', label: 'Form mẫu', icon: FileText },
            { id: 'assignments', label: 'Đã gán', icon: Users },
            { id: 'responses', label: 'Phản hồi', icon: List },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>


      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {activeTab === 'templates' ? (
          /* Templates Tab */
          <div className="p-6">
            {templatesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Chưa có form mẫu nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`border rounded-xl p-4 hover:shadow-md transition-shadow ${
                      template.status === 'active' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText size={20} className={template.status === 'active' ? 'text-green-600' : 'text-gray-400'} />
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          template.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {template.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                        {template.isDefault && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                            Mặc định
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{template.description || 'Không có mô tả'}</p>
                    <p className="text-xs text-gray-400 mb-3">{template.questions.length} câu hỏi</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedTemplate(template); setShowAssignModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        disabled={template.status !== 'active'}
                      >
                        <Send size={14} /> Gán
                      </button>
                      <button
                        onClick={() => { setEditingTemplate(template); setShowTemplateModal(true); }}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'assignments' ? (
          /* Assignments Tab */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600">
                <tr>
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Form khảo sát</th>
                  <th className="px-4 py-3">Ngày gán</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Link</th>
                  <th className="px-4 py-3 text-center w-20">Hủy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignmentsLoading ? (
                  <tr><td colSpan={7} className="text-center py-8">Đang tải...</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chưa gán khảo sát nào</td></tr>
                ) : assignments.map(assignment => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{assignment.studentName}</p>
                      <p className="text-xs text-gray-500">{assignment.studentCode}</p>
                    </td>
                    <td className="px-4 py-3">{assignment.className || '-'}</td>
                    <td className="px-4 py-3">{assignment.templateName}</td>
                    <td className="px-4 py-3">{new Date(assignment.assignedAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        assignment.status === 'submitted' ? 'bg-green-100 text-green-700' :
                        assignment.status === 'expired' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {assignment.status === 'submitted' ? 'Đã điền' :
                         assignment.status === 'expired' ? 'Hết hạn' : 'Chờ điền'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {assignment.status === 'pending' && (
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}${window.location.pathname}#/survey/${assignment.token}`;
                            navigator.clipboard.writeText(url);
                            alert('Đã copy link!');
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Copy link"
                        >
                          <Copy size={16} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {assignment.status === 'pending' && (
                        <button
                          onClick={() => handleCancelAssignment(assignment.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Responses Tab - Improved */
          <div className="p-6">
            {responsesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-12">
                <List size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Chưa có phản hồi nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{responses.length}</p>
                    <p className="text-xs text-gray-600">Tổng phản hồi</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {(responses.reduce((sum, r) => sum + (r.teacherScore || 0), 0) / responses.filter(r => r.teacherScore).length || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-600">TB Giáo viên</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {(responses.reduce((sum, r) => sum + (r.curriculumScore || 0), 0) / responses.filter(r => r.curriculumScore).length || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-600">TB Chương trình</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {(responses.reduce((sum, r) => sum + (r.careScore || 0), 0) / responses.filter(r => r.careScore).length || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-600">TB Chăm sóc</p>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-teal-600">
                      {(responses.reduce((sum, r) => sum + (r.facilitiesScore || 0), 0) / responses.filter(r => r.facilitiesScore).length || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-600">TB Cơ sở VC</p>
                  </div>
                </div>

                {/* Response Cards */}
                <div className="space-y-3">
                  {responses.map(response => (
                    <ResponseCard key={response.id} response={response} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => { setShowTemplateModal(false); setEditingTemplate(null); }}
          onSave={async (data) => {
            if (editingTemplate) {
              await updateTemplate(editingTemplate.id, data);
            } else {
              await createTemplate(data);
            }
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignModal
          templates={templates.filter(t => t.status === 'active')}
          selectedTemplate={selectedTemplate}
          students={students}
          classes={classes}
          onClose={() => { setShowAssignModal(false); setSelectedTemplate(null); }}
          onAssign={async (templateId, studentList) => {
            const result = await assignSurvey(templateId, studentList);
            setShowAssignModal(false);
            setSelectedTemplate(null);
            alert(`Đã gán khảo sát cho ${result.length} học viên!`);
          }}
        />
      )}
    </div>
  );
};

// Score Badge Component
const ScoreBadge: React.FC<{ score?: number }> = ({ score }) => {
  if (!score) return <span className="text-gray-400">-</span>;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      score >= 8 ? 'bg-green-100 text-green-700' :
      score >= 6 ? 'bg-yellow-100 text-yellow-700' :
      'bg-red-100 text-red-700'
    }`}>
      {score}
    </span>
  );
};


// Template Modal
interface TemplateModalProps {
  template: SurveyTemplate | null;
  onClose: () => void;
  onSave: (data: Omit<SurveyTemplate, 'id' | 'createdAt'>) => Promise<void>;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ template, onClose, onSave }) => {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(template?.status || 'active');
  const [questions, setQuestions] = useState<SurveyQuestion[]>(template?.questions || [
    { id: 'teacher', question: 'Đánh giá về giáo viên', type: 'score', category: 'teacher', required: true, order: 1 },
    { id: 'curriculum', question: 'Đánh giá về chương trình học', type: 'score', category: 'curriculum', required: true, order: 2 },
    { id: 'care', question: 'Đánh giá về dịch vụ chăm sóc', type: 'score', category: 'care', required: true, order: 3 },
    { id: 'facilities', question: 'Đánh giá về cơ sở vật chất', type: 'score', category: 'facilities', required: true, order: 4 },
  ]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên form');
      return;
    }
    setSaving(true);
    try {
      await onSave({ name, description, status, questions });
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const newId = `q_${Date.now()}`;
    setQuestions([...questions, {
      id: newId,
      question: '',
      type: 'score',
      category: 'general',
      required: false,
      order: questions.length + 1
    }]);
  };

  const updateQuestion = (index: number, field: keyof SurveyQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">
            {template ? 'Sửa form khảo sát' : 'Tạo form khảo sát mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên form *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: Khảo sát chất lượng T12/2024"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Mô tả ngắn về form khảo sát..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm khóa</option>
              </select>
            </div>
          </div>

          {/* Questions */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">Câu hỏi ({questions.length})</h4>
              <button
                type="button"
                onClick={addQuestion}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={16} /> Thêm câu hỏi
              </button>
            </div>
            <div className="space-y-3">
              {questions.map((q, index) => (
                <div key={q.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="Nội dung câu hỏi..."
                      />
                    </div>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                      className="px-2 py-2 border rounded-lg text-sm"
                    >
                      <option value="score">Điểm (1-10)</option>
                      <option value="text">Văn bản</option>
                      <option value="choice">Lựa chọn</option>
                    </select>
                    <select
                      value={q.category || 'general'}
                      onChange={(e) => updateQuestion(index, 'category', e.target.value)}
                      className="px-2 py-2 border rounded-lg text-sm"
                    >
                      <option value="teacher">Giáo viên</option>
                      <option value="curriculum">Chương trình</option>
                      <option value="care">Chăm sóc</option>
                      <option value="facilities">Cơ sở VC</option>
                      <option value="general">Chung</option>
                    </select>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                      />
                      Bắt buộc
                    </label>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};


// Assign Modal
interface AssignModalProps {
  templates: SurveyTemplate[];
  selectedTemplate: SurveyTemplate | null;
  students: any[];
  classes: any[];
  onClose: () => void;
  onAssign: (templateId: string, students: Array<{ id: string; name: string; code?: string; classId?: string; className?: string }>) => Promise<void>;
}

const AssignModal: React.FC<AssignModalProps> = ({ templates, selectedTemplate, students, classes, onClose, onAssign }) => {
  const [templateId, setTemplateId] = useState(selectedTemplate?.id || '');
  const [selectMode, setSelectMode] = useState<'all' | 'class' | 'individual'>('class');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Filter students by class or search
  const filteredStudents = useMemo(() => {
    let result = students.filter(s => s.status === 'Đang học' || s.status === 'Nợ phí');
    if (selectMode === 'class' && selectedClassId) {
      result = result.filter(s => s.classId === selectedClassId || s.class === classes.find(c => c.id === selectedClassId)?.name);
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(s =>
        (s.fullName || s.name || '').toLowerCase().includes(search) ||
        (s.code || '').toLowerCase().includes(search)
      );
    }
    return result;
  }, [students, selectMode, selectedClassId, searchTerm, classes]);

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleAssign = async () => {
    if (!templateId) {
      alert('Vui lòng chọn form khảo sát');
      return;
    }
    if (selectedStudentIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 học viên');
      return;
    }

    setAssigning(true);
    try {
      const studentList = selectedStudentIds.map(id => {
        const student = students.find(s => s.id === id);
        const studentClass = classes.find(c => c.id === student?.classId);
        return {
          id,
          name: student?.fullName || student?.name || '',
          code: student?.code,
          classId: student?.classId,
          className: studentClass?.name || student?.class
        };
      });
      await onAssign(templateId, studentList);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Gán khảo sát cho học viên</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Select Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn form khảo sát *</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Chọn form --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Select Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn học viên theo</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={selectMode === 'class'}
                  onChange={() => setSelectMode('class')}
                />
                <span>Theo lớp</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={selectMode === 'individual'}
                  onChange={() => setSelectMode('individual')}
                />
                <span>Chọn từng người</span>
              </label>
            </div>
          </div>

          {/* Class Filter */}
          {selectMode === 'class' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chọn lớp</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentIds([]);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Chọn lớp --</option>
                {classes.filter(c => c.status === 'Đang học').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm học viên..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Student List */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Chọn tất cả ({filteredStudents.length})</span>
              </label>
              <span className="text-sm text-indigo-600 font-medium">
                Đã chọn: {selectedStudentIds.length}
              </span>
            </div>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {selectMode === 'class' && !selectedClassId ? 'Vui lòng chọn lớp' : 'Không tìm thấy học viên'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredStudents.map(student => (
                  <label
                    key={student.id}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{student.fullName || student.name}</p>
                      <p className="text-xs text-gray-500">{student.code} • {student.class || '-'}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleAssign}
            disabled={assigning || !templateId || selectedStudentIds.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {assigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang gán...
              </>
            ) : (
              <>
                <Send size={16} />
                Gán cho {selectedStudentIds.length} học viên
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// Response Card Component - Hiển thị chi tiết phản hồi
const ResponseCard: React.FC<{ response: SurveyResponse }> = ({ response }) => {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-400';
    if (score >= 8) return 'bg-green-100 text-green-700';
    if (score >= 6) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getScoreLabel = (score?: number) => {
    if (!score) return '-';
    if (score >= 9) return 'Xuất sắc';
    if (score >= 8) return 'Tốt';
    if (score >= 6) return 'Khá';
    if (score >= 4) return 'TB';
    return 'Cần cải thiện';
  };

  const avgScore = response.averageScore || 0;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      avgScore >= 8 ? 'border-green-200 bg-green-50/30' :
      avgScore >= 6 ? 'border-yellow-200 bg-yellow-50/30' :
      avgScore > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              avgScore >= 8 ? 'bg-green-500' :
              avgScore >= 6 ? 'bg-yellow-500' :
              avgScore > 0 ? 'bg-red-500' : 'bg-gray-400'
            }`}>
              {avgScore > 0 ? avgScore.toFixed(1) : '?'}
            </div>
            
            {/* Info */}
            <div>
              <h4 className="font-semibold text-gray-800">{response.studentName}</h4>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{response.className || 'Chưa xếp lớp'}</span>
                <span>•</span>
                <span>{new Date(response.submittedAt).toLocaleDateString('vi-VN', { 
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}</span>
              </div>
            </div>
          </div>

          {/* Scores Preview */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: 'GV', score: response.teacherScore },
                { label: 'CT', score: response.curriculumScore },
                { label: 'CS', score: response.careScore },
                { label: 'VC', score: response.facilitiesScore },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <span className={`inline-block w-8 h-8 rounded-lg text-sm font-bold leading-8 ${getScoreColor(item.score)}`}>
                    {item.score || '-'}
                  </span>
                </div>
              ))}
            </div>
            <ChevronDownIcon 
              size={20} 
              className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t bg-white p-4 space-y-4">
          {/* Score Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Giáo viên', score: response.teacherScore, icon: '👨‍🏫' },
              { label: 'Chương trình', score: response.curriculumScore, icon: '📚' },
              { label: 'Chăm sóc', score: response.careScore, icon: '💝' },
              { label: 'Cơ sở vật chất', score: response.facilitiesScore, icon: '🏫' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-3 ${getScoreColor(item.score)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{item.icon}</span>
                  <span className="text-xs font-medium opacity-80">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{item.score || '-'}</span>
                  <span className="text-xs opacity-70">{getScoreLabel(item.score)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Answers */}
          {response.answers && Object.keys(response.answers).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare size={14} /> Câu trả lời khác
              </h5>
              <div className="space-y-2 text-sm">
                {Object.entries(response.answers).map(([key, value]) => {
                  // Skip standard score fields
                  if (['teacher', 'curriculum', 'care', 'facilities'].includes(key)) return null;
                  return (
                    <div key={key} className="flex gap-2">
                      <span className="text-gray-500 min-w-[100px]">{key}:</span>
                      <span className="text-gray-800">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments */}
          {response.comments && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h5 className="text-sm font-medium text-blue-700 mb-1 flex items-center gap-2">
                <MessageSquare size={14} /> Ý kiến đóng góp
              </h5>
              <p className="text-sm text-gray-700 italic">"{response.comments}"</p>
            </div>
          )}

          {/* Submitter Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-2">
              <UserIcon size={14} />
              <span>Người điền: <strong>{response.submitterName || response.studentName}</strong></span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                response.submittedBy === 'parent' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {response.submittedBy === 'parent' ? 'Phụ huynh' : 'Học viên'}
              </span>
            </div>
            {response.submitterPhone && (
              <span>SĐT: {response.submitterPhone}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
