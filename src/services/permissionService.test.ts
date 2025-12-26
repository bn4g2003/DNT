import { describe, it, expect } from 'vitest';
import {
  UserRole,
  ModuleKey,
  ROLE_PERMISSIONS,
  getRoleFromPosition,
  hasPermission,
  canView,
  canCreate,
  canEdit,
  canDelete,
  canApprove,
  shouldShowOnlyOwnClasses,
  shouldHideParentPhone,
  requiresApproval,
  getVisibleMenuItems,
} from './permissionService';

describe('Permission Service', () => {
  describe('getRoleFromPosition', () => {
    it('should return admin role for Quản lý (Admin)', () => {
      expect(getRoleFromPosition('Quản lý (Admin)')).toBe('admin');
    });

    it('should return cskh role for Tư vấn viên', () => {
      expect(getRoleFromPosition('Tư vấn viên')).toBe('cskh');
    });

    it('should return cskh role for Lễ tân', () => {
      expect(getRoleFromPosition('Lễ tân')).toBe('cskh');
    });

    it('should return ketoan role for Kế toán', () => {
      expect(getRoleFromPosition('Kế toán')).toBe('ketoan');
    });

    it('should return gv_viet role for Giáo Viên Việt', () => {
      expect(getRoleFromPosition('Giáo Viên Việt')).toBe('gv_viet');
    });

    it('should return gv_nuocngoai role for Giáo Viên Nước Ngoài', () => {
      expect(getRoleFromPosition('Giáo Viên Nước Ngoài')).toBe('gv_nuocngoai');
    });

    it('should return tro_giang role for Trợ Giảng', () => {
      expect(getRoleFromPosition('Trợ Giảng')).toBe('tro_giang');
    });

    it('should default to gv_viet for unknown positions', () => {
      expect(getRoleFromPosition('Unknown Position')).toBe('gv_viet');
    });
  });

  describe('Admin Permissions', () => {
    const role: UserRole = 'admin';

    it('should have full access to all modules', () => {
      const modules: ModuleKey[] = [
        'dashboard', 'classes', 'schedule', 'students', 
        'staff', 'salary_config', 'contracts', 'settings'
      ];
      
      modules.forEach(module => {
        expect(canView(role, module)).toBe(true);
        expect(canCreate(role, module)).toBe(true);
        expect(canEdit(role, module)).toBe(true);
        expect(canDelete(role, module)).toBe(true);
      });
    });

    it('should be able to approve work confirmation', () => {
      expect(canApprove(role, 'work_confirmation')).toBe(true);
    });

    it('should not have onlyOwnClasses restriction', () => {
      expect(shouldShowOnlyOwnClasses(role, 'classes')).toBe(false);
    });

    it('should not hide parent phone', () => {
      expect(shouldHideParentPhone(role, 'students')).toBe(false);
    });
  });

  describe('CSKH Permissions', () => {
    const role: UserRole = 'cskh';

    it('should view dashboard', () => {
      expect(canView(role, 'dashboard')).toBe(true);
    });

    it('should view and edit classes', () => {
      expect(canView(role, 'classes')).toBe(true);
      expect(canCreate(role, 'classes')).toBe(true);
      expect(canEdit(role, 'classes')).toBe(true);
      expect(canDelete(role, 'classes')).toBe(false);
    });

    it('should not access salary config', () => {
      expect(canView(role, 'salary_config')).toBe(false);
    });

    it('should not access salary reports', () => {
      expect(canView(role, 'salary_teacher')).toBe(false);
      expect(canView(role, 'salary_staff')).toBe(false);
    });

    it('should require approval for invoice deletion', () => {
      expect(requiresApproval(role, 'invoices')).toBe(true);
    });

    it('should be able to approve work confirmation', () => {
      expect(canApprove(role, 'work_confirmation')).toBe(true);
    });

    it('should only view staff, not edit', () => {
      expect(canView(role, 'staff')).toBe(true);
      expect(canCreate(role, 'staff')).toBe(false);
      expect(canEdit(role, 'staff')).toBe(false);
    });
  });

  describe('Kế toán Permissions', () => {
    const role: UserRole = 'ketoan';

    it('should view dashboard', () => {
      expect(canView(role, 'dashboard')).toBe(true);
    });

    it('should have full access to salary config', () => {
      expect(canView(role, 'salary_config')).toBe(true);
      expect(canCreate(role, 'salary_config')).toBe(true);
      expect(canEdit(role, 'salary_config')).toBe(true);
    });

    it('should have full access to invoices', () => {
      expect(canView(role, 'invoices')).toBe(true);
      expect(canCreate(role, 'invoices')).toBe(true);
      expect(canEdit(role, 'invoices')).toBe(true);
      expect(canDelete(role, 'invoices')).toBe(true);
    });

    it('should not access attendance', () => {
      expect(canView(role, 'attendance')).toBe(false);
    });

    it('should not access leads/campaigns', () => {
      expect(canView(role, 'leads')).toBe(false);
      expect(canView(role, 'campaigns')).toBe(false);
    });
  });

  describe('Giáo viên Việt Permissions', () => {
    const role: UserRole = 'gv_viet';

    it('should view dashboard', () => {
      expect(canView(role, 'dashboard')).toBe(true);
    });

    it('should view classes with onlyOwnClasses restriction', () => {
      expect(canView(role, 'classes')).toBe(true);
      expect(shouldShowOnlyOwnClasses(role, 'classes')).toBe(true);
    });

    it('should hide parent phone', () => {
      expect(shouldHideParentPhone(role, 'classes')).toBe(true);
      expect(shouldHideParentPhone(role, 'students')).toBe(true);
    });

    it('should not access holidays', () => {
      expect(canView(role, 'holidays')).toBe(false);
    });

    it('should not access enrollment history', () => {
      expect(canView(role, 'enrollment_history')).toBe(false);
    });

    it('should not access any customer modules', () => {
      expect(canView(role, 'parents')).toBe(false);
      expect(canView(role, 'students_reserved')).toBe(false);
      expect(canView(role, 'students_dropped')).toBe(false);
    });

    it('should not access finance modules', () => {
      expect(canView(role, 'contracts')).toBe(false);
      expect(canView(role, 'invoices')).toBe(false);
      expect(canView(role, 'revenue')).toBe(false);
      expect(canView(role, 'debt')).toBe(false);
    });

    it('should not access settings', () => {
      expect(canView(role, 'settings')).toBe(false);
    });

    it('should view own salary only', () => {
      expect(canView(role, 'salary_teacher')).toBe(true);
      expect(canCreate(role, 'salary_teacher')).toBe(false);
    });

    it('should be able to create work confirmation', () => {
      expect(canView(role, 'work_confirmation')).toBe(true);
      expect(canCreate(role, 'work_confirmation')).toBe(true);
      expect(canEdit(role, 'work_confirmation')).toBe(false);
    });
  });

  describe('Trợ giảng Permissions', () => {
    const role: UserRole = 'tro_giang';

    it('should have same restrictions as gv_viet', () => {
      expect(shouldShowOnlyOwnClasses(role, 'classes')).toBe(true);
      expect(shouldHideParentPhone(role, 'students')).toBe(true);
      expect(canView(role, 'holidays')).toBe(false);
      expect(canView(role, 'contracts')).toBe(false);
      expect(canView(role, 'settings')).toBe(false);
    });
  });

  describe('getVisibleMenuItems', () => {
    it('should return all modules for admin', () => {
      const items = getVisibleMenuItems('admin');
      expect(items).toContain('dashboard');
      expect(items).toContain('classes');
      expect(items).toContain('settings');
      expect(items).toContain('salary_config');
    });

    it('should hide salary modules for cskh', () => {
      const items = getVisibleMenuItems('cskh');
      expect(items).toContain('dashboard');
      expect(items).toContain('classes');
      expect(items).not.toContain('salary_config');
      expect(items).not.toContain('salary_teacher');
      expect(items).not.toContain('settings');
    });

    it('should hide most modules for teachers', () => {
      const items = getVisibleMenuItems('gv_viet');
      expect(items).toContain('dashboard');
      expect(items).toContain('classes');
      expect(items).not.toContain('leads');
      expect(items).not.toContain('contracts');
      expect(items).not.toContain('settings');
      expect(items).not.toContain('holidays');
    });
  });
});
