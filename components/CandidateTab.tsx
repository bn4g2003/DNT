import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, X, Phone, Mail, Calendar, Briefcase, GraduationCap, User, FileText, CheckCircle, XCircle, Clock, Eye, UserCheck } from 'lucide-react';
import { Candidate, CandidateStatus, Staff } from '../types';
import { formatCurrency } from '../src/utils/currencyUtils';
import { StaffFormModalEnhanced } from './StaffFormModalEnhanced';

interface CandidateTabProps {
    candidates: Candidate[];
    loading: boolean;
    createCandidate: (data: Omit<Candidate, 'id'>) => Promise<string>;
    updateCandidate: (id: string, data: Partial<Candidate>) => Promise<void>;
    deleteCandidate: (id: string) => Promise<void>;
    // For conversion to staff
    createStaff?: (data: Omit<Staff, 'id'>) => Promise<string>;
    centerList?: { id: string; name: string }[];
}

const CANDIDATE_STATUSES: CandidateStatus[] = ['Mới', 'Đang xem xét', 'Phỏng vấn', 'Đạt', 'Không đạt', 'Đã tuyển'];
const APPLY_POSITIONS = ['Giáo Viên Việt', 'Giáo Viên Nước Ngoài', 'Trợ Giảng', 'Nhân viên', 'CSKH', 'Sale', 'Marketing', 'Kế toán'];
const APPLY_DEPARTMENTS = ['Đào Tạo', 'Văn phòng', 'Marketing', 'Điều hành'];

