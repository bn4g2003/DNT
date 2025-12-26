import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Eye, EyeOff, AlertTriangle, X, Phone, Building2, FileText, Users, DollarSign, CheckCircle, UserPlus, FileSignature, TrendingUp, Save } from 'lucide-react';
import { Staff, StaffRole, Candidate, StaffContract, ContractType, ContractStatus } from '../types';
import { useStaff } from '../src/hooks/useStaff';
import { useCandidate } from '../src/hooks/useCandidate';
import { useStaffContract } from '../src/hooks/useStaffContract';

import { ImportExportButtons } from '../components/ImportExportButtons';
import { StaffFormModal } from '../components/StaffFormModal';
import { StaffFormModalEnhanced } from '../components/StaffFormModalEnhanced';
import { CandidateTab } from '../components/CandidateTab';
import { ContractTab } from '../components/ContractTab';
import { STAFF_FIELDS, STAFF_MAPPING, prepareStaffExport } from '../src/utils/excelUtils';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { formatDate } from '../src/utils/dateUtils';
import { formatCurrency } from '../src/utils/currencyUtils';

// Departments and positions based on Excel
const DEPARTMENTS = ['Điều hành', 'Đào Tạo', 'Văn phòng'];
const POSITIONS = {
  'Điều hành': ['Quản lý (Admin)'],
  'Đào Tạo': ['Giáo Viên Việt', 'Giáo Viên Nước Ngoài', 'Trợ Giảng'],
  'Văn phòng': ['Nhân viên', 'Kế toán', 'Lễ tân'],
};

// Available roles for multi-select
const AVAILABLE_ROLES: StaffRole[] = ['Giáo viên', 'Trợ giảng', 'Nhân viên', 'Sale', 'Văn phòng', 'Quản lý', 'Quản trị viên'];

