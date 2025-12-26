/**
 * useSurvey Hook
 * Hook để quản lý survey templates, assignments và responses
 */

import { useState, useEffect, useCallback } from 'react';
import { SurveyService } from '../services/surveyService';
import { SurveyTemplate, SurveyAssignment, SurveyResponse } from '../types/surveyTypes';

// Hook for templates
export const useSurveyTemplates = () => {
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = SurveyService.onTemplatesChange((data) => {
      setTemplates(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createTemplate = async (data: Omit<SurveyTemplate, 'id' | 'createdAt'>) => {
    return await SurveyService.createTemplate(data);
  };

  const updateTemplate = async (id: string, data: Partial<SurveyTemplate>) => {
    await SurveyService.updateTemplate(id, data);
  };

  const deleteTemplate = async (id: string) => {
    await SurveyService.deleteTemplate(id);
  };

  const initDefaults = async () => {
    await SurveyService.initializeDefaultTemplates();
  };

  return {
    templates,
    activeTemplates: templates.filter(t => t.status === 'active'),
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    initDefaults
  };
};

// Hook for assignments
export const useSurveyAssignments = (filters?: {
  templateId?: string;
  studentId?: string;
  status?: 'pending' | 'submitted' | 'expired';
}) => {
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = SurveyService.onAssignmentsChange((data) => {
      let filtered = data;
      if (filters?.templateId) {
        filtered = filtered.filter(a => a.templateId === filters.templateId);
      }
      if (filters?.studentId) {
        filtered = filtered.filter(a => a.studentId === filters.studentId);
      }
      if (filters?.status) {
        filtered = filtered.filter(a => a.status === filters.status);
      }
      setAssignments(filtered);
      setLoading(false);
    }, filters?.studentId);
    return () => unsubscribe();
  }, [filters?.templateId, filters?.studentId, filters?.status]);

  const assignSurvey = async (
    templateId: string,
    students: Array<{ id: string; name: string; code?: string; classId?: string; className?: string }>,
    assignedBy?: string,
    expiresAt?: string
  ) => {
    return await SurveyService.assignSurvey(templateId, students, assignedBy, expiresAt);
  };

  const cancelAssignment = async (assignmentId: string) => {
    await SurveyService.cancelAssignment(assignmentId);
  };

  return {
    assignments,
    pendingAssignments: assignments.filter(a => a.status === 'pending'),
    submittedAssignments: assignments.filter(a => a.status === 'submitted'),
    loading,
    assignSurvey,
    cancelAssignment
  };
};

// Hook for student's pending surveys
export const useStudentSurveys = (studentId: string) => {
  const [pendingSurveys, setPendingSurveys] = useState<SurveyAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setPendingSurveys([]);
      setLoading(false);
      return;
    }

    const unsubscribe = SurveyService.onAssignmentsChange((data) => {
      const pending = data.filter(a => a.status === 'pending');
      setPendingSurveys(pending);
      setLoading(false);
    }, studentId);

    return () => unsubscribe();
  }, [studentId]);

  const submitResponse = async (data: Omit<SurveyResponse, 'id'>) => {
    return await SurveyService.submitResponse(data);
  };

  return {
    pendingSurveys,
    loading,
    submitResponse,
    hasPendingSurveys: pendingSurveys.length > 0
  };
};

// Hook for responses and statistics
export const useSurveyResponses = (filters?: {
  templateId?: string;
  classId?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = SurveyService.onResponsesChange((data) => {
      let filtered = data;
      if (filters?.templateId) {
        filtered = filtered.filter(r => r.templateId === filters.templateId);
      }
      if (filters?.classId) {
        filtered = filtered.filter(r => r.classId === filters.classId);
      }
      if (filters?.fromDate) {
        filtered = filtered.filter(r => r.submittedAt >= filters.fromDate!);
      }
      if (filters?.toDate) {
        filtered = filtered.filter(r => r.submittedAt <= filters.toDate!);
      }
      setResponses(filtered);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [filters?.templateId, filters?.classId, filters?.fromDate, filters?.toDate]);

  const getStatistics = useCallback(async () => {
    return await SurveyService.getStatistics(filters);
  }, [filters]);

  return {
    responses,
    loading,
    getStatistics
  };
};
