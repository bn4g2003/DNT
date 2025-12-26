/**
 * Teacher Goal Manager Page
 * Quản lý mục tiêu KPI giáo viên/trợ giảng
 */

import React, { useState, useEffect } from 'react';
import {
  Target, Plus, Edit, Trash2, X, Search, Filter, TrendingUp, Award,
  Users, Calendar, BarChart3, CheckCircle, AlertCircle
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { Staff, TeacherGoal, TeacherPerformance } from '../types';
import * as teacherReportService from '../src/services/teacherReportService';

interface GoalFormData {
  title: string;
  description: string;
  staffId: string;
  kpiTarget: number;
  kpiWeight: number;
  startDate: string;
  endDate: string;
}

export const TeacherGoalManager: React.FC = () => {
  const [goals, setGoals] = useState<TeacherGoal[]>([]);
  const [performances, setPerformances] = useState<TeacherPerformance[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TeacherGoal | null>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    staffId: '',
    kpiTarget: 100,
    kpiWeight: 100,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goalsData, performanceData, staffSnap] = await Promise.all([
        teacherReportService.getTeacherGoals(undefined, selectedPeriod),
        teacherReportService.getTeacherPerformance(selectedPeriod),
        getDocs(collection(db, 'staff')),
      ]);
      
      const allStaff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Staff[];
      const teacherStaff = allStaff.filter(s => 
        s.role === 'Giáo viên' || s.role === 'Trợ giảng' ||
        s.roles?.includes('Giáo viên') || s.roles?.includes('Trợ giảng')
      );
      
      setGoals(goalsData);
      setPerformances(performanceData);
      setStaff(teacherStaff);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.staffId) {
        alert('Vui lòng nhập tiêu đề và chọn GV/TG');
        return;
      }
      
      const selectedStaff = staff.find(s => s.id === formData.staffId);
      if (!selectedStaff) return;
      
      const goalData: Omit<TeacherGoal, 'id'> = {
        title: formData.title,
        description: formData.description,
        staffId: formData.staffId,
        staffName: selectedStaff.name,
        staffRole: selectedStaff.role as 'Giáo viên' | 'Trợ giảng',
        kpiTarget: formData.kpiTarget,
        kpiWeight: formData.kpiWeight,
        kpiActual: editingGoal?.kpiActual || 0,
        kpiResult: editingGoal?.kpiResult || 0,
        period: selectedPeriod,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'active',
        createdAt: editingGoal?.createdAt || new Date().toISOString(),
      };
      
      if (editingGoal) {
        await teacherReportService.updateTeacherGoal(editingGoal.id, goalData);
      } else {
        await teacherReportService.createTeacherGoal(goalData);
      }
      
      setShowModal(false);
      setEditingGoal(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Lỗi lưu mục tiêu');
    }
  };

  const handleUpdateActual = async (goal: TeacherGoal, actual: number) => {
    try {
      const result = goal.kpiTarget > 0 ? Math.round((actual / goal.kpiTarget) * 100) : 0;
      await teacherReportService.updateTeacherGoal(goal.id, {
        kpiActual: actual,
        kpiResult: result,
        status: result >= 100 ? 'completed' : 'active',
      });
      fetchData();
    } catch (error) {
      console.error('Error updating actual:', error);
    }
  };

  const handleDelete = async (goal: TeacherGoal) => {
    if (!confirm(`Xóa mục tiêu "${goal.title}"?`)) return;
    try {
      await teacherReportService.deleteTeacherGoal(goal.id);
      fetchData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Lỗi xóa mục tiêu');
    }
  };

  const handleCalculatePerformance = async () => {
    try {
      for (const s of staff) {
        const performance = await teacherReportService.calculateTeacherPerformance(
          s.id,
          s.name,
          s.role as 'Giáo viên' | 'Trợ giảng',
          selectedPeriod
        );
        await teacherReportService.saveTeacherPerformance(performance);
      }
      fetchData();
      alert('Đã tính toán kết quả thành công!');
    } catch (error) {
      console.error('Error calculating performance:', error);
      alert('Lỗi tính toán kết quả');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      staffId: '',
      kpiTarget: 100,
      kpiWeight: 100,
      startDate: '',
      endDate: '',
    });
  };

  const openEdit = (goal: TeacherGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      staffId: goal.staffId,
      kpiTarget: goal.kpiTarget,
      kpiWeight: goal.kpiWeight,
      startDate: goal.startDate,
      endDate: goal.endDate,
    });
    setShowModal(true);
  };

  const filteredGoals = goals.filter(g => {
    const matchSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       g.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStaff = !filterStaff || g.staffId === filterStaff;
    return matchSearch && matchStaff;
  });

  // Group goals by staff
  const goalsByStaff = staff.map(s => ({
    staff: s,
    goals: filteredGoals.filter(g => g.staffId === s.id),
    performance: performances.find(p => p.staffId === s.id),
  })).filter(item => item.goals.length > 0 || filterStaff === item.staff.id);

  // Summary
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const avgResult = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.kpiResult || 0), 0) / goals.length)
    : 0;


  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý mục tiêu GV/TG</h1>
          <p className="text-gray-500 mt-1">Thiết lập KPI và đánh giá kết quả</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPerformanceModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <BarChart3 size={18} />
            Xem kết quả
          </button>
          <button
            onClick={handleCalculatePerformance}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <TrendingUp size={18} />
            Tính kết quả
          </button>
          <button
            onClick={() => { setEditingGoal(null); resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            Tạo mục tiêu
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Target size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng mục tiêu</p>
              <p className="text-xl font-bold">{totalGoals}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đạt mục tiêu</p>
              <p className="text-xl font-bold">{completedGoals}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Award size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Kết quả TB</p>
              <p className="text-xl font-bold">{avgResult}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">GV/TG có mục tiêu</p>
              <p className="text-xl font-bold">{goalsByStaff.filter(g => g.goals.length > 0).length}</p>
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
            placeholder="Tìm kiếm mục tiêu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterStaff}
          onChange={(e) => setFilterStaff(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tất cả GV/TG</option>
          {staff.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
          ))}
        </select>
        <input
          type="month"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Goals by Staff */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {goalsByStaff.map(({ staff: s, goals: staffGoals, performance }) => (
            <div key={s.id} className="bg-white rounded-xl border overflow-hidden">
              {/* Staff Header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="font-bold text-indigo-600">
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      s.role === 'Giáo viên' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {s.role}
                    </span>
                  </div>
                </div>
                {performance && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500">Task</p>
                      <p className="font-bold">{performance.taskResult}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Mục tiêu</p>
                      <p className="font-bold">{performance.goalResult}%</p>
                    </div>
                    <div className="text-center px-3 py-1 bg-indigo-100 rounded-lg">
                      <p className="text-gray-500 text-xs">Kết quả</p>
                      <p className="font-bold text-indigo-600">{performance.finalResult}%</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Goals Table */}
              {staffGoals.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-t">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mục tiêu</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">KPI Target</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Tỷ trọng</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Thực tế</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Kết quả</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {staffGoals.map(goal => (
                      <tr key={goal.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{goal.title}</p>
                          {goal.description && (
                            <p className="text-sm text-gray-500">{goal.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{goal.kpiTarget}</td>
                        <td className="px-4 py-3 text-center">{goal.kpiWeight}%</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={goal.kpiActual}
                            onChange={(e) => handleUpdateActual(goal, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${
                            goal.kpiResult >= 100 ? 'text-green-600' :
                            goal.kpiResult >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {goal.kpiResult}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(goal)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(goal)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  Chưa có mục tiêu nào
                </div>
              )}
            </div>
          ))}
          
          {goalsByStaff.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
              Chưa có mục tiêu nào trong kỳ này
            </div>
          )}
        </div>
      )}


      {/* Goal Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingGoal ? 'Sửa mục tiêu' : 'Tạo mục tiêu mới'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề mục tiêu *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="VD: Tỷ lệ học viên đi học đạt 90%"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giáo viên/Trợ giảng *</label>
                <select
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chọn GV/TG --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KPI Target</label>
                  <input
                    type="number"
                    value={formData.kpiTarget}
                    onChange={(e) => setFormData({ ...formData, kpiTarget: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ trọng (%)</label>
                  <input
                    type="number"
                    value={formData.kpiWeight}
                    onChange={(e) => setFormData({ ...formData, kpiWeight: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min={0}
                    max={100}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                disabled={!formData.title || !formData.staffId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {editingGoal ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Summary Modal */}
      {showPerformanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Kết quả GV/TG - {selectedPeriod}</h3>
              <button onClick={() => setShowPerformanceModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Công thức: Kết quả = (% Công việc + % Mục tiêu) / 2
            </p>
            
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Họ tên</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Vai trò</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">% Công việc</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">% Mục tiêu</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {performances.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.staffName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        p.staffRole === 'Giáo viên' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {p.staffRole}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{p.taskResult}%</td>
                    <td className="px-4 py-3 text-center">{p.goalResult}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        p.finalResult >= 80 ? 'text-green-600' :
                        p.finalResult >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {p.finalResult}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {performances.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Chưa có dữ liệu. Nhấn "Tính kết quả" để tính toán.
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPerformanceModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
