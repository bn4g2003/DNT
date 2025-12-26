/**
 * Customer Service Dashboard (Dashboard CSKH)
 * Thống kê chỉ số từ feedback của phụ huynh, học viên
 * Bao gồm cả dữ liệu từ Survey Responses mới
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
    HeartHandshake, TrendingUp, TrendingDown, Users,
    BookOpen, GraduationCap, Building, Star, Calendar,
    ThumbsUp, ThumbsDown, Minus, BarChart3, PieChart, FileText
} from 'lucide-react';
import { useFeedback } from '../src/hooks/useFeedback';
import { useClasses } from '../src/hooks/useClasses';
import { useSurveyResponses } from '../src/hooks/useSurvey';

// Score categories for feedback
const SCORE_CATEGORIES = [
    { key: 'teacherScore', label: 'Giáo viên', icon: GraduationCap, color: 'indigo' },
    { key: 'curriculumScore', label: 'Tiến bộ / Chương trình', icon: BookOpen, color: 'green' },
    { key: 'careScore', label: 'Dịch vụ / Chăm sóc', icon: HeartHandshake, color: 'orange' },
    { key: 'facilitiesScore', label: 'Chất lượng / Cơ sở vật chất', icon: Building, color: 'purple' },
];

export const CustomerServiceDashboard: React.FC = () => {
    const { feedbacks, loading, error } = useFeedback();
    const { classes } = useClasses();
    const { responses: surveyResponses, loading: surveyLoading } = useSurveyResponses();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedClass, setSelectedClass] = useState('');

    // Combine feedbacks and survey responses
    const combinedData = useMemo(() => {
        // Convert survey responses to feedback-like format
        const surveyData = surveyResponses.map(r => ({
            id: r.id,
            date: r.submittedAt?.slice(0, 10),
            type: 'Survey' as const,
            studentId: r.studentId,
            studentName: r.studentName,
            classId: r.classId,
            className: r.className,
            teacherScore: r.teacherScore,
            curriculumScore: r.curriculumScore,
            careScore: r.careScore,
            facilitiesScore: r.facilitiesScore,
            averageScore: r.averageScore,
            source: 'survey'
        }));

        // Combine with existing feedbacks
        const feedbackData = feedbacks.map(f => ({
            ...f,
            source: 'feedback'
        }));

        return [...feedbackData, ...surveyData];
    }, [feedbacks, surveyResponses]);

    // Filter by month and class
    const filteredData = useMemo(() => {
        return combinedData.filter(f => {
            const matchMonth = f.date?.startsWith(selectedMonth);
            const matchClass = !selectedClass || f.classId === selectedClass;
            const hasScores = f.type === 'Form' || f.type === 'Survey';
            return matchMonth && matchClass && hasScores;
        });
    }, [combinedData, selectedMonth, selectedClass]);

    // Calculate statistics for each category
    const categoryStats = useMemo(() => {
        return SCORE_CATEGORIES.map(category => {
            const scores = filteredData
                .map(f => (f as any)[category.key])
                .filter(s => s !== undefined && s !== null && s > 0) as number[];

            const count = scores.length;
            const average = count > 0 ? scores.reduce((a, b) => a + b, 0) / count : 0;
            const excellent = scores.filter(s => s >= 8).length; // 8-10 điểm
            const good = scores.filter(s => s >= 6 && s < 8).length; // 6-8 điểm
            const poor = scores.filter(s => s < 6).length; // < 6 điểm

            return {
                ...category,
                count,
                average: Math.round(average * 10) / 10,
                excellent,
                good,
                poor,
                excellentPercent: count > 0 ? Math.round((excellent / count) * 100) : 0,
                poorPercent: count > 0 ? Math.round((poor / count) * 100) : 0,
            };
        });
    }, [filteredData]);

    // Overall stats
    const overallStats = useMemo(() => {
        const allScores = filteredData
            .map(f => f.averageScore)
            .filter(s => s !== undefined && s !== null && s > 0) as number[];

        const count = allScores.length;
        const average = count > 0 ? allScores.reduce((a, b) => a + b, 0) / count : 0;

        // Trend comparison with previous month
        const prevMonth = new Date(selectedMonth + '-01');
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        const prevMonthStr = prevMonth.toISOString().slice(0, 7);

        const prevData = combinedData.filter(f =>
            f.date?.startsWith(prevMonthStr) && (f.type === 'Form' || f.type === 'Survey')
        );
        const prevScores = prevData
            .map(f => f.averageScore)
            .filter(s => s !== undefined && s !== null && s > 0) as number[];
        const prevAverage = prevScores.length > 0 ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length : 0;

        const trend = average - prevAverage;

        // Count by source
        const surveyCount = filteredData.filter(f => f.source === 'survey').length;
        const feedbackCount = filteredData.filter(f => f.source === 'feedback' && f.type === 'Form').length;
        const callCount = combinedData.filter(f => f.date?.startsWith(selectedMonth) && f.type === 'Call').length;

        return {
            count,
            average: Math.round(average * 10) / 10,
            trend: Math.round(trend * 10) / 10,
            callFeedbacks: callCount,
            formFeedbacks: feedbackCount,
            surveyResponses: surveyCount,
        };
    }, [filteredData, combinedData, selectedMonth]);

    // Distribution by score range
    const scoreDistribution = useMemo(() => {
        const distribution = [
            { range: '8-10', label: 'Xuất sắc', count: 0, color: 'bg-green-500' },
            { range: '6-8', label: 'Tốt', count: 0, color: 'bg-blue-500' },
            { range: '4-6', label: 'Trung bình', count: 0, color: 'bg-yellow-500' },
            { range: '1-4', label: 'Cần cải thiện', count: 0, color: 'bg-red-500' },
        ];

        filteredData.forEach(f => {
            const score = f.averageScore || 0;
            if (score >= 8) distribution[0].count++;
            else if (score >= 6) distribution[1].count++;
            else if (score >= 4) distribution[2].count++;
            else if (score >= 1) distribution[3].count++;
        });

        const total = filteredData.length;
        return distribution.map(d => ({
            ...d,
            percent: total > 0 ? Math.round((d.count / total) * 100) : 0,
        }));
    }, [filteredData]);

    // Top/Bottom performers by class
    const classPerformance = useMemo(() => {
        const classScores: Record<string, { name: string; scores: number[]; count: number }> = {};

        combinedData.filter(f => f.date?.startsWith(selectedMonth) && (f.type === 'Form' || f.type === 'Survey') && f.classId).forEach(f => {
            if (!classScores[f.classId!]) {
                classScores[f.classId!] = { name: f.className || 'N/A', scores: [], count: 0 };
            }
            if (f.averageScore) {
                classScores[f.classId!].scores.push(f.averageScore);
                classScores[f.classId!].count++;
            }
        });

        return Object.entries(classScores)
            .map(([id, data]) => ({
                id,
                name: data.name,
                count: data.count,
                average: data.scores.length > 0 ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10 : 0,
            }))
            .sort((a, b) => b.average - a.average);
    }, [feedbacks, selectedMonth]);

    const getScoreColor = (score: number) => {
        if (score >= 4) return 'text-green-600';
        if (score >= 3) return 'text-blue-600';
        if (score >= 2) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 4) return 'bg-green-100';
        if (score >= 3) return 'bg-blue-100';
        if (score >= 2) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-pink-100 p-2 rounded-lg">
                            <HeartHandshake className="text-pink-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Dashboard Chăm sóc Khách hàng</h2>
                            <p className="text-sm text-gray-500">Thống kê chỉ số từ feedback của phụ huynh, học viên</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-gray-400" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">Tất cả lớp</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Đang tải...</div>
            ) : error ? (
                <div className="text-center py-12 text-red-500">{error}</div>
            ) : (
                <>
                    {/* Overall Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-pink-100 p-2 rounded-lg text-pink-600">
                                    <Star size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Điểm TB tổng</p>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-2xl font-bold ${getScoreColor(overallStats.average)}`}>
                                            {overallStats.average || '-'}
                                        </p>
                                        {overallStats.trend !== 0 && (
                                            <span className={`text-xs flex items-center gap-1 ${overallStats.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {overallStats.trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {overallStats.trend > 0 ? '+' : ''}{overallStats.trend}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phiếu khảo sát</p>
                                    <p className="text-2xl font-bold text-gray-900">{overallStats.formFeedbacks}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                    <ThumbsUp size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Đánh giá tốt (≥4⭐)</p>
                                    <p className="text-2xl font-bold text-green-600">{scoreDistribution[0].count}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                    <HeartHandshake size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Cuộc gọi CSKH</p>
                                    <p className="text-2xl font-bold text-gray-900">{overallStats.callFeedbacks}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {categoryStats.map(cat => {
                            const IconComponent = cat.icon;
                            const colorClass = {
                                indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', bar: 'bg-indigo-500' },
                                green: { bg: 'bg-green-100', text: 'text-green-600', bar: 'bg-green-500' },
                                orange: { bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-500' },
                                purple: { bg: 'bg-purple-100', text: 'text-purple-600', bar: 'bg-purple-500' },
                            }[cat.color];

                            return (
                                <div key={cat.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`${colorClass.bg} p-2 rounded-lg ${colorClass.text}`}>
                                            <IconComponent size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700">{cat.label}</p>
                                            <p className={`text-xl font-bold ${getScoreColor(cat.average)}`}>
                                                {cat.average || '-'} <span className="text-xs text-gray-400">/ 5</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">Tốt (≥4⭐)</span>
                                            <span className="font-medium text-green-600">{cat.excellent} ({cat.excellentPercent}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full ${colorClass.bar} rounded-full`} style={{ width: `${(cat.average / 5) * 100}%` }} />
                                        </div>
                                        {cat.poor > 0 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">Cần cải thiện (&lt;3⭐)</span>
                                                <span className="font-medium text-red-600">{cat.poor} ({cat.poorPercent}%)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Score Distribution & Class Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Score Distribution */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <PieChart size={20} className="text-pink-600" />
                                Phân bố điểm đánh giá
                            </h3>
                            <div className="space-y-3">
                                {scoreDistribution.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-20 text-sm text-gray-600">{item.range}</div>
                                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2`}
                                                style={{ width: `${Math.max(item.percent, 5)}%` }}>
                                                {item.percent > 10 && (
                                                    <span className="text-xs text-white font-medium">{item.percent}%</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-16 text-right">
                                            <span className="text-sm font-medium">{item.count}</span>
                                            <span className="text-xs text-gray-400 ml-1">phiếu</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {filteredData.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    Chưa có dữ liệu feedback trong tháng này
                                </div>
                            )}
                        </div>

                        {/* Class Performance */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <BarChart3 size={20} className="text-pink-600" />
                                Đánh giá theo lớp
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {classPerformance.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        Chưa có dữ liệu feedback theo lớp
                                    </div>
                                ) : classPerformance.map((cls, idx) => (
                                    <div key={cls.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                idx === 1 ? 'bg-gray-200 text-gray-600' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-100 text-gray-500'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-800">{cls.name}</span>
                                            <span className="text-xs text-gray-400 ml-2">({cls.count} phiếu)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getScoreBg(cls.average).replace('bg-', 'bg-')}`}
                                                    style={{ width: `${(cls.average / 5) * 100}%`, backgroundColor: cls.average >= 4 ? '#22C55E' : cls.average >= 3 ? '#3B82F6' : cls.average >= 2 ? '#EAB308' : '#EF4444' }} />
                                            </div>
                                            <span className={`font-bold text-sm ${getScoreColor(cls.average)}`}>{cls.average}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Feedback Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Feedback gần đây (có điểm thấp)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Học viên</th>
                                        <th className="px-4 py-2 text-left">Lớp</th>
                                        <th className="px-4 py-2 text-center">Giáo viên</th>
                                        <th className="px-4 py-2 text-center">Tiến bộ</th>
                                        <th className="px-4 py-2 text-center">Dịch vụ</th>
                                        <th className="px-4 py-2 text-center">Chất lượng</th>
                                        <th className="px-4 py-2 text-center">TB</th>
                                        <th className="px-4 py-2 text-left">Ngày</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredData
                                        .filter(f => (f.averageScore || 0) < 6)
                                        .slice(0, 5)
                                        .map(f => (
                                            <tr key={f.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 font-medium">{f.studentName}</td>
                                                <td className="px-4 py-2 text-gray-600">{f.className}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <ScoreBadge score={f.teacherScore} />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <ScoreBadge score={f.curriculumScore} />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <ScoreBadge score={f.careScore} />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <ScoreBadge score={f.facilitiesScore} />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`px-2 py-1 rounded font-bold ${getScoreBg(f.averageScore || 0)} ${getScoreColor(f.averageScore || 0)}`}>
                                                        {f.averageScore?.toFixed(1) || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-gray-500 text-xs">{f.date}</td>
                                            </tr>
                                        ))}
                                    {filteredData.filter(f => (f.averageScore || 0) < 6).length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-gray-400">
                                                🎉 Không có feedback điểm thấp trong tháng này!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Score Badge Component
const ScoreBadge: React.FC<{ score?: number }> = ({ score }) => {
    if (!score) return <span className="text-gray-300">-</span>;

    const color = score >= 4 ? 'text-green-600' : score >= 3 ? 'text-blue-600' : score >= 2 ? 'text-yellow-600' : 'text-red-600';
    return <span className={`font-medium ${color}`}>{score}</span>;
};
