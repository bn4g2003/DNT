/**
 * useFeedback Hook
 */

import { useState, useEffect } from 'react';
import * as feedbackService from '../services/feedbackService';
import { FeedbackRecord, FeedbackType, FeedbackStatus } from '../services/feedbackService';

interface UseFeedbackProps {
  type?: FeedbackType;
  status?: FeedbackStatus;
  studentId?: string;
}

interface UseFeedbackReturn {
  feedbacks: FeedbackRecord[];
  callFeedbacks: FeedbackRecord[];
  formFeedbacks: FeedbackRecord[];
  loading: boolean;
  error: string | null;
  createFeedback: (data: Omit<FeedbackRecord, 'id'>) => Promise<string>;
  updateFeedback: (id: string, data: Partial<FeedbackRecord>) => Promise<void>;
  updateStatus: (id: string, status: FeedbackStatus) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFeedback = (props?: UseFeedbackProps): UseFeedbackReturn => {
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getFeedbacks({
        type: props?.type,
        status: props?.status,
        studentId: props?.studentId,
      });
      setFeedbacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [props?.type, props?.status, props?.studentId]);

  const callFeedbacks = feedbacks.filter(f => f.type === 'Call');
  const formFeedbacks = feedbacks.filter(f => f.type === 'Form');

  const createFeedback = async (data: Omit<FeedbackRecord, 'id'>): Promise<string> => {
    const id = await feedbackService.createFeedback(data);
    await fetchFeedbacks();
    return id;
  };

  const updateFeedback = async (id: string, data: Partial<FeedbackRecord>): Promise<void> => {
    await feedbackService.updateFeedback(id, data);
    await fetchFeedbacks();
  };

  const updateStatus = async (id: string, status: FeedbackStatus): Promise<void> => {
    await feedbackService.updateFeedbackStatus(id, status);
    await fetchFeedbacks();
  };

  const deleteFeedback = async (id: string): Promise<void> => {
    await feedbackService.deleteFeedback(id);
    await fetchFeedbacks();
  };

  return {
    feedbacks,
    callFeedbacks,
    formFeedbacks,
    loading,
    error,
    createFeedback,
    updateFeedback,
    updateStatus,
    deleteFeedback,
    refresh: fetchFeedbacks,
  };
};
