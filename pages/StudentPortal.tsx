/**
 * Student Portal Page
 * Cổng thông tin học viên: Dashboard, Lịch học, Bài tập
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap, Calendar, BookOpen, Bell, LogOut, User, Clock,
    CheckCircle, AlertCircle, ChevronRight, Home, FileText, Star, Send,
    FolderOpen, Video, Link2, Image, Music, ExternalLink, Eye
} from 'lucide-react';
import { StudentAuthService, StudentSession } from '../src/services/studentAuthService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { useStudentSurveys } from '../src/hooks/useSurvey';
import { SurveyService } from '../src/services/surveyService';
import { SurveyAssignment, SurveyTemplate, SurveyQuestion } from '../src/types/surveyTypes';
import { Resource, ResourceFolder, ResourceType } from '../types';

type TabType = 'dashboard' | 'schedule' | 'homework' | 'survey' | 'resources';

interface ScheduleItem {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
    teacherName?: string;
}

interface HomeworkItem {
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
    classId: string;
    className: string;
}

interface CourseInfo {
    id: string;
    name: string;
    resourceFolderId?: string;
    resourceFolderName?: string;
}

const TYPE_ICONS: Record<ResourceType, React.ElementType> = {
    video: Video,
    document: FileText,
    link: Link2,
    image: Image,
    audio: Music,
};

const TYPE_COLORS: Record<ResourceType, string> = {
    video: 'text-red-500 bg-red-50',
    document: 'text-blue-500 bg-blue-50',
    link: 'text-green-500 bg-green-50',
    image: 'text-purple-500 bg-purple-50',
    audio: 'text-orange-500 bg-orange-50',
};

const TYPE_LABELS: Record<ResourceType, string> = {
    video: 'Video',
    document: 'Tài liệu',
    link: 'Link web',
    image: 'Hình ảnh',
    audio: 'Audio',
};

export const StudentPortal: React.FC = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState<StudentSession | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [classInfo, setClassInfo] = useState<any>(null);
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Course & Resources states
    const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
    const [courseResources, setCourseResources] = useState<Resource[]>([]);
    const [resourceFolders, setResourceFolders] = useState<ResourceFolder[]>([]);
    const [currentResourceFolderId, setCurrentResourceFolderId] = useState<string | null>(null);
    const [resourceBreadcrumb, setResourceBreadcrumb] = useState<ResourceFolder[]>([]);
    
    // Survey states
    const [pendingSurveys, setPendingSurveys] = useState<SurveyAssignment[]>([]);
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyAssignment | null>(null);
    const [surveyTemplate, setSurveyTemplate] = useState<SurveyTemplate | null>(null);
    const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | number>>({});
    const [surveyComments, setSurveyComments] = useState('');
    const [submittingSurvey, setSubmittingSurvey] = useState(false);

    // Check session và load data
    useEffect(() => {
        const studentSession = StudentAuthService.getSession();
        if (!studentSession) {
            navigate('/student/login');
            return;
        }
        setSession(studentSession);
        loadStudentData(studentSession);
    }, [navigate]);

    // Load resources for a specific folder (course's resource folder)
    const loadCourseResources = async (folderId: string, navigateToFolderId?: string | null) => {
        try {
            // Load all folders and resources
            const [foldersSnap, resourcesSnap] = await Promise.all([
                getDocs(collection(db, 'resource_folders')),
                getDocs(collection(db, 'resources'))
            ]);
            
            const allFolders = foldersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ResourceFolder[];
            const allResources = resourcesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Resource[];
            
            setResourceFolders(allFolders);
            
            // Get all descendant folder IDs of the course's resource folder
            const getDescendantFolderIds = (parentId: string): string[] => {
                const children = allFolders.filter(f => f.parentId === parentId);
                let ids = [parentId];
                for (const child of children) {
                    ids = [...ids, ...getDescendantFolderIds(child.id)];
                }
                return ids;
            };
            
            const allowedFolderIds = getDescendantFolderIds(folderId);
            
            // Determine which folder to show
            const targetFolderId = navigateToFolderId !== undefined ? navigateToFolderId : folderId;
            setCurrentResourceFolderId(targetFolderId);
            
            // Filter resources for current folder view
            const currentResources = allResources.filter(r => 
                targetFolderId ? r.folderId === targetFolderId : r.folderId === folderId
            );
            setCourseResources(currentResources);
            
            // Build breadcrumb
            if (targetFolderId && targetFolderId !== folderId) {
                const path: ResourceFolder[] = [];
                let currentId: string | null | undefined = targetFolderId;
                while (currentId && currentId !== folderId) {
                    const folder = allFolders.find(f => f.id === currentId);
                    if (folder) {
                        path.unshift(folder);
                        currentId = folder.parentId;
                    } else {
                        break;
                    }
                }
                setResourceBreadcrumb(path);
            } else {
                setResourceBreadcrumb([]);
            }
        } catch (err) {
            console.error('Error loading course resources:', err);
        }
    };

    // Navigate to a subfolder within course resources
    const navigateToResourceFolder = (folderId: string | null) => {
        if (courseInfo?.resourceFolderId) {
            loadCourseResources(courseInfo.resourceFolderId, folderId || courseInfo.resourceFolderId);
        }
    };

    // Get subfolders of current folder
    const getCurrentSubfolders = (): ResourceFolder[] => {
        if (!currentResourceFolderId) return [];
        return resourceFolders.filter(f => f.parentId === currentResourceFolderId);
    };

    // Handle resource view
    const handleViewResource = (resource: Resource) => {
        if (resource.url) {
            window.open(resource.url, '_blank');
        } else if (resource.fileUrl) {
            window.open(resource.fileUrl, '_blank');
        }
    };

    const loadStudentData = async (studentSession: StudentSession) => {
        setLoading(true);
        try {
            // Load class info
            if (studentSession.classId) {
                try {
                    const classDoc = await getDocs(
                        query(collection(db, 'classes'), where('__name__', '==', studentSession.classId))
                    );
                    if (!classDoc.empty) {
                        const classData = { id: classDoc.docs[0].id, ...classDoc.docs[0].data() } as any;
                        setClassInfo(classData);
                        
                        // Load course info based on courseId (direct link)
                        if (classData.courseId) {
                            try {
                                const coursesQuery = query(collection(db, 'courses'));
                                const coursesSnapshot = await getDocs(coursesQuery);
                                const courses = coursesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as CourseInfo[];
                                
                                // Find course by courseId
                                const matchedCourse = courses.find(c => c.id === classData.courseId);
                                
                                if (matchedCourse) {
                                    setCourseInfo(matchedCourse);
                                    
                                    // Load resources if course has resourceFolderId
                                    if (matchedCourse.resourceFolderId) {
                                        await loadCourseResources(matchedCourse.resourceFolderId);
                                    }
                                }
                            } catch (err) {
                                console.warn('Error loading course info:', err);
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Error loading class info:', err);
                }

                // Load schedules for this class
                try {
                    const schedulesQuery = query(
                        collection(db, 'schedules'),
                        where('classId', '==', studentSession.classId)
                    );
                    const schedulesSnapshot = await getDocs(schedulesQuery);
                    setSchedules(schedulesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as ScheduleItem[]);
                } catch (err) {
                    console.warn('Error loading schedules:', err);
                }

                // Load homeworks - simple query without orderBy to avoid index requirement
                try {
                    const homeworksQuery = query(
                        collection(db, 'homeworks'),
                        where('classId', '==', studentSession.classId)
                    );
                    const homeworksSnapshot = await getDocs(homeworksQuery);
                    const hwList = homeworksSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as HomeworkItem[];
                    // Sort in memory
                    hwList.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
                    setHomeworks(hwList);
                } catch (err) {
                    console.warn('Error loading homeworks:', err);
                }
            }
            
            // Load pending surveys for this student
            if (studentSession.studentId) {
                try {
                    console.log('Loading surveys for studentId:', studentSession.studentId);
                    const surveys = await SurveyService.getStudentPendingSurveys(studentSession.studentId);
                    console.log('Found surveys:', surveys);
                    setPendingSurveys(surveys);
                } catch (err) {
                    console.warn('Error loading surveys:', err);
                }
            }
        } catch (err) {
            console.error('Error loading student data:', err);
        } finally {
            setLoading(false);
        }
    };
    
    // Load survey template when selected
    const handleSelectSurvey = async (survey: SurveyAssignment) => {
        setSelectedSurvey(survey);
        setSurveyAnswers({});
        setSurveyComments('');
        try {
            const template = await SurveyService.getTemplate(survey.templateId);
            setSurveyTemplate(template);
        } catch (err) {
            console.error('Error loading survey template:', err);
        }
    };
    
    // Submit survey
    const handleSubmitSurvey = async () => {
        if (!selectedSurvey || !surveyTemplate || !session) return;
        
        // Validate required questions
        const requiredQuestions = surveyTemplate.questions.filter(q => q.required);
        for (const q of requiredQuestions) {
            if (!surveyAnswers[q.id] && surveyAnswers[q.id] !== 0) {
                alert(`Vui lòng trả lời câu hỏi: ${q.question}`);
                return;
            }
        }
        
        setSubmittingSurvey(true);
        try {
            await SurveyService.submitResponse({
                assignmentId: selectedSurvey.id,
                templateId: surveyTemplate.id,
                templateName: surveyTemplate.name,
                studentId: session.studentId,
                studentName: session.studentName,
                studentCode: session.studentCode,
                classId: session.classId,
                className: session.className,
                teacherScore: surveyAnswers['teacher'] as number | undefined,
                curriculumScore: surveyAnswers['curriculum'] as number | undefined,
                careScore: surveyAnswers['care'] as number | undefined,
                facilitiesScore: surveyAnswers['facilities'] as number | undefined,
                answers: surveyAnswers,
                comments: surveyComments,
                submittedAt: new Date().toISOString(),
                submittedBy: 'student',
                submitterName: session.studentName
            });
            
            // Refresh surveys
            const surveys = await SurveyService.getStudentPendingSurveys(session.studentId);
            setPendingSurveys(surveys);
            setSelectedSurvey(null);
            setSurveyTemplate(null);
            alert('Cảm ơn bạn đã gửi đánh giá!');
        } catch (err) {
            console.error('Error submitting survey:', err);
            alert('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSubmittingSurvey(false);
        }
    };

    const handleLogout = () => {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            StudentAuthService.logout();
            navigate('/student/login');
        }
    };

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const today = new Date().getDay();

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <GraduationCap size={28} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Xin chào, {session.studentName}</h1>
                                <p className="text-emerald-100 text-sm">
                                    Mã HV: {session.studentCode} • Lớp: {session.className || 'Chưa xếp lớp'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex gap-1">
                        {[
                            { id: 'dashboard', label: 'Trang chủ', icon: Home },
                            { id: 'schedule', label: 'Lịch học', icon: Calendar },
                            { id: 'homework', label: 'Bài tập', icon: BookOpen },
                            { id: 'resources', label: 'Tài nguyên', icon: FolderOpen, badge: courseInfo?.resourceFolderId ? undefined : 0 },
                            { id: 'survey', label: 'Khảo sát', icon: FileText, badge: pendingSurveys.length },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-emerald-600 text-emerald-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                                {tab.badge && tab.badge > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                    </div>
                ) : activeTab === 'dashboard' ? (
                    /* Dashboard */
                    <div className="space-y-6">
                        {/* Pending Surveys Alert */}
                        {pendingSurveys.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <FileText size={20} className="text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-orange-800">
                                            Bạn có {pendingSurveys.length} khảo sát cần điền
                                        </p>
                                        <p className="text-sm text-orange-600">
                                            Vui lòng dành ít phút để đánh giá chất lượng dịch vụ
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('survey')}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                                    >
                                        Điền ngay
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl p-5 shadow-sm border">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <Calendar size={24} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800">{schedules.length}</p>
                                        <p className="text-sm text-gray-500">Buổi học/tuần</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <BookOpen size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800">
                                            {homeworks.filter(h => h.status === 'pending').length}
                                        </p>
                                        <p className="text-sm text-gray-500">Bài tập chưa làm</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <User size={24} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800">{classInfo?.teacherName || '-'}</p>
                                        <p className="text-sm text-gray-500">Giáo viên</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Today's Schedule */}
                        <div className="bg-white rounded-xl shadow-sm border">
                            <div className="p-4 border-b">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Clock size={18} className="text-emerald-600" />
                                    Lịch học hôm nay ({dayNames[today]})
                                </h3>
                            </div>
                            <div className="p-4">
                                {schedules.filter(s => s.dayOfWeek === today).length > 0 ? (
                                    <div className="space-y-3">
                                        {schedules.filter(s => s.dayOfWeek === today).map(schedule => (
                                            <div key={schedule.id} className="flex items-center gap-4 p-3 bg-emerald-50 rounded-lg">
                                                <div className="text-emerald-600 font-semibold">
                                                    {schedule.startTime} - {schedule.endTime}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{session.className}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Phòng: {schedule.room || 'TBD'} • GV: {schedule.teacherName || classInfo?.teacherName || 'TBD'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Hôm nay không có lịch học</p>
                                )}
                            </div>
                        </div>

                        {/* Recent Homework */}
                        <div className="bg-white rounded-xl shadow-sm border">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <BookOpen size={18} className="text-blue-600" />
                                    Bài tập gần đây
                                </h3>
                                <button
                                    onClick={() => setActiveTab('homework')}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                    Xem tất cả <ChevronRight size={16} />
                                </button>
                            </div>
                            <div className="p-4">
                                {homeworks.slice(0, 3).length > 0 ? (
                                    <div className="space-y-3">
                                        {homeworks.slice(0, 3).map(hw => (
                                            <div key={hw.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">{hw.title}</p>
                                                    <p className="text-sm text-gray-500">Hạn: {new Date(hw.dueDate).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${hw.status === 'submitted' ? 'bg-green-100 text-green-700' :
                                                        hw.status === 'graded' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {hw.status === 'submitted' ? 'Đã nộp' :
                                                        hw.status === 'graded' ? 'Đã chấm' : 'Chưa làm'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Chưa có bài tập</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'schedule' ? (
                    /* Schedule Tab */
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-gray-800">Lịch học trong tuần</h3>
                        </div>
                        <div className="p-4">
                            {schedules.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3, 4, 5, 6, 0].map(day => {
                                        const daySchedules = schedules.filter(s => s.dayOfWeek === day);
                                        if (daySchedules.length === 0) return null;
                                        return (
                                            <div key={day} className={`p-4 rounded-xl border ${day === today ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50'}`}>
                                                <h4 className={`font-semibold mb-3 ${day === today ? 'text-emerald-700' : 'text-gray-700'}`}>
                                                    {dayNames[day]} {day === today && '(Hôm nay)'}
                                                </h4>
                                                {daySchedules.map(schedule => (
                                                    <div key={schedule.id} className="text-sm">
                                                        <p className="font-medium">{schedule.startTime} - {schedule.endTime}</p>
                                                        <p className="text-gray-500">Phòng: {schedule.room || 'TBD'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Chưa có lịch học</p>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'homework' ? (
                    /* Homework Tab */
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-gray-800">Danh sách bài tập</h3>
                        </div>
                        <div className="p-4">
                            {homeworks.length > 0 ? (
                                <div className="space-y-4">
                                    {homeworks.map(hw => (
                                        <div key={hw.id} className="p-4 border rounded-xl">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{hw.title}</h4>
                                                    {hw.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{hw.description}</p>
                                                    )}
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        Hạn nộp: {new Date(hw.dueDate).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${hw.status === 'submitted' ? 'bg-green-100 text-green-700' :
                                                        hw.status === 'graded' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {hw.status === 'submitted' ? 'Đã nộp' :
                                                        hw.status === 'graded' ? 'Đã chấm' : 'Chưa làm'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Chưa có bài tập</p>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'survey' ? (
                    /* Survey Tab */
                    <div className="space-y-6">
                        {selectedSurvey && surveyTemplate ? (
                            /* Survey Form */
                            <div className="bg-white rounded-xl shadow-sm border">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{surveyTemplate.name}</h3>
                                        <p className="text-sm text-gray-500">{surveyTemplate.description}</p>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedSurvey(null); setSurveyTemplate(null); }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        Quay lại
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    {surveyTemplate.questions.sort((a, b) => a.order - b.order).map(question => (
                                        <div key={question.id} className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {question.question} {question.required && <span className="text-red-500">*</span>}
                                            </label>
                                            {question.type === 'score' ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                                                        <button
                                                            key={score}
                                                            type="button"
                                                            onClick={() => setSurveyAnswers({ ...surveyAnswers, [question.id]: score })}
                                                            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                                                                surveyAnswers[question.id] === score
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
                                            ) : question.type === 'text' ? (
                                                <textarea
                                                    value={(surveyAnswers[question.id] as string) || ''}
                                                    onChange={(e) => setSurveyAnswers({ ...surveyAnswers, [question.id]: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                    placeholder="Nhập câu trả lời..."
                                                />
                                            ) : question.type === 'choice' ? (
                                                <div className="space-y-2">
                                                    {question.options?.map(option => (
                                                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={question.id}
                                                                checked={surveyAnswers[question.id] === option}
                                                                onChange={() => setSurveyAnswers({ ...surveyAnswers, [question.id]: option })}
                                                                className="text-emerald-600"
                                                            />
                                                            <span>{option}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                    
                                    {/* Additional Comments */}
                                    <div className="space-y-2 pt-4 border-t">
                                        <label className="block text-sm font-medium text-gray-700">Ý kiến đóng góp khác</label>
                                        <textarea
                                            value={surveyComments}
                                            onChange={(e) => setSurveyComments(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Nhập ý kiến của bạn (không bắt buộc)..."
                                        />
                                    </div>
                                    
                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmitSurvey}
                                        disabled={submittingSurvey}
                                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submittingSurvey ? (
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
                                </div>
                            </div>
                        ) : (
                            /* Survey List */
                            <div className="bg-white rounded-xl shadow-sm border">
                                <div className="p-4 border-b">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <FileText size={18} className="text-orange-600" />
                                        Khảo sát cần điền
                                    </h3>
                                </div>
                                <div className="p-4">
                                    {pendingSurveys.length > 0 ? (
                                        <div className="space-y-3">
                                            {pendingSurveys.map(survey => (
                                                <div
                                                    key={survey.id}
                                                    className="p-4 border rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition-colors"
                                                    onClick={() => handleSelectSurvey(survey)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800">{survey.templateName}</h4>
                                                            <p className="text-sm text-gray-500">
                                                                Gán ngày: {new Date(survey.assignedAt).toLocaleDateString('vi-VN')}
                                                            </p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                            Chờ điền
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <CheckCircle size={48} className="mx-auto text-green-300 mb-4" />
                                            <p className="text-gray-500 mb-2">Hiện tại không có khảo sát nào cần điền</p>
                                            <p className="text-xs text-gray-400">
                                                Mã HV: {session?.studentCode} • ID: {session?.studentId?.slice(0, 8)}...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'resources' ? (
                    /* Resources Tab */
                    <div className="space-y-6">
                        {courseInfo?.resourceFolderId ? (
                            <>
                                {/* Course Info Header */}
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <FolderOpen size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Tài nguyên khóa học</h3>
                                            <p className="text-indigo-100 text-sm">{courseInfo.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Breadcrumb */}
                                {resourceBreadcrumb.length > 0 && (
                                    <div className="flex items-center gap-1 text-sm bg-white rounded-lg border p-3">
                                        <button
                                            onClick={() => navigateToResourceFolder(courseInfo.resourceFolderId!)}
                                            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
                                        >
                                            <Home size={14} />
                                            <span>Gốc</span>
                                        </button>
                                        {resourceBreadcrumb.map((folder, idx) => (
                                            <React.Fragment key={folder.id}>
                                                <ChevronRight size={14} className="text-gray-400" />
                                                <button
                                                    onClick={() => navigateToResourceFolder(folder.id)}
                                                    className={`px-2 py-1 rounded hover:bg-gray-100 truncate max-w-[120px] ${idx === resourceBreadcrumb.length - 1 ? 'font-semibold text-indigo-600' : 'text-gray-600'}`}
                                                >
                                                    {folder.name}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}

                                {/* Subfolders */}
                                {getCurrentSubfolders().length > 0 && (
                                    <div className="bg-white rounded-xl border p-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                                            <FolderOpen size={16} /> Thư mục ({getCurrentSubfolders().length})
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {getCurrentSubfolders().map(folder => (
                                                <button
                                                    key={folder.id}
                                                    onClick={() => navigateToResourceFolder(folder.id)}
                                                    className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 border transition-all"
                                                >
                                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${folder.color || '#6366f1'}20` }}>
                                                        <FolderOpen size={24} style={{ color: folder.color || '#6366f1' }} />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-800 text-center truncate w-full">{folder.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Resources */}
                                <div className="bg-white rounded-xl border">
                                    <div className="p-4 border-b">
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <FileText size={18} className="text-blue-600" />
                                            Tài nguyên ({courseResources.length})
                                        </h4>
                                    </div>
                                    <div className="p-4">
                                        {courseResources.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {courseResources.map(resource => {
                                                    const Icon = TYPE_ICONS[resource.type];
                                                    const colorClass = TYPE_COLORS[resource.type];
                                                    return (
                                                        <div
                                                            key={resource.id}
                                                            className="p-4 border rounded-xl hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
                                                            onClick={() => handleViewResource(resource)}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorClass}`}>
                                                                    <Icon size={22} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h5 className="font-medium text-gray-900 truncate">{resource.name}</h5>
                                                                    <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[resource.type]}</p>
                                                                    {resource.description && (
                                                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{resource.description}</p>
                                                                    )}
                                                                </div>
                                                                <ExternalLink size={16} className="text-gray-400 flex-shrink-0" />
                                                            </div>
                                                            {resource.tags && resource.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-3">
                                                                    {resource.tags.slice(0, 3).map(tag => (
                                                                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                                                <p className="text-gray-500">Chưa có tài nguyên trong thư mục này</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-xl border p-12 text-center">
                                <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 mb-2">Khóa học của bạn chưa có tài nguyên</p>
                                <p className="text-sm text-gray-400">Liên hệ giáo viên để biết thêm thông tin</p>
                            </div>
                        )}
                    </div>
                ) : null}
            </main>
        </div>
    );
};
