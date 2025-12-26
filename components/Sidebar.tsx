
import React, { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Briefcase,
  UserCog,
  DollarSign,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { MenuItem } from '../types';
import { usePermissions } from '../src/hooks/usePermissions';
import { useAuth } from '../src/hooks/useAuth';
import { ModuleKey } from '../src/services/permissionService';

// Map subItem id to ModuleKey for permission checking
const subItemToModule: Record<string, ModuleKey> = {
  'classes': 'classes',
  'courses': 'classes',
  'resources': 'classes',
  'schedule': 'schedule',
  'holidays': 'holidays',
  'attendance': 'attendance',
  'tutoring': 'tutoring',
  'homework': 'homework',
  'attendance-history': 'attendance_history',
  'enrollment-history': 'enrollment_history',
  'students': 'students',
  'parents': 'parents',
  'dropped': 'students_dropped',
  'reserved': 'students_reserved',
  'feedback': 'feedback',
  'surveys': 'feedback',
  'trial': 'students_trial',
  'service-dashboard': 'service_dashboard',
  'leads': 'leads',
  'campaigns': 'campaigns',
  'marketing-tasks': 'marketing_tasks',
  'marketing-kpi': 'marketing_kpi',
  'marketing-platforms': 'marketing_platforms',
  'staff': 'staff',
  'teacher-report': 'staff',
  'teacher-tasks': 'staff',
  'teacher-goals': 'staff',
  'dept-goals': 'staff',
  'dept-bonus': 'staff',
  'salary': 'salary_config',
  'work-confirm': 'work_confirmation',
  'report-teacher': 'salary_teacher',
  'report-staff': 'salary_staff',
  'contracts': 'contracts',
  'contracts-create': 'contracts',
  'invoices': 'invoices',
  'debt': 'debt',
  'revenue': 'revenue',
  'report-training': 'reports_training',
  'report-finance': 'reports_finance',
  'report-monthly': 'reports_training',
  'settings-center': 'settings',
  'settings-staff': 'settings',
  'settings-curriculum': 'settings',
  'settings-products': 'settings',
  'settings-inventory': 'settings',
  'settings-rooms': 'settings',
};


// Map parent menu to required modules (at least one must be visible)
const parentMenuModules: Record<string, ModuleKey[]> = {
  'training': ['classes', 'schedule', 'holidays', 'attendance', 'tutoring', 'homework', 'attendance_history', 'enrollment_history'],
  'customers': ['students', 'parents', 'students_dropped', 'students_reserved', 'feedback', 'students_trial', 'service_dashboard'],
  'business': ['leads', 'campaigns', 'marketing_tasks', 'marketing_kpi', 'marketing_platforms'],
  'hr': ['staff', 'salary_config', 'work_confirmation', 'salary_teacher', 'salary_staff'],
  'finance': ['contracts', 'invoices', 'debt', 'revenue'],
  'reports': ['reports_training', 'reports_finance'],
  'settings': ['settings'],
};

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Trang chủ',
    icon: LayoutDashboard,
    path: '/admin'
  },
  {
    id: 'training',
    label: 'Đào Tạo',
    icon: BookOpen,
    subItems: [
      { id: 'classes', label: 'Lớp học', path: '/admin/training/classes', icon: ChevronRight },
      { id: 'courses', label: 'Khóa học', path: '/admin/training/courses', icon: ChevronRight },
      { id: 'schedule', label: 'Thời khóa biểu', path: '/admin/training/schedule', icon: ChevronRight },
      { id: 'holidays', label: 'Lịch nghỉ', path: '/admin/training/holidays', icon: ChevronRight },
      { id: 'attendance', label: 'Điểm danh', path: '/admin/training/attendance', icon: ChevronRight },
      { id: 'tutoring', label: 'Lịch bồi', path: '/admin/training/tutoring', icon: ChevronRight },
      { id: 'homework', label: 'Bài tập về nhà', path: '/admin/training/homework', icon: ChevronRight },
      { id: 'attendance-history', label: 'Lịch sử điểm danh', path: '/admin/training/attendance-history', icon: ChevronRight },
      { id: 'enrollment-history', label: 'Lịch sử ghi danh', path: '/admin/training/enrollment', icon: ChevronRight },
      { id: 'resources', label: 'Thư viện tài nguyên', path: '/admin/training/resources', icon: ChevronRight },
    ]
  },
  {
    id: 'customers',
    label: 'Khách Hàng',
    icon: Users,
    subItems: [
      { id: 'students', label: 'Danh sách học viên', path: '/admin/customers/students', icon: ChevronRight },
      { id: 'parents', label: 'Danh sách phụ huynh', path: '/admin/customers/parents', icon: ChevronRight },
      { id: 'dropped', label: 'DS Học viên đã nghỉ', path: '/admin/customers/dropped', icon: ChevronRight },
      { id: 'reserved', label: 'DS Học viên bảo lưu', path: '/admin/customers/reserved', icon: ChevronRight },
      { id: 'feedback', label: 'Phản hồi khách hàng', path: '/admin/customers/feedback', icon: ChevronRight },
      { id: 'surveys', label: 'Form khảo sát', path: '/admin/customers/surveys', icon: ChevronRight },
      { id: 'trial', label: 'DS Học viên học thử', path: '/admin/customers/trial', icon: ChevronRight },
      { id: 'service-dashboard', label: 'Dashboard CSKH', path: '/admin/customers/service-dashboard', icon: ChevronRight },
    ]
  },
  {
    id: 'business',
    label: 'Kinh Doanh',
    icon: Briefcase,
    subItems: [
      { id: 'leads', label: 'Kho dữ liệu KH', path: '/admin/business/leads', icon: ChevronRight },
      { id: 'campaigns', label: 'Chiến dịch', path: '/admin/business/campaigns', icon: ChevronRight },
      { id: 'marketing-tasks', label: 'Quản lý Task', path: '/admin/business/tasks', icon: ChevronRight },
      { id: 'marketing-kpi', label: 'Mục tiêu KPI', path: '/admin/business/kpi', icon: ChevronRight },
      { id: 'marketing-platforms', label: 'Thống kê nền tảng', path: '/admin/business/platforms', icon: ChevronRight },
    ]
  },
  {
    id: 'hr',
    label: 'Nhân sự',
    icon: UserCog,
    subItems: [
      { id: 'staff', label: 'Quản lý Nhân sự', path: '/admin/hr/staff', icon: ChevronRight },
      { id: 'dept-goals', label: 'Mục tiêu phòng ban', path: '/admin/hr/department-goals', icon: ChevronRight },
      { id: 'dept-bonus', label: 'Cấu hình thưởng KPI', path: '/admin/hr/department-bonus', icon: ChevronRight },
      { id: 'teacher-report', label: 'Báo cáo GV/TG', path: '/admin/hr/teacher-report', icon: ChevronRight },
      { id: 'teacher-tasks', label: 'Task GV/TG', path: '/admin/hr/teacher-tasks', icon: ChevronRight },
      { id: 'teacher-goals', label: 'Mục tiêu GV/TG', path: '/admin/hr/teacher-goals', icon: ChevronRight },
      { id: 'salary', label: 'Cấu hình lương GV/TG', path: '/admin/hr/salary', icon: ChevronRight },
      { id: 'rewards', label: 'Thưởng / Phạt', path: '/admin/hr/rewards', icon: ChevronRight },
      { id: 'work-confirm', label: 'Xác nhận công', path: '/admin/hr/work-confirmation', icon: ChevronRight },
      { id: 'report-teacher', label: 'Báo cáo lương GV/TG', path: '/admin/hr/salary-teacher', icon: ChevronRight },
      { id: 'report-staff', label: 'Báo cáo lương NV', path: '/admin/hr/salary-staff', icon: ChevronRight },
    ]
  },
  {
    id: 'finance',
    label: 'Tài chính',
    icon: DollarSign,
    subItems: [
      { id: 'contracts', label: 'Danh sách hợp đồng', path: '/admin/finance/contracts', icon: ChevronRight },
      { id: 'contracts-create', label: 'Tạo hợp đồng', path: '/admin/finance/contracts/create', icon: ChevronRight },
      { id: 'invoices', label: 'Hóa đơn bán sách', path: '/admin/finance/invoices', icon: ChevronRight },
      { id: 'debt', label: 'Quản lý công nợ', path: '/admin/finance/debt', icon: ChevronRight },
      { id: 'revenue', label: 'Báo cáo doanh thu', path: '/admin/finance/revenue', icon: ChevronRight },
    ]
  },
  {
    id: 'reports',
    label: 'Báo Cáo',
    icon: BarChart3,
    subItems: [
      { id: 'report-training', label: 'Báo cáo đào tạo', path: '/admin/reports/training', icon: ChevronRight },
      { id: 'report-finance', label: 'Báo cáo tài chính', path: '/admin/reports/finance', icon: ChevronRight },
      { id: 'report-monthly', label: 'Báo cáo học tập', path: '/admin/reports/monthly', icon: ChevronRight },
    ]
  },
  {
    id: 'settings',
    label: 'Cấu hình',
    icon: Settings,
    subItems: [
      { id: 'settings-center', label: 'Quản lý cơ sở', path: '/admin/settings/center', icon: ChevronRight },
      { id: 'settings-staff', label: 'Quản lý nhân viên', path: '/admin/settings/staff', icon: ChevronRight },
      { id: 'settings-curriculum', label: 'Quản lý Gói học', path: '/admin/settings/curriculum', icon: ChevronRight },
      { id: 'settings-products', label: 'Quản lý vật phẩm', path: '/admin/settings/products', icon: ChevronRight },
      { id: 'settings-inventory', label: 'Quản lý kho', path: '/admin/settings/inventory', icon: ChevronRight },
      { id: 'settings-rooms', label: 'Quản lý phòng học', path: '/admin/settings/rooms', icon: ChevronRight },
    ]
  }
];

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['training', 'customers', 'settings']);
  const location = useLocation();
  const { canView, role, isAdmin } = usePermissions();
  const { user, staffData } = useAuth();

  // Filter menu items based on permissions
  const filteredMenuItems = useMemo(() => {
    return menuItems.map(item => {
      // Dashboard always visible
      if (item.id === 'dashboard') return item;

      // For parent menus with subItems
      if (item.subItems) {
        const modules = parentMenuModules[item.id];
        // Check if at least one module is visible
        const hasVisibleModule = modules?.some(m => canView(m));
        if (!hasVisibleModule) return null;

        // Filter subItems
        const visibleSubItems = item.subItems.filter(sub => {
          const moduleKey = subItemToModule[sub.id];
          return moduleKey ? canView(moduleKey) : true;
        });

        if (visibleSubItems.length === 0) return null;
        return { ...item, subItems: visibleSubItems };
      }

      return item;
    }).filter(Boolean) as MenuItem[];
  }, [canView, role]);

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleMobileSidebar = () => setIsOpen(!isOpen);

  // Get user display info
  const userName = staffData?.name || user?.displayName || 'User';
  const userPosition = staffData?.position || 'Nhân viên';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-md shadow-lg print:hidden"
        onClick={toggleMobileSidebar}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block print:hidden
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center justify-center border-b border-gray-200 px-4">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
            {filteredMenuItems.map((item) => (
              <div key={item.id}>
                {item.subItems ? (
                  // Parent Menu Item
                  <div>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${expandedMenus.includes(item.id)
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </div>
                      {expandedMenus.includes(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {/* Sub Menu */}
                    {expandedMenus.includes(item.id) && (
                      <div className="mt-1 ml-4 pl-3 border-l-2 border-indigo-100 space-y-1">
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.id}
                            to={sub.path || '#'}
                            className={({ isActive }) => `
                              flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                              ${isActive
                                ? 'text-indigo-600 font-semibold bg-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                            `}
                          >
                            <span>{sub.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Single Menu Item
                  <NavLink
                    to={item.path || '#'}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1
                      ${isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                )}
              </div>
            ))}
          </nav>

          {/* User Profile Snippet */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userPosition}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
