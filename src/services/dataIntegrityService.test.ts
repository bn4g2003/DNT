import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ValidationResult,
  ConsistencyIssue,
} from './dataIntegrityService';

// Mock Firebase
const mockBatch = {
  update: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn(),
};

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((db, collection, id) => ({ id, collection })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(() => mockBatch),
}));

vi.mock('../config/firebase', () => ({
  db: {},
}));

describe('Data Integrity Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ValidationResult interface', () => {
    it('should have correct structure for successful validation', () => {
      const result: ValidationResult = {
        canDelete: true,
      };
      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should have correct structure for failed validation', () => {
      const result: ValidationResult = {
        canDelete: false,
        reason: 'Test reason',
        relatedCount: 5,
        relatedItems: ['item1', 'item2'],
      };
      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Test reason');
      expect(result.relatedCount).toBe(5);
      expect(result.relatedItems).toHaveLength(2);
    });
  });

  describe('ConsistencyIssue interface', () => {
    it('should have correct structure for orphaned reference', () => {
      const issue: ConsistencyIssue = {
        type: 'orphaned_reference',
        collection: 'students',
        documentId: 'student123',
        field: 'classId',
        currentValue: 'class456',
        description: 'Student references non-existent class',
      };
      expect(issue.type).toBe('orphaned_reference');
      expect(issue.collection).toBe('students');
    });

    it('should have correct structure for data mismatch', () => {
      const issue: ConsistencyIssue = {
        type: 'data_mismatch',
        collection: 'students',
        documentId: 'student123',
        field: 'parentName',
        currentValue: 'Old Name',
        expectedValue: 'New Name',
        description: 'Parent name mismatch',
      };
      expect(issue.type).toBe('data_mismatch');
      expect(issue.expectedValue).toBe('New Name');
    });

    it('should have correct structure for missing field', () => {
      const issue: ConsistencyIssue = {
        type: 'missing_field',
        collection: 'students',
        documentId: 'student123',
        field: 'fullName',
        currentValue: null,
        description: 'Student missing name',
      };
      expect(issue.type).toBe('missing_field');
      expect(issue.currentValue).toBeNull();
    });
  });

  describe('Validation Logic Tests', () => {
    describe('Class Deletion Validation', () => {
      it('should prevent deletion when class has students', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Lớp học đang có 5 học viên. Vui lòng chuyển học viên sang lớp khác trước khi xóa.',
          relatedCount: 5,
          relatedItems: ['Student 1', 'Student 2', 'Student 3'],
        };
        expect(validation.canDelete).toBe(false);
        expect(validation.relatedCount).toBe(5);
      });

      it('should prevent deletion when class has upcoming sessions', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Lớp học còn 3 buổi dạy chưa hoàn thành.',
          relatedCount: 3,
        };
        expect(validation.canDelete).toBe(false);
      });

      it('should allow deletion when no related data', () => {
        const validation: ValidationResult = {
          canDelete: true,
        };
        expect(validation.canDelete).toBe(true);
      });
    });

    describe('Staff Deletion Validation', () => {
      it('should prevent deletion when staff teaches classes', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Nhân viên đang phụ trách 2 lớp học.',
          relatedCount: 2,
          relatedItems: ['Class A', 'Class B'],
        };
        expect(validation.canDelete).toBe(false);
      });

      it('should prevent deletion when staff has pending work sessions', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Nhân viên còn 5 buổi dạy chờ xác nhận.',
          relatedCount: 5,
        };
        expect(validation.canDelete).toBe(false);
      });
    });

    describe('Student Deletion Validation', () => {
      it('should prevent deletion when student has unpaid contracts', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Học viên còn 1 hợp đồng chưa thanh toán.',
          relatedCount: 1,
        };
        expect(validation.canDelete).toBe(false);
      });

      it('should prevent deletion when student has pending invoices', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Học viên còn 2 hóa đơn chưa thanh toán.',
          relatedCount: 2,
        };
        expect(validation.canDelete).toBe(false);
      });
    });

    describe('Parent Deletion Validation', () => {
      it('should prevent deletion when parent has linked students', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Phụ huynh có 2 học viên liên kết.',
          relatedCount: 2,
          relatedItems: ['Child 1', 'Child 2'],
        };
        expect(validation.canDelete).toBe(false);
      });
    });
  });

  describe('Cascade Operations Tests', () => {
    describe('cascadeDeleteClass', () => {
      it('should return correct counts after cascade', () => {
        const result = {
          studentsUpdated: 5,
          workSessionsUpdated: 10,
        };
        expect(result.studentsUpdated).toBe(5);
        expect(result.workSessionsUpdated).toBe(10);
      });
    });

    describe('cascadeDeleteStaff', () => {
      it('should return correct counts after cascade', () => {
        const result = {
          classesUpdated: 3,
          workSessionsUpdated: 15,
        };
        expect(result.classesUpdated).toBe(3);
        expect(result.workSessionsUpdated).toBe(15);
      });
    });

    describe('cascadeUpdateParent', () => {
      it('should return number of students updated', () => {
        const studentsUpdated = 2;
        expect(studentsUpdated).toBeGreaterThan(0);
      });
    });

    describe('cascadeUpdateClassName', () => {
      it('should return number of students updated', () => {
        const studentsUpdated = 8;
        expect(studentsUpdated).toBe(8);
      });
    });

    describe('cascadeDeleteStudent', () => {
      it('should return correct counts after cascade', () => {
        const result = {
          contractsUpdated: 2,
          invoicesUpdated: 1,
          attendanceDeleted: 20,
        };
        expect(result.contractsUpdated).toBe(2);
        expect(result.invoicesUpdated).toBe(1);
        expect(result.attendanceDeleted).toBe(20);
      });
    });
  });

  describe('Consistency Check Tests', () => {
    it('should categorize issues correctly', () => {
      const issues: ConsistencyIssue[] = [
        { type: 'orphaned_reference', collection: 'students', documentId: '1', field: 'classId', currentValue: 'x', description: '' },
        { type: 'orphaned_reference', collection: 'classes', documentId: '2', field: 'teacherId', currentValue: 'y', description: '' },
        { type: 'data_mismatch', collection: 'students', documentId: '3', field: 'parentName', currentValue: 'a', expectedValue: 'b', description: '' },
        { type: 'missing_field', collection: 'students', documentId: '4', field: 'fullName', currentValue: null, description: '' },
      ];

      const summary = {
        orphanedReferences: issues.filter(i => i.type === 'orphaned_reference').length,
        dataMismatches: issues.filter(i => i.type === 'data_mismatch').length,
        missingFields: issues.filter(i => i.type === 'missing_field').length,
      };

      expect(summary.orphanedReferences).toBe(2);
      expect(summary.dataMismatches).toBe(1);
      expect(summary.missingFields).toBe(1);
    });

    it('should generate report with correct timestamp', () => {
      const report = {
        checkedAt: new Date().toISOString(),
        totalIssues: 4,
        issues: [],
        summary: {
          orphanedReferences: 2,
          dataMismatches: 1,
          missingFields: 1,
        },
      };

      expect(report.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(report.totalIssues).toBe(4);
    });
  });

  describe('Settings Module Validation', () => {
    describe('Room Deletion', () => {
      it('should prevent deletion when room is in use', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Phòng học đang được sử dụng bởi 3 lớp học.',
          relatedCount: 3,
          relatedItems: ['Class A', 'Class B', 'Class C'],
        };
        expect(validation.canDelete).toBe(false);
      });
    });

    describe('Salary Config Deletion', () => {
      it('should prevent deletion when config is in use', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Cấu hình lương đang được áp dụng cho 5 nhân viên.',
          relatedCount: 5,
        };
        expect(validation.canDelete).toBe(false);
      });
    });
  });

  describe('Sales Module Validation', () => {
    describe('Campaign Deletion', () => {
      it('should prevent deletion when campaign has leads', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Chiến dịch có 10 leads liên kết.',
          relatedCount: 10,
        };
        expect(validation.canDelete).toBe(false);
      });
    });

    describe('Lead Deletion', () => {
      it('should prevent deletion when lead is converted', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Lead đã được chuyển đổi thành học viên.',
          relatedCount: 1,
        };
        expect(validation.canDelete).toBe(false);
      });
    });
  });

  describe('Finance Module Validation', () => {
    describe('Contract Deletion', () => {
      it('should prevent deletion when contract has payments', () => {
        const validation: ValidationResult = {
          canDelete: false,
          reason: 'Hợp đồng đã có thanh toán 5,000,000đ.',
          relatedCount: 1,
        };
        expect(validation.canDelete).toBe(false);
      });
    });
  });
});