export const StaffManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'candidates' | 'contracts'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [centerList, setCenterList] = useState<{ id: string; name: string }[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { staff, loading, createStaff, updateStaff, deleteStaff } = useStaff();
  const { candidates, loading: candidatesLoading, createCandidate, updateCandidate, deleteCandidate } = useCandidate();
  const { contracts, loading: contractsLoading, createContract, updateContract, deleteContract } = useStaffContract();


  // Fetch centers from Firestore
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const centersSnap = await getDocs(collection(db, 'centers'));
        const centers = centersSnap.docs
          .filter(d => d.data().status === 'Active')
          .map(d => ({
            id: d.id,
            name: d.data().name || '',
          }));
        setCenterList(centers);
      } catch (err) {
        console.error('Error fetching centers:', err);
      }
    };
    fetchCenters();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    phone: '',
    department: 'Đào Tạo',
    position: 'Giáo Viên Việt',
    roles: [] as StaffRole[],
    startDate: '',
    contractLink: '',
    username: '',
    password: '',
    status: 'Active' as 'Active' | 'Inactive',
    branch: '',
    salaryGrade: undefined as number | undefined,
    baseSalary: undefined as number | undefined,
    allowance: undefined as number | undefined,
  });

  // Normalize position name (handle variations in database)
  const normalizePosition = (pos: string): string => {
    if (!pos) return '';
    const lower = pos.toLowerCase();
    if (lower.includes('quản lý') || lower.includes('admin')) return 'Quản lý (Admin)';
    if (lower.includes('giáo viên việt') || lower === 'gv việt') return 'Giáo Viên Việt';
    if (lower.includes('nước ngoài') || lower.includes('gv ngoại') || lower.includes('foreign')) return 'Giáo Viên Nước Ngoài';
    if (lower.includes('trợ giảng')) return 'Trợ Giảng';
    if (lower.includes('kế toán')) return 'Kế toán';
    if (lower.includes('lễ tân')) return 'Lễ tân';
    if (lower.includes('nhân viên')) return 'Nhân viên';
    return pos;
  };

  // Position order for sorting (by teaching hierarchy)
  const positionOrder: Record<string, number> = {
    'Quản lý (Admin)': 1,
    'Giáo Viên Việt': 2,
    'Giáo Viên Nước Ngoài': 3,
    'Trợ Giảng': 4,
    'Kế toán': 5,
    'Nhân viên': 6,
    'Lễ tân': 7,
  };

  // Filter and sort staff by position
  const filteredStaff = useMemo(() => {
    return staff
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.phone?.includes(searchTerm) ||
          s.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDepartment === 'ALL' || s.department === filterDepartment;
        const matchesBranch = filterBranch === 'ALL' || s.branch === filterBranch;
        return matchesSearch && matchesDept && matchesBranch;
      })
      .sort((a, b) => {
        // Sort by position (normalized)
        const posA = positionOrder[normalizePosition(a.position || '')] || 99;
        const posB = positionOrder[normalizePosition(b.position || '')] || 99;
        if (posA !== posB) return posA - posB;

        // Then sort by name
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [staff, searchTerm, filterDepartment, filterBranch]);

  // Open create modal
  const handleCreate = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      dob: '',
      phone: '',
      department: 'Đào Tạo',
      position: 'Giáo Viên Việt',
      roles: [],
      startDate: new Date().toISOString().split('T')[0],
      contractLink: '',
      username: '',
      password: '',
      status: 'Active',
      branch: centerList.length > 0 ? centerList[0].name : '',
      salaryGrade: undefined,
      baseSalary: undefined,
      allowance: undefined,
    });
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      dob: staffMember.dob || '',
      phone: staffMember.phone || '',
      department: staffMember.department || 'Đào Tạo',
      position: staffMember.position || 'Giáo Viên Việt',
      roles: staffMember.roles || (staffMember.role ? [staffMember.role] : []),
      startDate: staffMember.startDate || '',
      contractLink: '',
      username: '',
      password: '',
      status: staffMember.status || 'Active',
      branch: staffMember.branch || '',
      salaryGrade: staffMember.salaryGrade,
      baseSalary: staffMember.baseSalary,
      allowance: staffMember.allowance,
    });
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      alert('Vui lòng nhập họ tên và số điện thoại!');
      return;
    }

    try {
      // Determine primary role from position or roles array
      const primaryRole = formData.roles.length > 0 ? formData.roles[0] :
        formData.position.includes('Giáo Viên') ? 'Giáo viên' :
          formData.position === 'Trợ Giảng' ? 'Trợ giảng' :
            formData.position === 'Quản lý (Admin)' ? 'Quản lý' : 'Nhân viên';

      const staffData = {
        name: formData.name,
        code: editingStaff?.code || `NV${Date.now().toString().slice(-6)}`,
        dob: formData.dob,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        role: primaryRole,
        roles: formData.roles.length > 0 ? formData.roles : [primaryRole],
        startDate: formData.startDate,
        status: formData.status,
        branch: formData.branch,
      };

      if (editingStaff) {
        await updateStaff(editingStaff.id, staffData);
        alert('Đã cập nhật nhân viên!');
      } else {
        await createStaff(staffData as Omit<Staff, 'id'>);
        alert('Đã thêm nhân viên mới!');
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving staff:', err);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên "${name}"?`)) return;

    try {
      await deleteStaff(id);
      alert('Đã xóa nhân viên!');
    } catch (err) {
      console.error('Error deleting staff:', err);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  // Import staff from Excel
  const handleImportStaff = async (data: Record<string, any>[]): Promise<{ success: number; errors: string[] }> => {
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name) {
          errors.push(`Dòng ${i + 1}: Thiếu họ tên`);
          continue;
        }
        await createStaff({
          name: row.name,
          code: row.code || `NV${Date.now()}${i}`,
          position: row.position || 'Nhân viên',
          department: row.department || 'Văn phòng',
          phone: row.phone || '',
          email: row.email || '',
          dob: row.dob || '',
          address: row.address || '',
          startDate: row.startDate || new Date().toISOString().split('T')[0],
          status: row.status || 'Active',
          roles: [],
        } as any);
        success++;
      } catch (err: any) {
        errors.push(`Dòng ${i + 1} (${row.name}): ${err.message || 'Lỗi'}`);
      }
    }
    return { success, errors };
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Get department badge color
  const getDeptBadge = (dept?: string) => {
    switch (dept) {
      case 'Điều hành': return 'bg-red-500';
      case 'Đào Tạo': return 'bg-teal-500';
      case 'Văn phòng': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Quản lý Nhân sự</h2>
            <p className="text-sm text-gray-500">Nhân viên, Ứng viên, Hợp đồng, Thang lương</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'staff' && (
              <>
                <ImportExportButtons
                  data={staff}
                  prepareExport={prepareStaffExport}
                  exportFileName="DanhSachNhanVien"
                  fields={STAFF_FIELDS}
                  mapping={STAFF_MAPPING}
                  onImport={handleImportStaff}
                  templateFileName="MauNhapNhanVien"
                  entityName="nhân viên"
                />
                <button
                  onClick={() => { setEditingStaff(null); setShowEnhancedModal(true); }}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Plus size={18} />
                  Thêm nhân viên
                </button>
              </>
            )}

          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'staff'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <Users size={18} />
            Nhân viên ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'candidates'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <UserPlus size={18} />
            Ứng viên ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'contracts'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <FileSignature size={18} />
            Hợp đồng ({contracts.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'staff' && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="ALL">Tất cả phòng ban</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="ALL">Tất cả cơ sở</option>
              {centerList.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-4 w-16">STT</th>
                  <th className="px-6 py-4">Họ tên</th>
                  <th className="px-6 py-4">SĐT</th>
                  <th className="px-6 py-4 text-center">Phòng ban</th>
                  <th className="px-6 py-4">Vị trí</th>
                  <th className="px-6 py-4">Cơ sở</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.length > 0 ? filteredStaff.map((s, index) => (
                  <tr key={s.id} onClick={() => { setSelectedStaff(s); setShowDetailModal(true); }} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(s.dob)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`tel:${s.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                        <Phone size={14} /> {s.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap ${getDeptBadge(s.department)}`}>
                        {s.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">{normalizePosition(s.position || '')}</td>
                    <td className="px-6 py-4">
                      {s.branch ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                          <Building2 size={14} className="text-gray-400" />
                          {s.branch}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(s.roles?.length ? s.roles : [s.role]).map((role, i) => (
                          <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingStaff(s); setShowEnhancedModal(true); }}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      Không có nhân viên nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                Hiển thị {filteredStaff.length} nhân viên
              </span>
            </div>
          </div>
        </>
      )}

      {/* Candidates Tab */}
      {activeTab === 'candidates' && (
        <CandidateTab
          candidates={candidates}
          loading={candidatesLoading}
          createCandidate={createCandidate}
          updateCandidate={updateCandidate}
          deleteCandidate={deleteCandidate}
          createStaff={createStaff}
          centerList={centerList}
        />
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <ContractTab
          contracts={contracts}
          staff={staff}
          loading={contractsLoading}
          createContract={createContract}
          updateContract={updateContract}
          deleteContract={deleteContract}
        />
      )}



      {/* Create/Edit Modal */}
      {
        showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-50 to-teal-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingStaff ? 'Chỉnh sửa nhân viên' : 'Tạo mới nhân viên'}
                  </h3>
                  {editingStaff && <p className="text-sm text-teal-600">{editingStaff.name} - {editingStaff.code}</p>}
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={22} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nhập họ tên đầy đủ"
                  />
                </div>

                {/* DOB & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sinh nhật</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SĐT *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0901234567"
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phòng ban</label>
                  <div className="flex gap-4">
                    {DEPARTMENTS.map(dept => (
                      <label key={dept} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="department"
                          checked={formData.department === dept}
                          onChange={() => setFormData({
                            ...formData,
                            department: dept,
                            position: POSITIONS[dept as keyof typeof POSITIONS]?.[0] || ''
                          })}
                          className="text-indigo-600"
                        />
                        {dept}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Position & Branch */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {(POSITIONS[formData.department as keyof typeof POSITIONS] || []).map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cơ sở làm việc</label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Chọn cơ sở --</option>
                      {centerList.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Multiple Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò (có thể chọn nhiều)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-2 grid grid-cols-2 gap-2">
                    {AVAILABLE_ROLES.map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, roles: [...formData.roles, role] });
                            } else {
                              setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) });
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600"
                        />
                        <span className="text-sm">{role}</span>
                      </label>
                    ))}
                  </div>
                  {formData.roles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Đã chọn: {formData.roles.join(', ')}</p>
                  )}
                </div>

                {/* Start Date & Contract Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu làm việc</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Hợp đồng</label>
                    <input
                      type="text"
                      value={formData.contractLink}
                      onChange={(e) => setFormData({ ...formData, contractLink: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="URL..."
                    />
                  </div>
                </div>

                {/* Salary Information */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Thông tin lương (Nhân viên văn phòng)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bậc lương</label>
                      <select
                        value={formData.salaryGrade || ''}
                        onChange={(e) => setFormData({ ...formData, salaryGrade: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Chọn bậc --</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(grade => (
                          <option key={grade} value={grade}>Bậc {grade}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lương cơ bản (VNĐ)</label>
                      <input
                        type="number"
                        value={formData.baseSalary || ''}
                        onChange={(e) => setFormData({ ...formData, baseSalary: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                        step={100000}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phụ cấp (VNĐ)</label>
                      <input
                        type="number"
                        value={formData.allowance || ''}
                        onChange={(e) => setFormData({ ...formData, allowance: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                        step={50000}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Áp dụng cho nhân viên văn phòng. Giáo viên/Trợ giảng cấu hình lương tại trang "Cấu hình lương GV/TG"
                  </p>
                </div>

                {/* Login Credentials */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Thông tin đăng nhập</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs p-2 rounded flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Vui lòng chọn mật khẩu không liên quan đến thông tin cá nhân!
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingStaff ? 'Cập nhật' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Staff Detail Modal */}
      {
        showDetailModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-5 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedStaff.name}</h3>
                    <p className="text-indigo-100">{selectedStaff.code} • {selectedStaff.position}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${selectedStaff.status === 'Active' ? 'bg-green-400 text-green-900' : 'bg-gray-400 text-gray-900'}`}>
                      {selectedStaff.status === 'Active' ? 'Đang làm việc' : 'Đã nghỉ việc'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                {/* Thông tin lý lịch */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                    <User size={18} className="text-indigo-500" /> Thông tin lý lịch
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">Ngày sinh:</span><p className="font-medium">{selectedStaff.dob ? new Date(selectedStaff.dob).toLocaleDateString('vi-VN') : '-'}</p></div>
                    <div><span className="text-gray-500">Giới tính:</span><p className="font-medium">{selectedStaff.gender || '-'}</p></div>
                    <div><span className="text-gray-500">CCCD/CMND:</span><p className="font-medium">{selectedStaff.idNumber || '-'}</p></div>
                    <div><span className="text-gray-500">Ngày cấp:</span><p className="font-medium">{selectedStaff.idIssueDate ? new Date(selectedStaff.idIssueDate).toLocaleDateString('vi-VN') : '-'}</p></div>
                    <div><span className="text-gray-500">Nơi cấp:</span><p className="font-medium">{selectedStaff.idIssuePlace || '-'}</p></div>
                    <div><span className="text-gray-500">Địa chỉ:</span><p className="font-medium">{selectedStaff.address || '-'}</p></div>
                    <div className="col-span-2"><span className="text-gray-500">Địa chỉ thường trú:</span><p className="font-medium">{selectedStaff.permanentAddress || '-'}</p></div>
                  </div>
                </div>

                {/* Thông tin liên hệ */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                    <Phone size={18} className="text-green-500" /> Thông tin liên hệ
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">Số điện thoại:</span><p className="font-medium text-blue-600">{selectedStaff.phone || '-'}</p></div>
                    <div><span className="text-gray-500">Email:</span><p className="font-medium">{selectedStaff.email || '-'}</p></div>
                    <div><span className="text-gray-500">Cơ sở làm việc:</span><p className="font-medium">{selectedStaff.branch || '-'}</p></div>
                  </div>
                </div>

                {/* Bằng cấp, trình độ */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                    <FileText size={18} className="text-teal-500" /> Bằng cấp & Trình độ
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">Trình độ học vấn:</span><p className="font-medium">{selectedStaff.education || '-'}</p></div>
                    <div><span className="text-gray-500">Bằng cấp:</span><p className="font-medium">{selectedStaff.degree || '-'}</p></div>
                    <div><span className="text-gray-500">Chuyên ngành:</span><p className="font-medium">{selectedStaff.major || '-'}</p></div>
                    <div className="col-span-3">
                      <span className="text-gray-500">Chứng chỉ:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedStaff.certificates?.length ? selectedStaff.certificates.map((cert, i) => (
                          <span key={i} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">{cert}</span>
                        )) : <span className="text-gray-400">-</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vị trí & Phòng ban */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                    <Building2 size={18} className="text-blue-500" /> Vị trí công việc
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">Phòng ban:</span><p className="font-medium">{selectedStaff.department || '-'}</p></div>
                    <div><span className="text-gray-500">Vị trí:</span><p className="font-medium">{selectedStaff.position || '-'}</p></div>
                    <div><span className="text-gray-500">Ngày bắt đầu:</span><p className="font-medium">{selectedStaff.startDate ? new Date(selectedStaff.startDate).toLocaleDateString('vi-VN') : '-'}</p></div>
                    <div><span className="text-gray-500">Vai trò:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedStaff.roles?.length ? selectedStaff.roles : [selectedStaff.role]).map((role, i) => (
                          <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">{role}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lương thưởng */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                    <DollarSign size={18} className="text-amber-500" /> Thông tin lương
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-500">Bậc lương:</span><p className="font-medium">{selectedStaff.salaryGrade ? `Bậc ${selectedStaff.salaryGrade}` : '-'}</p></div>
                    <div><span className="text-gray-500">Lương cơ bản:</span><p className="font-medium text-green-600">{selectedStaff.baseSalary ? formatCurrency(selectedStaff.baseSalary) : '-'}</p></div>
                    <div><span className="text-gray-500">Phụ cấp:</span><p className="font-medium">{selectedStaff.allowance ? formatCurrency(selectedStaff.allowance) : '-'}</p></div>
                    <div><span className="text-gray-500">Loại HĐ:</span><p className="font-medium">{selectedStaff.currentContractType || '-'}</p></div>
                  </div>
                </div>

                {/* Thông tin ngân hàng */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                    <CheckCircle size={18} className="text-purple-500" /> Thông tin khác
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">Số tài khoản:</span><p className="font-medium">{selectedStaff.bankAccount || '-'}</p></div>
                    <div><span className="text-gray-500">Ngân hàng:</span><p className="font-medium">{selectedStaff.bankName || '-'}</p></div>
                    <div><span className="text-gray-500">Mã số thuế:</span><p className="font-medium">{selectedStaff.taxCode || '-'}</p></div>
                    <div><span className="text-gray-500">Số bảo hiểm:</span><p className="font-medium">{selectedStaff.insuranceNumber || '-'}</p></div>
                  </div>
                </div>

                {selectedStaff.notes && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Ghi chú</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedStaff.notes}</p>
                  </div>
                )}
              </div>
              <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                <button onClick={() => { setShowDetailModal(false); setEditingStaff(selectedStaff); setShowEnhancedModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Edit size={16} className="inline mr-2" />Chỉnh sửa
                </button>
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Đóng</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Enhanced Staff Form Modal */}
      {
        showEnhancedModal && (
          <StaffFormModalEnhanced
            isOpen={showEnhancedModal}
            onClose={() => { setShowEnhancedModal(false); setEditingStaff(null); }}
            onSubmit={async (data) => {
              if (editingStaff) {
                await updateStaff(editingStaff.id, data);
                alert('Đã cập nhật nhân viên!');
              } else {
                await createStaff(data as Omit<Staff, 'id'>);
                alert('Đã thêm nhân viên mới!');
              }
            }}
            editingStaff={editingStaff}
            centerList={centerList}
          />
        )
      }
    </div >
  );
};
