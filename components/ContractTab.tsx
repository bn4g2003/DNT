import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, X, Calendar, AlertTriangle, FileSignature, User, Clock, CheckCircle } from 'lucide-react';
import { Staff, StaffContract, StaffContractType, StaffContractStatus } from '../types';
import { formatCurrency } from '../src/utils/currencyUtils';

interface ContractTabProps {
    contracts: StaffContract[];
    staff: Staff[];
    loading: boolean;
    createContract: (data: Omit<StaffContract, 'id'>) => Promise<string>;
    updateContract: (id: string, data: Partial<StaffContract>) => Promise<void>;
    deleteContract: (id: string) => Promise<void>;
}

const CONTRACT_TYPES: StaffContractType[] = ['Thử việc', 'Chính thức', 'Cộng tác viên', 'Thời vụ'];
const CONTRACT_STATUSES: StaffContractStatus[] = ['Đang hiệu lực', 'Hết hạn', 'Đã chấm dứt'];

export const ContractTab: React.FC<ContractTabProps> = ({
    contracts, staff, loading, createContract, updateContract, deleteContract
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [editingContract, setEditingContract] = useState<StaffContract | null>(null);

    const [formData, setFormData] = useState({
        staffId: '', contractNumber: '', contractType: 'Thử việc' as StaffContractType,
        status: 'Đang hiệu lực' as StaffContractStatus,
        startDate: '', endDate: '', position: '', department: '',
        baseSalary: 0, allowance: 0, probationSalary: 0,
        workingHours: '8:00 - 17:30', benefits: '', terms: '',
        signedDate: '', signedBy: '', notes: ''
    });

    // Calculate days until expiry
    const getDaysUntilExpiry = (endDate?: string) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Filter and enrich contracts
    const filteredContracts = useMemo(() => {
        return contracts
            .map(c => ({
                ...c,
                daysUntilExpiry: getDaysUntilExpiry(c.endDate),
                staffInfo: staff.find(s => s.id === c.staffId)
            }))
            .filter(c => {
                const matchSearch = c.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchType = filterType === 'ALL' || c.contractType === filterType;
                const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
                return matchSearch && matchType && matchStatus;
            })
            .sort((a, b) => {
                // Sort by expiry date - contracts expiring soon first
                if (a.daysUntilExpiry !== null && b.daysUntilExpiry !== null) {
                    return a.daysUntilExpiry - b.daysUntilExpiry;
                }
                return 0;
            });
    }, [contracts, staff, searchTerm, filterType, filterStatus]);

    const handleCreate = () => {
        setEditingContract(null);
        const today = new Date().toISOString().split('T')[0];
        setFormData({
            staffId: staff.length > 0 ? staff[0].id : '',
            contractNumber: `HD${Date.now().toString().slice(-8)}`,
            contractType: 'Thử việc', status: 'Đang hiệu lực',
            startDate: today, endDate: '', position: '', department: '',
            baseSalary: 0, allowance: 0, probationSalary: 0,
            workingHours: '8:00 - 17:30', benefits: '', terms: '',
            signedDate: today, signedBy: '', notes: ''
        });
        setShowModal(true);
    };

    const handleEdit = (contract: StaffContract) => {
        setEditingContract(contract);
        setFormData({
            staffId: contract.staffId || '',
            contractNumber: contract.contractNumber || '',
            contractType: contract.contractType || 'Thử việc',
            status: contract.status || 'Đang hiệu lực',
            startDate: contract.startDate || '',
            endDate: contract.endDate || '',
            position: contract.position || '',
            department: contract.department || '',
            baseSalary: contract.baseSalary || 0,
            allowance: contract.allowance || 0,
            probationSalary: contract.probationSalary || 0,
            workingHours: contract.workingHours || '',
            benefits: contract.benefits || '',
            terms: contract.terms || '',
            signedDate: contract.signedDate || '',
            signedBy: contract.signedBy || '',
            notes: contract.notes || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.staffId || !formData.contractNumber) {
            alert('Vui lòng chọn nhân viên và nhập số hợp đồng!');
            return;
        }
        try {
            const selectedStaff = staff.find(s => s.id === formData.staffId);
            const data = {
                ...formData,
                staffName: selectedStaff?.name || '',
                staffCode: selectedStaff?.code || '',
                createdAt: editingContract?.createdAt || new Date().toISOString(),
            };
            if (editingContract) {
                await updateContract(editingContract.id, data);
                alert('Đã cập nhật hợp đồng!');
            } else {
                await createContract(data as Omit<StaffContract, 'id'>);
                alert('Đã tạo hợp đồng mới!');
            }
            setShowModal(false);
        } catch (err) {
            console.error('Error saving contract:', err);
            alert('Có lỗi xảy ra!');
        }
    };

    const handleDelete = async (id: string, num: string) => {
        if (!confirm(`Xóa hợp đồng "${num}"?`)) return;
        try {
            await deleteContract(id);
            alert('Đã xóa!');
        } catch (err) { alert('Lỗi!'); }
    };

    const getTypeBadge = (type: StaffContractType) => {
        const styles: Record<StaffContractType, string> = {
            'Thử việc': 'bg-yellow-100 text-yellow-700',
            'Chính thức': 'bg-green-100 text-green-700',
            'Cộng tác viên': 'bg-blue-100 text-blue-700',
            'Thời vụ': 'bg-purple-100 text-purple-700'
        };
        return styles[type] || 'bg-gray-100 text-gray-700';
    };

    const getStatusBadge = (status: StaffContractStatus) => {
        const styles: Record<StaffContractStatus, string> = {
            'Đang hiệu lực': 'bg-green-100 text-green-700',
            'Hết hạn': 'bg-red-100 text-red-700',
            'Đã chấm dứt': 'bg-gray-100 text-gray-700'
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';

    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    // Count expiring soon
    const expiringSoonCount = filteredContracts.filter(c => c.daysUntilExpiry !== null && c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 30).length;

    return (
        <>
            {/* Alert for expiring contracts */}
            {expiringSoonCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="text-amber-600" size={24} />
                    <div>
                        <p className="font-medium text-amber-800">Có {expiringSoonCount} hợp đồng sắp hết hạn trong 30 ngày tới</p>
                        <p className="text-sm text-amber-600">Vui lòng kiểm tra và gia hạn nếu cần</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Tìm theo tên NV, số HĐ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="ALL">Tất cả loại</option>
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="ALL">Tất cả trạng thái</option>
                    {CONTRACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleCreate} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                    <Plus size={18} /> Tạo hợp đồng
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Số HĐ</th>
                            <th className="px-4 py-3">Nhân viên</th>
                            <th className="px-4 py-3">Loại</th>
                            <th className="px-4 py-3">Thời hạn</th>
                            <th className="px-4 py-3">Lương</th>
                            <th className="px-4 py-3 text-center">Trạng thái</th>
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredContracts.length > 0 ? filteredContracts.map((c) => {
                            const isExpiringSoon = c.daysUntilExpiry !== null && c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 30;
                            const isExpired = c.daysUntilExpiry !== null && c.daysUntilExpiry < 0;
                            return (
                                <tr key={c.id} className={`hover:bg-gray-50 ${isExpiringSoon ? 'bg-amber-50' : ''} ${isExpired ? 'bg-red-50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-gray-900">{c.contractNumber}</p>
                                        <p className="text-xs text-gray-500">Ký: {formatDate(c.signedDate)}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <User size={16} className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{c.staffName}</p>
                                                <p className="text-xs text-gray-500">{c.staffCode}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(c.contractType)}`}>{c.contractType}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm">{formatDate(c.startDate)} - {formatDate(c.endDate)}</p>
                                        {c.daysUntilExpiry !== null && (
                                            <p className={`text-xs ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-500'}`}>
                                                {isExpired ? `Đã hết ${Math.abs(c.daysUntilExpiry)} ngày` :
                                                    c.daysUntilExpiry === 0 ? 'Hết hạn hôm nay' :
                                                        `Còn ${c.daysUntilExpiry} ngày`}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-green-600">{formatCurrency(c.baseSalary)}</p>
                                        {c.allowance > 0 && <p className="text-xs text-gray-500">+{formatCurrency(c.allowance)} phụ cấp</p>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>{c.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-indigo-600" title="Sửa"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(c.id, c.contractNumber)} className="p-2 text-gray-400 hover:text-red-600" title="Xóa"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Không có hợp đồng nào</td></tr>
                        )}
                    </tbody>
                </table>
                <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">Hiển thị {filteredContracts.length} hợp đồng</div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-5 border-b bg-gradient-to-r from-teal-50 to-green-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">{editingContract ? 'Chỉnh sửa hợp đồng' : 'Tạo hợp đồng mới'}</h3>
                                {editingContract && <p className="text-sm text-teal-600">{editingContract.contractNumber}</p>}
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
                        </div>
                        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
                            {/* Staff & Contract Number */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nhân viên *</label>
                                    <select value={formData.staffId} onChange={(e) => {
                                        const s = staff.find(st => st.id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            staffId: e.target.value,
                                            position: s?.position || '',
                                            department: s?.department || '',
                                            baseSalary: s?.baseSalary || 0,
                                            allowance: s?.allowance || 0
                                        });
                                    }} className="w-full px-3 py-2 border rounded-lg">
                                        <option value="">-- Chọn nhân viên --</option>
                                        {staff.filter(s => s.status === 'Active').map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Số hợp đồng *</label>
                                    <input type="text" value={formData.contractNumber} onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>

                            {/* Type & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Loại hợp đồng</label>
                                    <select value={formData.contractType} onChange={(e) => setFormData({ ...formData, contractType: e.target.value as StaffContractType })}
                                        className="w-full px-3 py-2 border rounded-lg">
                                        {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffContractStatus })}
                                        className="w-full px-3 py-2 border rounded-lg">
                                        {CONTRACT_STATUSES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                                    <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày ký</label>
                                    <input type="date" value={formData.signedDate} onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>

                            {/* Position & Department */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vị trí</label>
                                    <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phòng ban</label>
                                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>

                            {/* Salary */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Thông tin lương</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Lương cơ bản</label>
                                        <input type="number" value={formData.baseSalary} onChange={(e) => setFormData({ ...formData, baseSalary: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-lg" step={500000} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Phụ cấp</label>
                                        <input type="number" value={formData.allowance} onChange={(e) => setFormData({ ...formData, allowance: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-lg" step={100000} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Lương thử việc</label>
                                        <input type="number" value={formData.probationSalary} onChange={(e) => setFormData({ ...formData, probationSalary: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-lg" step={500000} />
                                    </div>
                                </div>
                            </div>

                            {/* Other Info */}
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Giờ làm việc</label>
                                        <input type="text" value={formData.workingHours} onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" placeholder="8:00 - 17:30" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Người ký</label>
                                        <input type="text" value={formData.signedBy} onChange={(e) => setFormData({ ...formData, signedBy: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-sm font-medium mb-1">Quyền lợi</label>
                                    <textarea value={formData.benefits} onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="BHXH, BHYT, du lịch..." />
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
                                {editingContract ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
