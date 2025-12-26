/**
 * Staff Form Modal - Trực quan và phù hợp với hệ thống phân quyền
 */

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Building2, Briefcase, Shield, Save, AlertCircle } from 'lucide-react';
import { Staff, StaffRole } from '../types';
import { POSITION_TO_ROLE } from '../src/services/permissionService';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Staff>) => Promise<void>;
  editingStaff?: Staff | null;
  centerList: { id: string; name: string }[];
}

// Phòng ban và vị trí theo hệ thống phân quyền
const DEPARTMENTS = [
  { id: 'Điều hành', name: 'Điều hành', color: 'red' },
  { id: 'Đào Tạo', name: 'Đào Tạo', color: 'teal' },
  { id: 'Văn phòng', name: 'Văn phòng', color: 'blue' },
  { id: 'Marketing', name: 'Marketing', color: 'purple' },
];

const POSITIONS_BY_DEPT: Record<string, { value: string; label: string; role: string; description: string }[]> = {
  'Điều hành': [
    { value: 'Quản trị viên', label: 'Quản trị viên', role: 'admin', description: 'Toàn quyền hệ thống' },
    { value: 'Quản lý', label: 'Quản lý', role: 'admin', description: 'Quản lý cơ sở' },
  ],
  'Đào Tạo': [
    { value: 'Giáo viên Việt', label: 'Giáo viên Việt', role: 'gv_viet', description: 'Chỉ xem lớp mình dạy' },
    { value: 'Giáo Viên Việt', label: 'Giáo Viên Việt', role: 'gv_viet', description: 'Chỉ xem lớp mình dạy' },
    { value: 'Giáo viên nước ngoài', label: 'Giáo viên nước ngoài', role: 'gv_nuocngoai', description: 'Chỉ xem lớp mình dạy' },
    { value: 'Giáo Viên Nước Ngoài', label: 'Giáo Viên Nước Ngoài', role: 'gv_nuocngoai', description: 'Chỉ xem lớp mình dạy' },
    { value: 'Trợ giảng', label: 'Trợ giảng', role: 'tro_giang', description: 'Chỉ xem lớp mình dạy' },
    { value: 'Trợ Giảng', label: 'Trợ Giảng', role: 'tro_giang', description: 'Chỉ xem lớp mình dạy' },
  ],
  'Văn phòng': [
    { value: 'Nhân viên', label: 'Nhân viên / CSKH / Sale', role: 'cskh', description: 'Quản lý khách hàng, tuyển sinh' },
    { value: 'CSKH', label: 'CSKH', role: 'cskh', description: 'Chăm sóc khách hàng' },
    { value: 'Sale', label: 'Sale', role: 'cskh', description: 'Tuyển sinh' },
    { value: 'Lễ tân', label: 'Lễ tân', role: 'cskh', description: 'Tiếp đón, hỗ trợ' },
    { value: 'Kế toán', label: 'Kế toán', role: 'ketoan', description: 'Quản lý tài chính, lương' },
  ],
  'Marketing': [
    { value: 'Marketing', label: 'Marketing', role: 'marketer', description: 'Quản lý chiến lược marketing' },
    { value: 'Marketer', label: 'Marketer', role: 'marketer', description: 'Thực hiện marketing' },
  ],
};

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingStaff,
  centerList,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    dob: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    address: '',
    department: 'Đào Tạo',
    position: 'Giáo viên Việt',
    branch: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [selectedRole, setSelectedRole] = useState('gv_viet');
  const [roleDescription, setRoleDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingStaff) {
      setFormData({
        name: editingStaff.name || '',
        code: editingStaff.code || '',
        phone: editingStaff.phone || '',
        email: editingStaff.email || '',
        dob: editingStaff.dob || '',
        gender: editingStaff.gender || 'Nam',
        address: editingStaff.address || '',
        department: editingStaff.department || 'Đào Tạo',
        position: editingStaff.position || 'Giáo viên Việt',
        branch: editingStaff.branch || '',
        startDate: editingStaff.startDate || '',
        status: editingStaff.status || 'Active',
      });
      
      // Determine role from position
      const role = POSITION_TO_ROLE[editingStaff.position || ''] || 'gv_viet';
      setSelectedRole(role);
      updateRoleDescription(editingStaff.department || 'Đào Tạo', editingStaff.position || '');
    } else {
      setFormData({
        name: '',
        code: `NV${Date.now().toString().slice(-6)}`,
        phone: '',
        email: '',
        dob: '',
        gender: 'Nam',
        address: '',
        department: 'Đào Tạo',
        position: 'Giáo viên Việt',
        branch: centerList.length > 0 ? centerList[0].name : '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      });
      setSelectedRole('gv_viet');
      updateRoleDescription('Đào Tạo', 'Giáo viên Việt');
    }
  }, [editingStaff, centerList, isOpen]);

  const updateRoleDescription = (dept: string, position: string) => {
    const positions = POSITIONS_BY_DEPT[dept] || [];
    const posData = positions.find(p => p.value === position);
    if (posData) {
      setSelectedRole(posData.role);
      setRoleDescription(posData.description);
    }
  };

  const handleDepartmentChange = (dept: string) => {
    setFormData({ ...formData, department: dept });
    const positions = POSITIONS_BY_DEPT[dept] || [];
    if (positions.length > 0) {
      const firstPos = positions[0];
      setFormData({ ...formData, department: dept, position: firstPos.value });
      setSelectedRole(firstPos.role);
      setRoleDescription(firstPos.description);
    }
  };

  const handlePositionChange = (position: string) => {
    setFormData({ ...formData, position });
    updateRoleDescription(formData.department, position);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      alert('Vui lòng nhập họ tên và số điện thoại!');
      return;
    }

    setSaving(true);
    try {
      // Determine primary role from position
      const primaryRole = POSITION_TO_ROLE[formData.position] || 'gv_viet';
      
      const staffData: Partial<Staff> = {
        ...formData,
        role: primaryRole as any,
        roles: [primaryRole as any],
      };

      await onSubmit(staffData);
      onClose();
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentDept = DEPARTMENTS.find(d => d.id === formData.department);
  const availablePositions = POSITIONS_BY_DEPT[formData.department] || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
              </h2>
              <p className="text-teal-100 text-sm">
                {editingStaff ? `Cập nhật thông tin ${editingStaff.name}` : 'Điền thông tin nhân viên và hệ thống sẽ tự động phân quyền'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Role Preview Card */}
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Shield className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-indigo-900 mb-1">Phân quyền tự động</h3>
                <p className="text-sm text-indigo-700 mb-2">
                  <strong>Role:</strong> {selectedRole} - {roleDescription}
                </p>
                <div className="text-xs text-indigo-600 space-y-1">
                  {selectedRole === 'admin' && (
                    <p>✓ Toàn quyền truy cập tất cả chức năng</p>
                  )}
                  {(selectedRole === 'gv_viet' || selectedRole === 'gv_nuocngoai' || selectedRole === 'tro_giang') && (
                    <>
                      <p>✓ Chỉ xem lớp mình dạy, ẩn SĐT phụ huynh</p>
                      <p>✓ Xem lương cá nhân, thang lương, KPI phòng Chuyên môn</p>
                    </>
                  )}
                  {selectedRole === 'cskh' && (
                    <>
                      <p>✓ Quản lý khách hàng, tuyển sinh, hợp đồng</p>
                      <p>✓ Không xem lương</p>
                    </>
                  )}
                  {selectedRole === 'ketoan' && (
                    <p>✓ Quản lý tài chính, lương, báo cáo</p>
                  )}
                  {selectedRole === 'marketer' && (
                    <>
                      <p>✓ Quản lý marketing, campaigns, leads</p>
                      <p>✓ Xem KPI phòng Marketing, lương cá nhân</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 pb-2 border-b">
                <User size={18} className="text-teal-500" />
                Thông tin cá nhân
              </h3>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã nhân viên
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="NV001"
                  readOnly={!!editingStaff}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="0912345678"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={2}
                    placeholder="Địa chỉ thường trú"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 pb-2 border-b">
                <Briefcase size={18} className="text-teal-500" />
                Thông tin công việc
              </h3>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DEPARTMENTS.map(dept => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleDepartmentChange(dept.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.department === dept.id
                          ? `border-${dept.color}-500 bg-${dept.color}-50 text-${dept.color}-700`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{dept.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vị trí <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {availablePositions.map(pos => (
                    <label
                      key={pos.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.position === pos.value
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="position"
                        value={pos.value}
                        checked={formData.position === pos.value}
                        onChange={(e) => handlePositionChange(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{pos.label}</div>
                        <div className="text-xs text-gray-500">{pos.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cơ sở làm việc
                </label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Chọn cơ sở</option>
                    {centerList.map(center => (
                      <option key={center.id} value={center.name}>{center.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="Active">Đang làm việc</option>
                  <option value="Inactive">Đã nghỉ việc</option>
                </select>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
              <div className="text-sm text-amber-800">
                <strong>Lưu ý:</strong> Hệ thống sẽ tự động phân quyền dựa trên vị trí công việc. 
                Nhân viên sẽ chỉ thấy các chức năng phù hợp với vai trò của mình.
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={saving}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-lg hover:from-teal-600 hover:to-emerald-700 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={18} />
                {editingStaff ? 'Cập nhật' : 'Tạo mới'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
