import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Eye, EyeOff, AlertTriangle, X, Phone, Building2, FileText, Users, DollarSign, CheckCircle, UserPlus, FileSignature, TrendingUp, Save } from 'lucide-react';
import { Staff, StaffRole, Candidate, StaffContract, SalaryScale, ContractType, ContractStatus } from '../types';
import { useStaff } from '../src/hooks/useStaff';
import { useCandidate } from '../src/hooks/useCandidate';
import { useStaffContract } from '../src/hooks/useStaffContract';
import { useSalaryScale } from '../src/hooks/useSalaryScale';
import { ImportExportButtons } from '../components/ImportExportButtons';
import { StaffFormModal } from '../components/StaffFormModal';
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
  const [activeTab, setActiveTab] = useState<'staff' | 'candidates' | 'contracts' | 'salary'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [centerList, setCenterList] = useState<{ id: string; name: string }[]>([]);

  const { staff, loading, createStaff, updateStaff, deleteStaff } = useStaff();
  const { candidates, loading: candidatesLoading, createCandidate, updateCandidate, deleteCandidate } = useCandidate();
  const { contracts, loading: contractsLoading, createContract, updateContract, deleteContract } = useStaffContract();
  const { salaryScales, loading: scalesLoading, createSalaryScale, updateSalaryScale, deleteSalaryScale } = useSalaryScale();

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
                  onClick={handleCreate}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Plus size={18} />
                  Thêm nhân viên
                </button>
              </>
            )}
            {activeTab === 'candidates' && (
              <button
                onClick={() => {/* TODO: Add candidate */ }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                Thêm ứng viên
              </button>
            )}
            {activeTab === 'contracts' && (
              <button
                onClick={() => {/* TODO: Add contract */ }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                Tạo hợp đồng
              </button>
            )}
            {activeTab === 'salary' && (
              <button
                onClick={() => {/* TODO: Add salary scale */ }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                Tạo thang lương
              </button>
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
          <button
            onClick={() => setActiveTab('salary')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'salary'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <TrendingUp size={18} />
            Thang lương ({salaryScales.length})
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
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(s)}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <UserPlus size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">Chức năng Quản lý Ứng viên</p>
          <p className="text-sm text-gray-400">Danh sách ứng viên, phỏng vấn, tuyển dụng</p>
          <p className="text-xs text-amber-600 mt-4">Đang phát triển...</p>
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <FileSignature size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">Chức năng Quản lý Hợp đồng</p>
          <p className="text-sm text-gray-400">Hợp đồng lao động, theo dõi thời hạn, gia hạn</p>
          <p className="text-xs text-amber-600 mt-4">Đang phát triển...</p>
        </div>
      )}

      {/* Salary Scale Tab */}
      {activeTab === 'salary' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Thang lương 8 bậc</h3>
              <p className="text-sm text-gray-500">
                Thiết lập hệ thống thang lương cho nhân viên văn phòng. Mỗi bậc có hệ số nhân với mức lương cơ sở.
              </p>
            </div>

            {/* Salary Scale Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {salaryScales.length > 0 ? salaryScales.map((scale) => (
                <div key={scale.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{scale.name}</h4>
                        {scale.staffName && (
                          <p className="text-sm text-indigo-600 flex items-center gap-1 mt-1">
                            <User size={14} />
                            {scale.staffName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Hiệu lực: {formatDate(scale.effectiveDate)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${scale.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {scale.status === 'Active' ? 'Đang áp dụng' : 'Không áp dụng'}
                      </span>
                    </div>
                  </div>

                  {/* Base Amount */}
                  <div className="p-4 bg-amber-50 border-b border-amber-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Mức lương bậc I (Cơ sở)</span>
                      <span className="text-lg font-bold text-amber-600">{formatCurrency(scale.baseAmount)}</span>
                    </div>
                  </div>

                  {/* Grades Table */}
                  <div className="p-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Bậc</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Hệ số</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Mức lương</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {scale.grades.map((grade) => (
                          <tr key={grade.grade} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900">Bậc {grade.grade}</td>
                            <td className="px-3 py-2 text-center text-gray-600">{grade.coefficient.toFixed(1)}</td>
                            <td className="px-3 py-2 text-right font-medium text-green-600">
                              {formatCurrency(grade.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {scale.staffId ? 'Thang lương riêng' : 'Thang lương chung'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {/* TODO: Edit */ }}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {/* TODO: Delete */ }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 text-center py-12">
                  <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">Chưa có thang lương nào</p>
                  <p className="text-sm text-gray-400">Nhấn nút "Tạo thang lương" để bắt đầu</p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <DollarSign className="text-blue-600" size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Hướng dẫn sử dụng</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>Thang lương chung:</strong> Áp dụng cho tất cả nhân viên văn phòng</li>
                    <li>• <strong>Thang lương riêng:</strong> Áp dụng cho từng nhân viên cụ thể</li>
                    <li>• <strong>Công thức:</strong> Mức lương = Hệ số × Mức lương bậc I</li>
                    <li>• <strong>Gán bậc lương:</strong> Vào tab "Nhân viên" → Chọn nhân viên → Sửa → Chọn bậc lương</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
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
      )}
    </div>
  );
};
