import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Building2, Briefcase, Shield, Save, CreditCard, GraduationCap, FileText, DollarSign, UserCheck } from 'lucide-react';
import { Staff, StaffRole, Candidate, StaffContractType } from '../types';
import { POSITION_TO_ROLE } from '../src/services/permissionService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

interface StaffFormModalEnhancedProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Staff>) => Promise<void>;
    editingStaff?: Staff | null;
    centerList: { id: string; name: string }[];
    // For candidate conversion
    candidateToConvert?: Candidate | null;
    onConvertSuccess?: () => void;
}

const DEPARTMENTS = [
    { id: 'Điều hành', name: 'Điều hành', color: 'red' },
    { id: 'Đào Tạo', name: 'Đào Tạo', color: 'teal' },
    { id: 'Văn phòng', name: 'Văn phòng', color: 'blue' },
    { id: 'Marketing', name: 'Marketing', color: 'purple' },
];

const POSITIONS_BY_DEPT: Record<string, { value: string; label: string; role: string }[]> = {
    'Điều hành': [
        { value: 'Quản trị viên', label: 'Quản trị viên', role: 'admin' },
        { value: 'Quản lý', label: 'Quản lý', role: 'admin' },
    ],
    'Đào Tạo': [
        { value: 'Giáo viên Việt', label: 'Giáo viên Việt', role: 'gv_viet' },
        { value: 'Giáo viên nước ngoài', label: 'Giáo viên nước ngoài', role: 'gv_nuocngoai' },
        { value: 'Trợ giảng', label: 'Trợ giảng', role: 'tro_giang' },
    ],
    'Văn phòng': [
        { value: 'Nhân viên', label: 'Nhân viên / CSKH / Sale', role: 'cskh' },
        { value: 'Kế toán', label: 'Kế toán', role: 'ketoan' },
        { value: 'Lễ tân', label: 'Lễ tân', role: 'cskh' },
    ],
    'Marketing': [
        { value: 'Marketing', label: 'Marketing', role: 'marketer' },
    ],
};

const CONTRACT_TYPES: StaffContractType[] = ['Thử việc', 'Chính thức', 'Cộng tác viên', 'Thời vụ'];

