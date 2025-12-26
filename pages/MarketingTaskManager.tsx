/**
 * Marketing Task Manager Page
 * Quản lý task, tiến độ, kết quả nhân viên Marketing
 */

import React, { useState, useMemo } from 'react';
import {
    ClipboardList, Plus, Edit, Trash2, X, CheckCircle, Clock,
    AlertCircle, Users, Target, TrendingUp, Filter
} from 'lucide-react';
import { useMarketingTasks } from '../src/hooks/useMarketingTasks';
import { useStaff } from '../src/hooks/useStaff';
import { useCampaigns } from '../src/hooks/useCampaigns';
import { MarketingTask, MarketingTaskStatus, MarketingTaskPriority } from '../src/types/marketingTypes';

const STATUS_COLORS: Record<MarketingTaskStatus, string> = {
    'Chưa bắt đầu': 'bg-gray-100 text-gray-700',
    'Đang làm': 'bg-blue-100 text-blue-700',
    'Hoàn thành': 'bg-green-100 text-green-700',
    'Hủy': 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS: Record<MarketingTaskPriority, string> = {
    'Thấp': 'bg-gray-100 text-gray-600',
    'Trung bình': 'bg-yellow-100 text-yellow-700',
    'Cao': 'bg-red-100 text-red-700',
};

export const MarketingTaskManager: React.FC = () => {
    const { tasks, loading, error, createTask, updateTask, deleteTask, getStaffCompletion } = useMarketingTasks();
    const { staff = [] } = useStaff();
    const { campaigns = [] } = useCampaigns();

    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<MarketingTask | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterAssignee, setFilterAssignee] = useState<string>('');

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        let result = [...tasks];
        if (filterStatus) {
            result = result.filter(t => t.status === filterStatus);
        }
        if (filterAssignee) {
            result = result.filter(t => t.assignedTo.includes(filterAssignee));
        }
        return result;
    }, [tasks, filterStatus, filterAssignee]);

    // Stats
    const stats = useMemo(() => {
        const total = tasks.length;
        const inProgress = tasks.filter(t => t.status === 'Đang làm').length;
        const completed = tasks.filter(t => t.status === 'Hoàn thành').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, inProgress, completed, completionRate };
    }, [tasks]);

    // Staff performance
    const staffPerformance = useMemo(() => {
        const marketingStaff = staff.filter(s =>
            s.position === 'Sale' || s.department === 'Kinh doanh' || s.role === 'Sale'
        );
        return marketingStaff.map(s => ({
            id: s.id,
            name: s.name,
            taskCount: tasks.filter(t => t.assignedTo.includes(s.id || '')).length,
            completionPercent: getStaffCompletion(s.id || ''),
        }));
    }, [staff, tasks, getStaffCompletion]);

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa task này?')) return;
        try {
            await deleteTask(id);
        } catch (err) {
            alert('Không thể xóa');
        }
    };

    const handleStatusChange = async (task: MarketingTask, newStatus: MarketingTaskStatus) => {
        if (!task.id) return;
        const updates: Partial<MarketingTask> = { status: newStatus };
        if (newStatus === 'Hoàn thành') {
            updates.completedDate = new Date().toISOString();
            updates.completionPercent = 100;
        }
        await updateTask(task.id, updates);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <ClipboardList className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Quản lý Task Marketing</h2>
                            <p className="text-sm text-gray-500">Phân công và theo dõi tiến độ công việc</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setEditingTask(null); setShowModal(true); }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >
                        <Plus size={16} /> Tạo Task
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard icon={<ClipboardList size={20} />} iconBg="bg-gray-100" iconColor="text-gray-600" label="Tổng Task" value={stats.total.toString()} />
                <SummaryCard icon={<Clock size={20} />} iconBg="bg-blue-100" iconColor="text-blue-600" label="Đang làm" value={stats.inProgress.toString()} />
                <SummaryCard icon={<CheckCircle size={20} />} iconBg="bg-green-100" iconColor="text-green-600" label="Hoàn thành" value={stats.completed.toString()} />
                <SummaryCard icon={<TrendingUp size={20} />} iconBg="bg-purple-100" iconColor="text-purple-600" label="% Hoàn thành" value={`${stats.completionRate}%`} />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap gap-4 items-center">
                    <Filter size={18} className="text-gray-400" />
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="">Tất cả trạng thái</option>
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang làm">Đang làm</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Hủy">Hủy</option>
                    </select>
                    <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="">Tất cả nhân viên</option>
                        {staff.filter(s => s.position === 'Sale' || s.department === 'Kinh doanh').map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-indigo-50 text-xs uppercase font-semibold text-gray-600">
                            <tr>
                                <th className="px-4 py-3">Task</th>
                                <th className="px-4 py-3">Người phụ trách</th>
                                <th className="px-4 py-3 text-center">Độ ưu tiên</th>
                                <th className="px-4 py-3 text-center">Tiến độ</th>
                                <th className="px-4 py-3 text-center">Trạng thái</th>
                                <th className="px-4 py-3 text-center">Deadline</th>
                                <th className="px-4 py-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-gray-500">Đang tải...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={7} className="text-center py-12 text-red-500">{error}</td></tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Chưa có task nào</td></tr>
                            ) : filteredTasks.map(task => (
                                <tr key={task.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{task.title}</div>
                                        {task.description && <div className="text-xs text-gray-500 truncate max-w-xs">{task.description}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {task.assignedToNames.map((name, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{name}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${task.completionPercent}%` }} />
                                            </div>
                                            <span className="text-xs font-medium">{task.completionPercent}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <select
                                            value={task.status}
                                            onChange={e => handleStatusChange(task, e.target.value as MarketingTaskStatus)}
                                            className={`px-2 py-1 rounded text-xs font-medium border-0 ${STATUS_COLORS[task.status]}`}
                                        >
                                            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                            <option value="Đang làm">Đang làm</option>
                                            <option value="Hoàn thành">Hoàn thành</option>
                                            <option value="Hủy">Hủy</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs">
                                        {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => { setEditingTask(task); setShowModal(true); }} className="p-1 text-gray-400 hover:text-indigo-600">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => task.id && handleDelete(task.id)} className="p-1 text-gray-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={20} className="text-indigo-600" />
                    Kết quả công việc nhân viên
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staffPerformance.map(sp => (
                        <div key={sp.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="font-medium text-gray-900 mb-2">{sp.name}</div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Số task: {sp.taskCount}</span>
                                <span className="font-bold text-indigo-600">{sp.completionPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full" style={{ width: `${sp.completionPercent}%` }} />
                            </div>
                        </div>
                    ))}
                    {staffPerformance.length === 0 && (
                        <div className="col-span-full text-center text-gray-400 py-8">
                            Chưa có nhân viên Sale/Marketing
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <TaskModal
                    task={editingTask}
                    staff={staff}
                    campaigns={campaigns}
                    onClose={() => { setShowModal(false); setEditingTask(null); }}
                    onSubmit={async (data) => {
                        if (editingTask?.id) {
                            await updateTask(editingTask.id, data);
                        } else {
                            await createTask(data as any);
                        }
                        setShowModal(false);
                        setEditingTask(null);
                    }}
                />
            )}
        </div>
    );
};

// Summary Card
const SummaryCard: React.FC<{ icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: string }> =
    ({ icon, iconBg, iconColor, label, value }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
                <div className={`${iconBg} p-2 rounded-lg ${iconColor}`}>{icon}</div>
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );

// Task Modal
interface TaskModalProps {
    task?: MarketingTask | null;
    staff: any[];
    campaigns: any[];
    onClose: () => void;
    onSubmit: (data: Partial<MarketingTask>) => Promise<void>;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, staff, campaigns, onClose, onSubmit }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        assignedTo: task?.assignedTo || [],
        assignedToNames: task?.assignedToNames || [],
        campaignId: task?.campaignId || '',
        campaignName: task?.campaignName || '',
        priority: task?.priority || 'Trung bình' as MarketingTaskPriority,
        status: task?.status || 'Chưa bắt đầu' as MarketingTaskStatus,
        dueDate: task?.dueDate || today,
        completionPercent: task?.completionPercent || 0,
        result: task?.result || '',
        notes: task?.notes || '',
    });
    const [loading, setLoading] = useState(false);

    const marketingStaff = staff.filter(s => s.position === 'Sale' || s.department === 'Kinh doanh' || s.role === 'Sale');

    const handleAssigneeChange = (staffId: string, checked: boolean) => {
        const staffMember = staff.find(s => s.id === staffId);
        if (checked) {
            setFormData({
                ...formData,
                assignedTo: [...formData.assignedTo, staffId],
                assignedToNames: [...formData.assignedToNames, staffMember?.name || ''],
            });
        } else {
            const idx = formData.assignedTo.indexOf(staffId);
            setFormData({
                ...formData,
                assignedTo: formData.assignedTo.filter(id => id !== staffId),
                assignedToNames: formData.assignedToNames.filter((_, i) => i !== idx),
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || formData.assignedTo.length === 0) {
            alert('Vui lòng nhập tên task và chọn người phụ trách');
            return;
        }
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">{task ? 'Sửa Task' : 'Tạo Task mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên Task <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="VD: Chạy quảng cáo Facebook" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách <span className="text-red-500">*</span></label>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                            {marketingStaff.length === 0 ? (
                                <p className="text-sm text-gray-400">Chưa có nhân viên Sale/Marketing</p>
                            ) : marketingStaff.map(s => (
                                <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.assignedTo.includes(s.id || '')} onChange={e => handleAssigneeChange(s.id || '', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600" />
                                    <span className="text-sm">{s.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as MarketingTaskPriority })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                                <option value="Thấp">Thấp</option>
                                <option value="Trung bình">Trung bình</option>
                                <option value="Cao">Cao</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                            <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as MarketingTaskStatus })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                                <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                <option value="Đang làm">Đang làm</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                                <option value="Hủy">Hủy</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiến độ (%)</label>
                            <input type="number" min={0} max={100} value={formData.completionPercent} onChange={e => setFormData({ ...formData, completionPercent: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chiến dịch liên quan</label>
                        <select value={formData.campaignId} onChange={e => {
                            const campaign = campaigns.find(c => c.id === e.target.value);
                            setFormData({ ...formData, campaignId: e.target.value, campaignName: campaign?.name || '' });
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            <option value="">-- Không liên kết --</option>
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kết quả chi tiết</label>
                        <textarea rows={2} value={formData.result} onChange={e => setFormData({ ...formData, result: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Mô tả kết quả đạt được..." />
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
