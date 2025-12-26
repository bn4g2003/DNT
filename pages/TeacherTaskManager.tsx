/**
 * Teacher Task Manager Page
 * Quản lý task, tiến độ giáo viên/trợ giảng
 */

import React, { useState, useEffect } from 'react';
import {
  ListTodo, Plus, Edit, Trash2, X, Search, Filter, Clock, CheckCircle,
  AlertCircle, Users, Calendar, BarChart3, ChevronDown, Save
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { Staff, TeacherTask, TaskStatus, TaskPriority } from '../types';
import * as teacherReportService from '../src/services/teacherReportService';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ xử lý', color: 'text-gray-600', bg: 'bg-gray-100' },
  in_progress: { label: 'Đang thực hiện', color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: 'Hoàn thành', color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Đã hủy', color: 'text-red-600', bg: 'bg-red-100' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Thấp', color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { label: 'Trung bình', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  high: { label: 'Cao', color: 'text-orange-600', bg: 'bg-orange-100' },
  urgent: { label: 'Khẩn cấp', color: 'text-red-600', bg: 'bg-red-100' },
};

interface TaskFormData {
  title: string;
  description: string;
  assignedTo: string[];
  priority: TaskPriority;
  dueDate: string;
}

export const TeacherTaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TeacherTask | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    assignedTo: [],
    priority: 'medium',
    dueDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, staffSnap] = await Promise.all([
        teacherReportService.getTeacherTasks(),
        getDocs(collection(db, 'staff')),
      ]);
      
      const allStaff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Staff[];
      const teacherStaff = allStaff.filter(s => 
        s.role === 'Giáo viên' || s.role === 'Trợ giảng' ||
        s.roles?.includes('Giáo viên') || s.roles?.includes('Trợ giảng')
      );
      
      setTasks(tasksData);
      setStaff(teacherStaff);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title) {
        alert('Vui lòng nhập tiêu đề task');
        return;
      }
      
      const assignedNames = formData.assignedTo.map(id => 
        staff.find(s => s.id === id)?.name || ''
      ).filter(Boolean);
      
      if (editingTask) {
        await teacherReportService.updateTeacherTask(editingTask.id, {
          ...formData,
          assignedNames,
        });
      } else {
        await teacherReportService.createTeacherTask({
          ...formData,
          assignedNames,
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
        });
      }
      
      setShowModal(false);
      setEditingTask(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Lỗi lưu task');
    }
  };

  const handleUpdateStatus = async (task: TeacherTask, status: TaskStatus) => {
    try {
      await teacherReportService.updateTeacherTask(task.id, { 
        status,
        progress: status === 'completed' ? 100 : task.progress,
        completedDate: status === 'completed' ? new Date().toISOString() : undefined,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleUpdateProgress = async (task: TeacherTask, progress: number) => {
    try {
      await teacherReportService.updateTeacherTask(task.id, { 
        progress,
        status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : task.status,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleDelete = async (task: TeacherTask) => {
    if (!confirm(`Xóa task "${task.title}"?`)) return;
    try {
      await teacherReportService.deleteTeacherTask(task.id);
      fetchData();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Lỗi xóa task');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: [],
      priority: 'medium',
      dueDate: '',
    });
  };

  const openEdit = (task: TeacherTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo,
      priority: task.priority,
      dueDate: task.dueDate || '',
    });
    setShowModal(true);
  };

  const toggleAssignee = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(staffId)
        ? prev.assignedTo.filter(id => id !== staffId)
        : [...prev.assignedTo, staffId]
    }));
  };

  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.assignedNames?.some(n => n.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = !filterStatus || t.status === filterStatus;
    const matchPriority = !filterPriority || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  // Summary
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const avgProgress = tasks.length > 0
    ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
    : 0;


  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Task GV/TG</h1>
          <p className="text-gray-500 mt-1">Thiết lập và giám sát tiến độ công việc</p>
        </div>
        <button
          onClick={() => { setEditingTask(null); resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={18} />
          Tạo Task mới
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chờ xử lý</p>
              <p className="text-xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đang thực hiện</p>
              <p className="text-xl font-bold">{inProgressCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hoàn thành</p>
              <p className="text-xl font-bold">{completedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ListTodo size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiến độ TB</p>
              <p className="text-xl font-bold">{avgProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm task..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tất cả độ ưu tiên</option>
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const statusConfig = STATUS_CONFIG[task.status];
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
            
            return (
              <div key={task.id} className={`bg-white rounded-xl border p-4 ${isOverdue ? 'border-red-300' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">
                          Quá hạn
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{task.assignedNames?.join(', ') || 'Chưa phân công'}</span>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{task.dueDate}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Tiến độ</span>
                        <span className="font-medium">{task.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            task.progress === 100 ? 'bg-green-500' :
                            task.progress >= 50 ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${task.progress || 0}%` }}
                        ></div>
                      </div>
                      {/* Quick progress buttons */}
                      <div className="flex gap-1 mt-2">
                        {[0, 25, 50, 75, 100].map(p => (
                          <button
                            key={p}
                            onClick={() => handleUpdateProgress(task, p)}
                            className={`px-2 py-0.5 text-xs rounded ${
                              task.progress === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => openEdit(task)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Result & Note */}
                {task.result && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm"><span className="text-gray-500">Kết quả:</span> {task.result}</p>
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
              Chưa có task nào
            </div>
          )}
        </div>
      )}


      {/* Task Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingTask ? 'Sửa Task' : 'Tạo Task mới'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập tiêu đề task"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Mô tả chi tiết task"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phân công GV/TG</label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {staff.map(s => (
                    <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.assignedTo.includes(s.id)}
                        onChange={() => toggleAssignee(s.id)}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-sm">{s.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        s.role === 'Giáo viên' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {s.role}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {editingTask ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