export const StaffFormModalEnhanced: React.FC<StaffFormModalEnhancedProps> = ({
    isOpen, onClose, onSubmit, editingStaff, centerList, candidateToConvert, onConvertSuccess
}) => {
    const [activeSection, setActiveSection] = useState<'basic' | 'identity' | 'education' | 'salary' | 'contract'>('basic');
    const [saving, setSaving] = useState(false);
    const [globalBaseSalary, setGlobalBaseSalary] = useState<number>(1800000);

    // Fetch global salary config
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const docRef = doc(db, 'settings', 'salaryConfig');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setGlobalBaseSalary(docSnap.data().baseSalary || 1800000);
                }
            } catch (err) {
                console.error('Error fetching salary config:', err);
            }
        };
        fetchConfig();
    }, []);

    const [formData, setFormData] = useState({
        // Basic Info
        name: '', code: '', phone: '', email: '',
        dob: '', gender: 'Nam' as 'Nam' | 'Nữ',
        department: 'Đào Tạo', position: 'Giáo viên Việt',
        branch: '', startDate: new Date().toISOString().split('T')[0],
        status: 'Active' as 'Active' | 'Inactive',

        // Identity
        idNumber: '', idIssueDate: '', idIssuePlace: '',
        address: '', permanentAddress: '',

        // Bank & Tax
        bankAccount: '', bankName: '', taxCode: '', insuranceNumber: '',

        // Education
        education: '', degree: '', major: '', certificates: '',

        // Salary
        salaryCoefficient: undefined as number | undefined,
        baseSalary: undefined as number | undefined,
        allowance: undefined as number | undefined,

        // Contract
        currentContractType: 'Thử việc' as StaffContractType,
        contractStartDate: '', contractEndDate: '',

        // Notes
        notes: ''
    });

    useEffect(() => {
        if (candidateToConvert) {
            // Pre-fill from candidate data
            setFormData({
                name: candidateToConvert.name || '',
                code: `NV${Date.now().toString().slice(-6)}`,
                phone: candidateToConvert.phone || '',
                email: candidateToConvert.email || '',
                dob: candidateToConvert.dob || '',
                gender: candidateToConvert.gender || 'Nam',
                department: candidateToConvert.applyDepartment || 'Đào Tạo',
                position: candidateToConvert.applyPosition || 'Giáo viên Việt',
                branch: centerList.length > 0 ? centerList[0].name : '',
                startDate: new Date().toISOString().split('T')[0],
                status: 'Active',
                idNumber: '', idIssueDate: '', idIssuePlace: '',
                address: candidateToConvert.address || '', permanentAddress: '',
                bankAccount: '', bankName: '', taxCode: '', insuranceNumber: '',
                education: candidateToConvert.education || '',
                degree: candidateToConvert.degree || '',
                major: candidateToConvert.major || '',
                certificates: candidateToConvert.certificates?.join(', ') || '',
                salaryCoefficient: undefined,
                baseSalary: candidateToConvert.expectedSalary,
                allowance: undefined,
                currentContractType: 'Thử việc',
                contractStartDate: new Date().toISOString().split('T')[0],
                contractEndDate: '',
                notes: candidateToConvert.notes || ''
            });
        } else if (editingStaff) {
            setFormData({
                name: editingStaff.name || '', code: editingStaff.code || '',
                phone: editingStaff.phone || '', email: editingStaff.email || '',
                dob: editingStaff.dob || '', gender: editingStaff.gender || 'Nam',
                department: editingStaff.department || 'Đào Tạo',
                position: editingStaff.position || 'Giáo viên Việt',
                branch: editingStaff.branch || '', startDate: editingStaff.startDate || '',
                status: editingStaff.status || 'Active',
                idNumber: editingStaff.idNumber || '', idIssueDate: editingStaff.idIssueDate || '',
                idIssuePlace: editingStaff.idIssuePlace || '', address: editingStaff.address || '',
                permanentAddress: editingStaff.permanentAddress || '',
                bankAccount: editingStaff.bankAccount || '', bankName: editingStaff.bankName || '',
                taxCode: editingStaff.taxCode || '', insuranceNumber: editingStaff.insuranceNumber || '',
                education: editingStaff.education || '', degree: editingStaff.degree || '',
                major: editingStaff.major || '', certificates: editingStaff.certificates?.join(', ') || '',
                salaryCoefficient: editingStaff.salaryCoefficient, baseSalary: editingStaff.baseSalary,
                allowance: editingStaff.allowance,
                currentContractType: editingStaff.currentContractType || 'Thử việc',
                contractStartDate: editingStaff.contractStartDate || '',
                contractEndDate: editingStaff.contractEndDate || '',
                notes: editingStaff.notes || ''
            });
        } else {
            setFormData({
                name: '', code: `NV${Date.now().toString().slice(-6)}`, phone: '', email: '',
                dob: '', gender: 'Nam', department: 'Đào Tạo', position: 'Giáo viên Việt',
                branch: centerList.length > 0 ? centerList[0].name : '',
                startDate: new Date().toISOString().split('T')[0], status: 'Active',
                idNumber: '', idIssueDate: '', idIssuePlace: '', address: '', permanentAddress: '',
                bankAccount: '', bankName: '', taxCode: '', insuranceNumber: '',
                education: '', degree: '', major: '', certificates: '',
                salaryCoefficient: undefined, baseSalary: undefined, allowance: undefined,
                currentContractType: 'Thử việc', contractStartDate: '', contractEndDate: '',
                notes: ''
            });
        }
        setActiveSection('basic');
    }, [editingStaff, candidateToConvert, centerList, isOpen]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone) {
            alert('Vui lòng nhập họ tên và số điện thoại!');
            return;
        }
        setSaving(true);
        try {
            const primaryRole = POSITION_TO_ROLE[formData.position] || 'gv_viet';

            // Build staff data object, excluding undefined values
            const staffData: Partial<Staff> = {
                name: formData.name,
                code: formData.code,
                phone: formData.phone,
                email: formData.email || '',
                dob: formData.dob || '',
                gender: formData.gender,
                department: formData.department,
                position: formData.position,
                branch: formData.branch || '',
                startDate: formData.startDate || '',
                status: formData.status,
                idNumber: formData.idNumber || '',
                idIssueDate: formData.idIssueDate || '',
                idIssuePlace: formData.idIssuePlace || '',
                address: formData.address || '',
                permanentAddress: formData.permanentAddress || '',
                bankAccount: formData.bankAccount || '',
                bankName: formData.bankName || '',
                taxCode: formData.taxCode || '',
                insuranceNumber: formData.insuranceNumber || '',
                education: formData.education || '',
                degree: formData.degree || '',
                major: formData.major || '',
                certificates: formData.certificates ? formData.certificates.split(',').map(s => s.trim()) : [],
                currentContractType: formData.currentContractType,
                contractStartDate: formData.contractStartDate || '',
                contractEndDate: formData.contractEndDate || '',
                notes: formData.notes || '',
                role: primaryRole as any,
                roles: [primaryRole as any],
            };

            // Only add numeric fields if they have values
            if (formData.salaryCoefficient !== undefined && formData.salaryCoefficient !== null) {
                staffData.salaryCoefficient = formData.salaryCoefficient;
            }
            if (formData.baseSalary !== undefined && formData.baseSalary !== null) {
                staffData.baseSalary = formData.baseSalary;
            }
            if (formData.allowance !== undefined && formData.allowance !== null) {
                staffData.allowance = formData.allowance;
            }

            await onSubmit(staffData);
            if (candidateToConvert && onConvertSuccess) onConvertSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving staff:', error);
            alert('Có lỗi xảy ra!');
        } finally { setSaving(false); }
    };

    if (!isOpen) return null;

    const sections = [
        { id: 'basic', label: 'Thông tin cơ bản', icon: User },
        { id: 'identity', label: 'CCCD & Địa chỉ', icon: CreditCard },
        { id: 'education', label: 'Bằng cấp', icon: GraduationCap },
        { id: 'salary', label: 'Lương & Ngân hàng', icon: DollarSign },
        { id: 'contract', label: 'Hợp đồng', icon: FileText },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className={`p-5 text-white ${candidateToConvert ? 'bg-gradient-to-r from-green-500 to-teal-600' : 'bg-gradient-to-r from-teal-500 to-emerald-600'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            {candidateToConvert && <UserCheck size={28} />}
                            <div>
                                <h2 className="text-xl font-bold">
                                    {candidateToConvert ? 'Xác nhận tuyển dụng ứng viên' : editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                                </h2>
                                <p className="text-teal-100 text-sm">
                                    {candidateToConvert ? `Chuyển "${candidateToConvert.name}" thành nhân viên chính thức` : 'Điền đầy đủ thông tin nhân viên'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white"><X size={24} /></button>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="flex border-b bg-gray-50 overflow-x-auto">
                    {sections.map(sec => (
                        <button key={sec.id} onClick={() => setActiveSection(sec.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors
                ${activeSection === sec.id ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-gray-600 hover:text-gray-900'}`}>
                            <sec.icon size={16} /> {sec.label}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                    {/* Basic Info */}
                    {activeSection === 'basic' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Họ tên <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mã NV</label>
                                    <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg bg-gray-50" readOnly={!!editingStaff} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">SĐT <span className="text-red-500">*</span></label>
                                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" placeholder="0912345678" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" placeholder="email@example.com" />
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phòng ban</label>
                                    <select value={formData.department} onChange={(e) => {
                                        const dept = e.target.value;
                                        const pos = POSITIONS_BY_DEPT[dept]?.[0]?.value || '';
                                        setFormData({ ...formData, department: dept, position: pos });
                                    }} className="w-full px-3 py-2 border rounded-lg">
                                        {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vị trí</label>
                                    <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg">
                                        {(POSITIONS_BY_DEPT[formData.department] || []).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cơ sở</label>
                                    <select value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg">
                                        <option value="">-- Chọn --</option>
                                        {centerList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                                        className="w-full px-3 py-2 border rounded-lg">
                                        <option value="Active">Đang làm việc</option>
                                        <option value="Inactive">Đã nghỉ việc</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Identity */}
                    {activeSection === 'identity' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Số CCCD/CMND</label>
                                    <input type="text" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" placeholder="024123456789" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày cấp</label>
                                    <input type="date" value={formData.idIssueDate} onChange={(e) => setFormData({ ...formData, idIssueDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nơi cấp</label>
                                    <input type="text" value={formData.idIssuePlace} onChange={(e) => setFormData({ ...formData, idIssuePlace: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" placeholder="Cục CS ĐKQL Cư trú và DLQG về DC" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Địa chỉ hiện tại</label>
                                    <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Số nhà, đường, phường/xã..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Địa chỉ thường trú</label>
                                    <textarea value={formData.permanentAddress} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Số nhà, đường, phường/xã..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {activeSection === 'education' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Trình độ học vấn</label>
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
                            <div className="pt-4 border-t">
                                <label className="block text-sm font-medium mb-1">Chứng chỉ (cách nhau bằng dấu phẩy)</label>
                                <input type="text" value={formData.certificates} onChange={(e) => setFormData({ ...formData, certificates: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg" placeholder="IELTS 7.0, TESOL, TKT..." />
                            </div>
                        </div>
                    )}

                    {/* Salary */}
                    {activeSection === 'salary' && (
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-800 flex items-center gap-2"><DollarSign size={16} className="text-green-500" />Thông tin lương</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hệ số lương (Max 8.0)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="8"
                                        value={formData.salaryCoefficient || ''}
                                        onChange={(e) => {
                                            let val = parseFloat(e.target.value);
                                            if (isNaN(val)) val = 0;
                                            if (val > 8) {
                                                alert('Hệ số lương tối đa là 8.0');
                                                val = 8;
                                            }
                                            const newBaseSalary = Math.round(val * globalBaseSalary);
                                            setFormData({
                                                ...formData,
                                                salaryCoefficient: val || undefined,
                                                baseSalary: newBaseSalary
                                            });
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="VD: 2.34"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Lương cơ bản (VNĐ)</label>
                                    <input type="number" value={formData.baseSalary || ''} onChange={(e) => setFormData({ ...formData, baseSalary: parseInt(e.target.value) || undefined })}
                                        className="w-full px-3 py-2 border rounded-lg" step={500000} placeholder="10000000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phụ cấp (VNĐ)</label>
                                    <input type="number" value={formData.allowance || ''} onChange={(e) => setFormData({ ...formData, allowance: parseInt(e.target.value) || undefined })}
                                        className="w-full px-3 py-2 border rounded-lg" step={100000} placeholder="1000000" />
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-3"><CreditCard size={16} className="text-blue-500" />Thông tin ngân hàng & Bảo hiểm</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Số tài khoản</label>
                                        <input type="text" value={formData.bankAccount} onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" placeholder="0123456789" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Ngân hàng</label>
                                        <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" placeholder="Vietcombank" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Mã số thuế</label>
                                        <input type="text" value={formData.taxCode} onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Số bảo hiểm XH</label>
                                        <input type="text" value={formData.insuranceNumber} onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contract */}
                    {activeSection === 'contract' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Loại hợp đồng</label>
                                    <select value={formData.currentContractType} onChange={(e) => setFormData({ ...formData, currentContractType: e.target.value as StaffContractType })}
                                        className="w-full px-3 py-2 border rounded-lg">
                                        {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày bắt đầu HĐ</label>
                                    <input type="date" value={formData.contractStartDate} onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày kết thúc HĐ</label>
                                    <input type="date" value={formData.contractEndDate} onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <label className="block text-sm font-medium mb-1">Ghi chú</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Ghi chú thêm về nhân viên..." />
                            </div>
                            {candidateToConvert && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                                    <p className="text-green-800 text-sm">
                                        <strong>Lưu ý:</strong> Sau khi xác nhận, ứng viên "{candidateToConvert.name}" sẽ được chuyển thành nhân viên chính thức
                                        và trạng thái ứng viên sẽ được cập nhật thành "Đã tuyển".
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        {activeSection !== 'basic' && (
                            <button onClick={() => {
                                const idx = sections.findIndex(s => s.id === activeSection);
                                if (idx > 0) setActiveSection(sections[idx - 1].id as any);
                            }} className="text-teal-600 hover:underline">← Quay lại</button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100" disabled={saving}>Hủy</button>
                        {activeSection !== 'contract' ? (
                            <button onClick={() => {
                                const idx = sections.findIndex(s => s.id === activeSection);
                                if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id as any);
                            }} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                                Tiếp theo →
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={saving}
                                className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg ${candidateToConvert ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'} disabled:opacity-50`}>
                                {saving ? <span className="animate-spin">⏳</span> : <Save size={18} />}
                                {candidateToConvert ? 'Xác nhận tuyển dụng' : editingStaff ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
