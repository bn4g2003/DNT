/**
 * Survey Form Public Page
 * Trang public cho học viên/phụ huynh điền form khảo sát
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Send, CheckCircle, AlertCircle, User } from 'lucide-react';
import { SurveyService } from '../src/services/surveyService';
import { SurveyTemplate, SurveyAssignment, SurveyQuestion } from '../src/types/surveyTypes';

type PageState = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'already_submitted' | 'expired';

export const SurveyFormPublic: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [template, setTemplate] = useState<SurveyTemplate | null>(null);
  const [assignment, setAssignment] = useState<SurveyAssignment | null>(null);

  // Form data
  const [submitterType, setSubmitterType] = useState<'student' | 'parent'>('parent');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterPhone, setSubmitterPhone] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [comments, setComments] = useState('');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setErrorMessage('Link không hợp lệ');
        setPageState('error');
        return;
      }

      try {
        // Get assignment by token
        const assignmentResult = await SurveyService.getAssignmentByToken(token);
        if (!assignmentResult) {
          setErrorMessage('Link không tồn tại hoặc đã hết hạn');
          setPageState('error');
          return;
        }

        if (assignmentResult.status === 'submitted') {
          setPageState('already_submitted');
          return;
        }

        if (assignmentResult.status === 'expired') {
          setErrorMessage('Link đã hết hạn');
          setPageState('expired');
          return;
        }

        // Get template
        const templateResult = await SurveyService.getTemplate(assignmentResult.templateId);
        if (!templateResult) {
          setErrorMessage('Form khảo sát không tồn tại');
          setPageState('error');
          return;
        }

        if (templateResult.status !== 'active') {
          setErrorMessage('Form khảo sát đã bị khóa');
          setPageState('expired');
          return;
        }

        setTemplate(templateResult);
        setAssignment(assignmentResult);
        setPageState('ready');
      } catch (err) {
        console.error('Error loading survey form:', err);
        setErrorMessage('Có lỗi xảy ra, vui lòng thử lại');
        setPageState('error');
      }
    };

    loadData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submitterName.trim()) {
      alert('Vui lòng nhập họ tên');
      return;
    }

    // Validate required questions
    const requiredQuestions = template?.questions.filter(q => q.required) || [];
    for (const q of requiredQuestions) {
      if (!answers[q.id] && answers[q.id] !== 0) {
        alert(`Vui lòng trả lời câu hỏi: ${q.question}`);
        return;
      }
    }

    setPageState('submitting');

    try {
      // Extract category scores
      const teacherScore = answers['teacher'] as number | undefined;
      const curriculumScore = answers['curriculum'] as number | undefined;
      const careScore = answers['care'] as number | undefined;
      const facilitiesScore = answers['facilities'] as number | undefined;

      await SurveyService.submitResponse({
        assignmentId: assignment!.id,
        templateId: template!.id,
        templateName: template!.name,
        studentId: assignment!.studentId,
        studentName: assignment!.studentName,
        studentCode: assignment!.studentCode,
        classId: assignment!.classId,
        className: assignment!.className,
        teacherScore,
        curriculumScore,
        careScore,
        facilitiesScore,
        answers,
        comments,
        submittedAt: new Date().toISOString(),
        submittedBy: submitterType,
        submitterName,
        submitterPhone
      });

      setPageState('success');
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMessage('Có lỗi xảy ra khi gửi, vui lòng thử lại');
      setPageState('error');
    }
  };

  // Render question based on type
  const renderQuestion = (question: SurveyQuestion) => {
    switch (question.type) {
      case 'score':
        return (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {question.question} {question.required && '*'}
            </label>
            <div className="flex gap-1 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [question.id]: score })}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                    answers[question.id] === score
                      ? score >= 8 ? 'bg-green-500 text-white' :
                        score >= 5 ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {question.question} {question.required && '*'}
            </label>
            <textarea
              value={(answers[question.id] as string) || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Nhập câu trả lời..."
            />
          </div>
        );

      case 'choice':
        return (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {question.question} {question.required && '*'}
            </label>
            <div className="space-y-2">
              {question.options?.map(option => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === option}
                    onChange={() => setAnswers({ ...answers, [question.id]: option })}
                    className="text-orange-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  // Loading
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Error
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h1>
          <p className="text-gray-600">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Already submitted
  if (pageState === 'already_submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Đã gửi trước đó</h1>
          <p className="text-gray-600">Bạn đã gửi đánh giá cho học viên này rồi. Cảm ơn bạn!</p>
        </div>
      </div>
    );
  }

  // Expired
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Đã kết thúc</h1>
          <p className="text-gray-600">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Success
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cảm ơn bạn!</h1>
          <p className="text-gray-600 mb-4">
            Đánh giá của bạn đã được ghi nhận. Chúng tôi sẽ cải thiện dịch vụ dựa trên phản hồi của bạn.
          </p>
          <div className="text-sm text-gray-500">
            Học viên: <strong>{assignment?.studentName}</strong>
          </div>
        </div>
      </div>
    );
  }

  // Ready - Show form
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo.jpg" alt="Logo" className="w-20 h-20 mx-auto rounded-xl shadow-lg mb-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <h1 className="text-2xl font-bold text-gray-800">{template?.name || 'Phiếu khảo sát'}</h1>
          <p className="text-gray-600 mt-2">{template?.description || 'Vui lòng đánh giá chất lượng dịch vụ của chúng tôi'}</p>
        </div>

        {/* Student Info */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đánh giá cho học viên</p>
              <p className="font-bold text-gray-800">{assignment?.studentName}</p>
              {assignment?.className && (
                <p className="text-sm text-gray-500">Lớp: {assignment.className}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* Submitter Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bạn là</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={submitterType === 'parent'}
                  onChange={() => setSubmitterType('parent')}
                  className="text-orange-600"
                />
                <span>Phụ huynh</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={submitterType === 'student'}
                  onChange={() => setSubmitterType('student')}
                  className="text-orange-600"
                />
                <span>Học viên</span>
              </label>
            </div>
          </div>

          {/* Submitter Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
              <input
                type="text"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Nhập họ tên"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={submitterPhone}
                onChange={(e) => setSubmitterPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="SĐT (không bắt buộc)"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Star size={20} className="text-orange-500" />
              Đánh giá
            </h3>
          </div>

          {/* Questions */}
          {template?.questions.sort((a, b) => a.order - b.order).map(renderQuestion)}

          {/* Additional Comments */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ý kiến đóng góp khác</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Nhập ý kiến của bạn (không bắt buộc)..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pageState === 'submitting'}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {pageState === 'submitting' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={20} />
                Gửi đánh giá
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Trung tâm Anh ngữ DNT - Cảm ơn bạn đã đánh giá!
        </p>
      </div>
    </div>
  );
};