export const CandidateTab: React.FC<CandidateTabProps> = ({
    candidates, loading, createCandidate, updateCandidate, deleteCandidate, createStaff, centerList = []
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [candidateToConvert, setCandidateToConvert] = useState<Candidate | null>(null);
    const [showConvertModal, setShowConvertModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', dob: '', gender: 'Nam' as 'Nam' | 'Nữ', address: '',
        applyPosition: 'Giáo Viên Việt', applyDepartment: 'Đào Tạo',
        expectedSalary: undefined as number | undefined, availableDate: '',
        education: '', degree: '', major: '', experience: '', skills: '', certificates: '',
        status: 'Mới' as CandidateStatus, source: '', referredBy: '', cvUrl: '', notes: ''
    });

    const filteredCandidates = useMemo(() => {
        return candidates.filter(c => {
            const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.phone?.includes(searchTerm) || c.applyPosition?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [candidates, searchTerm, filterStatus]);

    const handleCreate = () => {
        setEditingCandidate(null);
        setFormData({
            name: '', phone: '', email: '', dob: '', gender: 'Nam', address: '',
            applyPosition: 'Giáo Viên Việt', applyDepartment: 'Đào Tạo',
            expectedSalary: undefined, availableDate: new Date().toISOString().split('T')[0],
            education: '', degree: '', major: '', experience: '', skills: '', certificates: '',
            status: 'Mới', source: '', referredBy: '', cvUrl: '', notes: ''
        });
        setShowModal(true);
    };

    const handleEdit = (candidate: Candidate) => {
        setEditingCandidate(candidate);
        setFormData({
            name: candidate.name || '', phone: candidate.phone || '', email: candidate.email || '',
            dob: candidate.dob || '', gender: candidate.gender || 'Nam', address: candidate.address || '',
            applyPosition: candidate.applyPosition || 'Giáo Viên Việt',
            applyDepartment: candidate.applyDepartment || 'Đào Tạo',
            expectedSalary: candidate.expectedSalary, availableDate: candidate.availableDate || '',
            education: candidate.education || '', degree: candidate.degree || '',
            major: candidate.major || '', experience: candidate.experience || '',
            skills: candidate.skills?.join(', ') || '', certificates: candidate.certificates?.join(', ') || '',
            status: candidate.status || 'Mới', source: candidate.source || '',
            referredBy: candidate.referredBy || '', cvUrl: candidate.cvUrl || '', notes: candidate.notes || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone) {
            alert('Vui lòng nhập họ tên và số điện thoại!');
            return;
        }
        try {
            const data = {
                ...formData,
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
                certificates: formData.certificates ? formData.certificates.split(',').map(s => s.trim()) : [],
                createdAt: editingCandidate?.createdAt || new Date().toISOString(),
            };
            if (editingCandidate) {
                await updateCandidate(editingCandidate.id, data);
                alert('Đã cập nhật ứng viên!');
            } else {
                await createCandidate(data as Omit<Candidate, 'id'>);
                alert('Đã thêm ứng viên mới!');
            }
            setShowModal(false);
        } catch (err) {
            console.error('Error saving candidate:', err);
            alert('Có lỗi xảy ra!');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Xóa ứng viên "${name}"?`)) return;
        try {
            await deleteCandidate(id);
            alert('Đã xóa!');
        } catch (err) { alert('Lỗi!'); }
    };

    const getStatusBadge = (status: CandidateStatus) => {
        const styles: Record<CandidateStatus, string> = {
            'Mới': 'bg-blue-100 text-blue-700',
            'Đang xem xét': 'bg-yellow-100 text-yellow-700',
            'Phỏng vấn': 'bg-purple-100 text-purple-700',
            'Đạt': 'bg-green-100 text-green-700',
            'Không đạt': 'bg-red-100 text-red-700',
            'Đã tuyển': 'bg-teal-100 text-teal-700'
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

    const handleStartConvert = (candidate: Candidate) => {
        if (candidate.status === 'Đã tuyển') {
            alert('Ứng viên này đã được tuyển dụng trước đó!');
            return;
        }
        setCandidateToConvert(candidate);
        setShowConvertModal(true);
        setShowDetailModal(false);
    };

    const handleConvertToStaff = async (staffData: Partial<Staff>) => {
        if (!createStaff || !candidateToConvert) return;
        try {
            await createStaff(staffData as Omit<Staff, 'id'>);
            // Update candidate status to "Đã tuyển"
            await updateCandidate(candidateToConvert.id, { status: 'Đã tuyển' });
            alert(`Đã tuyển dụng "${candidateToConvert.name}" thành công!`);
            setShowConvertModal(false);
            setCandidateToConvert(null);
        } catch (err) {
            console.error('Error converting candidate:', err);
            alert('Có lỗi xảy ra!');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <>
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Tìm ứng viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="ALL">Tất cả trạng thái</option>
                    {CANDIDATE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleCreate} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                    <Plus size={18} /> Thêm ứng viên
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-4 py-3">STT</th>
                            <th className="px-4 py-3">Họ tên</th>
                            <th className="px-4 py-3">Liên hệ</th>
                            <th className="px-4 py-3">Vị trí ứng tuyển</th>
                            <th className="px-4 py-3">Lương mong muốn</th>
                            <th className="px-4 py-3 text-center">Trạng thái</th>
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredCandidates.length > 0 ? filteredCandidates.map((c, i) => (
                            <tr key={c.id} onClick={() => { setSelectedCandidate(c); setShowDetailModal(true); }} className="hover:bg-gray-50 cursor-pointer">
                                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                <td className="px-4 py-3">
                                    <p className="font-bold text-gray-900">{c.name}</p>
                                    <p className="text-xs text-gray-500">{formatDate(c.dob)}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1 text-blue-600"><Phone size={14} />{c.phone}</div>
                                    {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium">{c.applyPosition}</p>
                                    <p className="text-xs text-gray-500">{c.applyDepartment}</p>
                                </td>
                                <td className="px-4 py-3">{c.expectedSalary ? formatCurrency(c.expectedSalary) : '-'}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>{c.status}</span>
                                </td>
                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                        {createStaff && c.status !== 'Đã tuyển' && (
                                            <button onClick={() => handleStartConvert(c)} className="p-2 text-gray-400 hover:text-green-600" title="Tuyển dụng"><UserCheck size={16} /></button>
                                        )}
                                        <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-indigo-600" title="Sửa"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(c.id, c.name)} className="p-2 text-gray-400 hover:text-red-600" title="Xóa"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Không có ứng viên nào</td></tr>
                        )}
                    </tbody>
                </table>
                <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">Hiển thị {filteredCandidates.length} ứng viên</div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-5 border-b bg-gradient-to-r from-purple-50 to-indigo-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">{editingCandidate ? 'Chỉnh sửa ứng viên' : 'Thêm ứng viên mới'}</h3>
                                {editingCandidate && <p className="text-sm text-indigo-600">{editingCandidate.name}</p>}
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
                        </div>
                        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
                            {/* Personal Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Họ tên *</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" placeholder="Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">SĐT *</label>
                                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" placeholder="0901234567" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày sinh</label>
                                    <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Giới tính</label>
                                    <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' })}
                                        className="w-full px-3 py-2 border rounded-lg">
                                        <option>Nam</option><option>Nữ</option>
                                    </select>
                                </div>
                            </div>

                            {/* Apply Info */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3 flex items-center gap-2"><Briefcase size={16} className="text-indigo-500" />Thông tin ứng tuyển</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Vị trí ứng tuyển</label>
                                        <select value={formData.applyPosition} onChange={(e) => setFormData({ ...formData, applyPosition: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg">
                                            {APPLY_POSITIONS.map(p => <option key={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Phòng ban</label>
                                        <select value={formData.applyDepartment} onChange={(e) => setFormData({ ...formData, applyDepartment: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg">
                                            {APPLY_DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Lương mong muốn</label>
                                        <input type="number" value={formData.expectedSalary || ''} onChange={(e) => setFormData({ ...formData, expectedSalary: parseInt(e.target.value) || undefined })}
                                            className="w-full px-3 py-2 border rounded-lg" placeholder="VNĐ" step={500000} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Ngày có thể bắt đầu</label>
                                        <input type="date" value={formData.availableDate} onChange={(e) => setFormData({ ...formData, availableDate: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                </div>
                            </div>

                            {/* Education */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3 flex items-center gap-2"><GraduationCap size={16} className="text-teal-500" />Trình độ</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Học vấn</label>
                                        <input type="text" value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" placeholder="Đại học" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Bằng cấp</label>
                                        <input type="text" value={formData.degree} onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" placeholder="Cử nhân" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Chuyên ngành</label>
                                        <input type="text" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" placeholder="Sư phạm Anh" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Kinh nghiệm</label>
                                        <textarea value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="2 năm giảng dạy..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Chứng chỉ (cách bằng dấu phẩy)</label>
                                        <input type="text" value={formData.certificates} onChange={(e) => setFormData({ ...formData, certificates: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" placeholder="IELTS 7.0, TESOL" />
                                    </div>
                                </div>
                            </div>

                            {/* Status & Others */}
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as CandidateStatus })}
                                            className="w-full px-3 py-2 border rounded-lg">
                                            {CANDIDATE_STATUSES.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nguồn</label>
                                        <input type="text" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" placeholder="Facebook, TopCV..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Người giới thiệu</label>
                                        <input type="text" value={formData.referredBy} onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-sm font-medium mb-1">Link CV</label>
                                    <input type="url" value={formData.cvUrl} onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
                                </div>
                                <div className="mt-3">
                                    <label className="block text-sm font-medium mb-1">Ghi chú</label>
                                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" rows={2} />
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Hủy</button>
                            <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                {editingCandidate ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedCandidate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-5 border-b bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedCandidate.name}</h3>
                                    <p className="text-purple-100">{selectedCandidate.applyPosition} • {selectedCandidate.applyDepartment}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedCandidate.status)}`}>{selectedCandidate.status}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-5 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                            {/* Thông tin cá nhân */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                                    <User size={18} className="text-indigo-500" /> Thông tin cá nhân
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div><span className="text-gray-500">Ngày sinh:</span><p className="font-medium">{formatDate(selectedCandidate.dob) || '-'}</p></div>
                                    <div><span className="text-gray-500">Giới tính:</span><p className="font-medium">{selectedCandidate.gender || '-'}</p></div>
                                    <div><span className="text-gray-500">Địa chỉ:</span><p className="font-medium">{selectedCandidate.address || '-'}</p></div>
                                </div>
                            </div>

                            {/* Thông tin liên hệ */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                                    <Phone size={18} className="text-green-500" /> Thông tin liên hệ
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-gray-500">Số điện thoại:</span><p className="font-medium text-blue-600">{selectedCandidate.phone}</p></div>
                                    <div><span className="text-gray-500">Email:</span><p className="font-medium">{selectedCandidate.email || '-'}</p></div>
                                </div>
                            </div>

                            {/* Thông tin ứng tuyển */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                                    <Briefcase size={18} className="text-purple-500" /> Thông tin ứng tuyển
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div><span className="text-gray-500">Vị trí:</span><p className="font-medium">{selectedCandidate.applyPosition}</p></div>
                                    <div><span className="text-gray-500">Phòng ban:</span><p className="font-medium">{selectedCandidate.applyDepartment}</p></div>
                                    <div><span className="text-gray-500">Lương mong muốn:</span><p className="font-medium text-green-600">{selectedCandidate.expectedSalary ? formatCurrency(selectedCandidate.expectedSalary) : '-'}</p></div>
                                    <div><span className="text-gray-500">Ngày có thể bắt đầu:</span><p className="font-medium">{formatDate(selectedCandidate.availableDate) || '-'}</p></div>
                                    <div><span className="text-gray-500">Nguồn:</span><p className="font-medium">{selectedCandidate.source || '-'}</p></div>
                                    <div><span className="text-gray-500">Người giới thiệu:</span><p className="font-medium">{selectedCandidate.referredBy || '-'}</p></div>
                                </div>
                            </div>

                            {/* Bằng cấp, trình độ */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                                    <GraduationCap size={18} className="text-teal-500" /> Bằng cấp & Trình độ
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div><span className="text-gray-500">Trình độ học vấn:</span><p className="font-medium">{selectedCandidate.education || '-'}</p></div>
                                    <div><span className="text-gray-500">Bằng cấp:</span><p className="font-medium">{selectedCandidate.degree || '-'}</p></div>
                                    <div><span className="text-gray-500">Chuyên ngành:</span><p className="font-medium">{selectedCandidate.major || '-'}</p></div>
                                </div>
                                {selectedCandidate.experience && (
                                    <div className="mt-3">
                                        <span className="text-gray-500 text-sm">Kinh nghiệm:</span>
                                        <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedCandidate.experience}</p>
                                    </div>
                                )}
                                {selectedCandidate.certificates?.length > 0 && (
                                    <div className="mt-3">
                                        <span className="text-gray-500 text-sm">Chứng chỉ:</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {selectedCandidate.certificates.map((cert, i) => (
                                                <span key={i} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">{cert}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedCandidate.skills?.length > 0 && (
                                    <div className="mt-3">
                                        <span className="text-gray-500 text-sm">Kỹ năng:</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {selectedCandidate.skills.map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CV & Ghi chú */}
                            {(selectedCandidate.cvUrl || selectedCandidate.notes) && (
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                                        <FileText size={18} className="text-amber-500" /> Tài liệu & Ghi chú
                                    </h4>
                                    {selectedCandidate.cvUrl && (
                                        <a href={selectedCandidate.cvUrl} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm mb-2">
                                            <FileText size={16} /> Xem CV
                                        </a>
                                    )}
                                    {selectedCandidate.notes && (
                                        <div className="mt-2">
                                            <span className="text-gray-500 text-sm">Ghi chú:</span>
                                            <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedCandidate.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-5 border-t bg-gray-50 flex justify-between items-center">
                            <div>
                                {createStaff && selectedCandidate.status !== 'Đã tuyển' && (
                                    <button onClick={() => handleStartConvert(selectedCandidate)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        <UserCheck size={16} />Tuyển dụng
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setShowDetailModal(false); handleEdit(selectedCandidate); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    <Edit size={16} className="inline mr-2" />Chỉnh sửa
                                </button>
                                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Conversion Modal */}
            {showConvertModal && candidateToConvert && createStaff && (
                <StaffFormModalEnhanced
                    isOpen={showConvertModal}
                    onClose={() => { setShowConvertModal(false); setCandidateToConvert(null); }}
                    onSubmit={handleConvertToStaff}
                    candidateToConvert={candidateToConvert}
                    centerList={centerList}
                    onConvertSuccess={() => { setShowConvertModal(false); setCandidateToConvert(null); }}
                />
            )}
        </>
    );
};
