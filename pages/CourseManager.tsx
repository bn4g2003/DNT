/**
 * Course Manager Page
 * Quản lý khóa học - liên kết với lớp học và tài nguyên
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Plus, Edit, Trash2, X, Search, Users, DollarSign, Clock, 
  TrendingUp, Calendar, Layers, ChevronDown, ChevronRight, Folder, FolderOpen
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { formatCurrency } from '../src/utils/currencyUtils';
import { ClassModel, Student, ClassStatus, ResourceFolder } from '../types';

interface Course {
  id: string;
  name: string;
  code: string;
  level: string;
  totalSessions: number;
  teacherRatio: number;
  assistantRatio: number;
  curriculum: string;
  resourceFolderId?: string;
  resourceFolderName?: string;
  pricePerSession: number;
  originalPrice: number;
  discount: number;
  tuitionFee: number;
  tuitionPerSession: number;
  startDate: string;
  endDate: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt?: string;
}

interface CourseFormData {
  name: string;
  code: string;
  level: string;
  totalSessions: number;
  teacherRatio: number;
  assistantRatio: number;
  curriculum: string;
  resourceFolderId: string;
  pricePerSession: number;
  discount: number;
  startDate: string;
  endDate: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
}

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced'];
const LEVEL_COLORS: Record<string, string> = {
  'Beginner': 'bg-green-100 text-green-700',
  'Elementary': 'bg-blue-100 text-blue-700',
  'Pre-Intermediate': 'bg-cyan-100 text-cyan-700',
  'Intermediate': 'bg-orange-100 text-orange-700',
  'Upper-Intermediate': 'bg-purple-100 text-purple-700',
  'Advanced': 'bg-red-100 text-red-700',
};

export const CourseManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [resourceFolders, setResourceFolders] = useState<ResourceFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  
  const initialFormData: CourseFormData = {
    name: '', code: '', level: 'Beginner', totalSessions: 24,
    teacherRatio: 70, assistantRatio: 30, curriculum: '', resourceFolderId: '',
    pricePerSession: 150000, discount: 0, startDate: '', endDate: '',
    description: '', status: 'active',
  };
  
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);

  useEffect(() => {
    fetchData();
    
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ClassModel[]);
    });
    
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStudents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Student[]);
    });
    
    const unsubFolders = onSnapshot(collection(db, 'resource_folders'), (snapshot) => {
      setResourceFolders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ResourceFolder[]);
    });
    
    return () => { unsubClasses(); unsubStudents(); unsubFolders(); };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const coursesSnap = await getDocs(collection(db, 'courses'));
      setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Course[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build folder tree for picker
  const buildFolderTree = (parentId?: string): ResourceFolder[] => {
    return resourceFolders
      .filter(f => parentId ? f.parentId === parentId : !f.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get folder path for display
  const getFolderPath = (folderId: string): string => {
    const path: string[] = [];
    let currentId: string | undefined = folderId;
    while (currentId) {
      const folder = resourceFolders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder.name);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return path.join(' / ');
  };

  // Get classes linked to a course (by courseId)
  const getLinkedClasses = (course: Course) => {
    return classes.filter(c => c.courseId === course.id);
  };

  // Get students in linked classes
  const getLinkedStudents = (course: Course) => {
    const linkedClassIds = getLinkedClasses(course).map(c => c.id);
    return students.filter(s => 
      linkedClassIds.includes(s.classId || '') ||
      s.classIds?.some(id => linkedClassIds.includes(id))
    );
  };

  // Calculate course statistics
  const getCourseStats = (course: Course) => {
    const linkedClasses = getLinkedClasses(course);
    const linkedStudents = getLinkedStudents(course);
    
    const activeClasses = linkedClasses.filter(c => c.status === ClassStatus.STUDYING).length;
    const totalStudents = linkedStudents.length;
    const activeStudents = linkedStudents.filter(s => s.status === 'Đang học').length;
    const droppedStudents = linkedStudents.filter(s => s.status === 'Nghỉ học').length;
    
    return { totalClasses: linkedClasses.length, activeClasses, totalStudents, activeStudents, droppedStudents };
  };

  // Generate course code automatically
  const generateCourseCode = (): string => {
    const year = new Date().getFullYear().toString().slice(-2);
    const existingCodes = courses.map(c => c.code).filter(c => c.startsWith(`KH${year}`));
    let maxNum = 0;
    existingCodes.forEach(code => {
      const num = parseInt(code.replace(`KH${year}`, '')) || 0;
      if (num > maxNum) maxNum = num;
    });
    return `KH${year}${String(maxNum + 1).padStart(3, '0')}`;
  };

  const calculateTuition = (sessions: number, pricePerSession: number, discount: number) => {
    const original = sessions * pricePerSession;
    return original - (original * (discount / 100));
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        alert('Vui lòng nhập tên khóa học');
        return;
      }
      
      const selectedFolder = resourceFolders.find(f => f.id === formData.resourceFolderId);
      const tuitionFee = calculateTuition(formData.totalSessions, formData.pricePerSession, formData.discount);
      
      const courseData = {
        name: formData.name,
        code: editingCourse ? formData.code : generateCourseCode(), // Auto generate for new
        level: formData.level,
        totalSessions: formData.totalSessions,
        teacherRatio: formData.teacherRatio,
        assistantRatio: formData.assistantRatio,
        curriculum: formData.curriculum,
        resourceFolderId: formData.resourceFolderId || null,
        resourceFolderName: selectedFolder?.name || null,
        pricePerSession: formData.pricePerSession,
        originalPrice: formData.totalSessions * formData.pricePerSession,
        discount: formData.discount,
        tuitionFee,
        tuitionPerSession: Math.round(tuitionFee / formData.totalSessions),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        status: formData.status,
        updatedAt: new Date().toISOString(),
      };

      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.id), courseData);
      } else {
        await addDoc(collection(db, 'courses'), { ...courseData, createdAt: new Date().toISOString() });
      }
      
      setShowModal(false);
      setEditingCourse(null);
      setFormData(initialFormData);
      fetchData();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Lỗi lưu khóa học');
    }
  };

  const handleDelete = async (course: Course) => {
    const linkedClasses = getLinkedClasses(course);
    if (linkedClasses.length > 0) {
      alert(`Không thể xóa khóa học này vì đang có ${linkedClasses.length} lớp học liên kết.`);
      return;
    }
    if (!confirm(`Xóa khóa học "${course.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'courses', course.id));
      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Lỗi xóa khóa học');
    }
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name, code: course.code, level: course.level,
      totalSessions: course.totalSessions, teacherRatio: course.teacherRatio,
      assistantRatio: course.assistantRatio, curriculum: course.curriculum,
      resourceFolderId: course.resourceFolderId || '',
      pricePerSession: course.pricePerSession, discount: course.discount,
      startDate: course.startDate, endDate: course.endDate,
      description: course.description || '', status: course.status,
    });
    setShowModal(true);
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.curriculum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = !filterLevel || c.level === filterLevel;
      const matchStatus = !filterStatus || c.status === filterStatus;
      return matchSearch && matchLevel && matchStatus;
    });
  }, [courses, searchTerm, filterLevel, filterStatus]);

  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'active').length;
  const totalLinkedClasses = courses.reduce((sum, c) => sum + getLinkedClasses(c).length, 0);
  const totalLinkedStudents = courses.reduce((sum, c) => sum + getLinkedStudents(c).length, 0);

  // Folder Picker Component
  const FolderPickerItem: React.FC<{ folder: ResourceFolder; level: number }> = ({ folder, level }) => {
    const children = buildFolderTree(folder.id);
    const [expanded, setExpanded] = useState(false);
    const isSelected = formData.resourceFolderId === folder.id;
    
    return (
      <div>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 rounded ${isSelected ? 'bg-indigo-50 text-indigo-700' : ''}`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => setFormData({ ...formData, resourceFolderId: folder.id })}
        >
          {children.length > 0 ? (
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0.5">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : <span className="w-5" />}
          <Folder size={16} style={{ color: folder.color || '#6366f1' }} />
          <span className="text-sm">{folder.name}</span>
        </div>
        {expanded && children.map(child => (
          <FolderPickerItem key={child.id} folder={child} level={level + 1} />
        ))}
      </div>
    );
  };


  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khóa học</h1>
          <p className="text-gray-500 mt-1">Thiết lập khóa học, liên kết lớp học và tài nguyên</p>
        </div>
        <button
          onClick={() => { setEditingCourse(null); setFormData(initialFormData); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={18} /> Tạo khóa học
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg"><BookOpen size={20} className="text-indigo-600" /></div>
            <div><p className="text-sm text-gray-500">Tổng khóa học</p><p className="text-xl font-bold">{totalCourses}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Đang hoạt động</p><p className="text-xl font-bold">{activeCourses}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Layers size={20} className="text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Lớp học liên kết</p><p className="text-xl font-bold">{totalLinkedClasses}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Users size={20} className="text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">Học viên</p><p className="text-xl font-bold">{totalLinkedStudents}</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Tìm kiếm khóa học..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tất cả trình độ</option>
            {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm dừng</option>
            <option value="draft">Nháp</option>
          </select>
        </div>
      </div>

      {/* Course List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có khóa học nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map(course => {
            const stats = getCourseStats(course);
            const linkedClasses = getLinkedClasses(course);
            const isExpanded = expandedCourse === course.id;
            
            return (
              <div key={course.id} className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <button onClick={() => setExpandedCourse(isExpanded ? null : course.id)} className="p-1 hover:bg-gray-100 rounded mt-1">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{course.name}</h3>
                          <span className="text-xs text-gray-400">#{course.code}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[course.level] || 'bg-gray-100'}`}>{course.level}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${course.status === 'active' ? 'bg-green-100 text-green-700' : course.status === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                            {course.status === 'active' ? 'Hoạt động' : course.status === 'inactive' ? 'Tạm dừng' : 'Nháp'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
                          <span className="flex items-center gap-1"><Clock size={14} /> {course.totalSessions} buổi</span>
                          <span>GV/TG: {course.teacherRatio}/{course.assistantRatio}%</span>
                          <span className="flex items-center gap-1"><DollarSign size={14} /> {formatCurrency(course.pricePerSession)}/buổi</span>
                          {course.discount > 0 && <span className="text-red-500">-{course.discount}%</span>}
                          <span className="font-medium text-indigo-600">Học phí: {formatCurrency(course.tuitionFee)}</span>
                        </div>
                        
                        {/* Resource folder link */}
                        {course.resourceFolderId && (
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <FolderOpen size={14} className="text-indigo-500" />
                            <span className="text-indigo-600">Tài nguyên: {getFolderPath(course.resourceFolderId)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-blue-600">{stats.totalClasses} lớp ({stats.activeClasses} đang học)</span>
                          <span className="text-green-600">{stats.activeStudents} học viên</span>
                          {stats.droppedStudents > 0 && <span className="text-red-500">{stats.droppedStudents} nghỉ</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(course)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Sửa"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(course)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded: Linked Classes */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Lớp học thuộc khóa này ({linkedClasses.length})</h4>
                    {linkedClasses.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có lớp học nào liên kết. Lớp học có giáo trình trùng tên/mã khóa học sẽ tự động liên kết.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {linkedClasses.map(cls => {
                          const classStudents = students.filter(s => s.classId === cls.id || s.classIds?.includes(cls.id));
                          return (
                            <div key={cls.id} className="bg-white rounded-lg border p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{cls.name}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${cls.status === ClassStatus.STUDYING ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{cls.status}</span>
                              </div>
                              <div className="text-sm text-gray-500 space-y-1">
                                <p>GV: {cls.teacher || 'Chưa có'}</p>
                                <p>Lịch: {cls.schedule || 'Chưa có'}</p>
                                <p>Học viên: {classStudents.length}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* Course Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editingCourse ? 'Sửa khóa học' : 'Tạo khóa học mới'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="VD: Tiếng Anh Giao Tiếp Cơ Bản" />
                </div>
                
                {editingCourse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã khóa học</label>
                    <input type="text" value={formData.code} readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500" />
                    <p className="text-xs text-gray-400 mt-1">Mã tự động tạo, không thể sửa</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trình độ</label>
                  <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tổng số buổi</label>
                  <input type="number" value={formData.totalSessions} onChange={(e) => setFormData({ ...formData, totalSessions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                    <option value="draft">Nháp</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ lệ Giáo viên (%)</label>
                  <input type="number" value={formData.teacherRatio}
                    onChange={(e) => { const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0)); setFormData({ ...formData, teacherRatio: val, assistantRatio: 100 - val }); }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" min={0} max={100} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ lệ Trợ giảng (%)</label>
                  <input type="number" value={formData.assistantRatio} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giáo trình</label>
                  <input type="text" value={formData.curriculum} onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="VD: Cambridge English, IELTS Foundation..." />
                  <p className="text-xs text-gray-400 mt-1">* Lớp học có giáo trình trùng sẽ tự động liên kết với khóa học này</p>
                </div>
                
                {/* Resource Folder Picker */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thư mục tài nguyên</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowFolderPicker(!showFolderPicker)}
                      className="w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      {formData.resourceFolderId ? (
                        <span className="flex items-center gap-2">
                          <Folder size={16} className="text-indigo-500" />
                          {getFolderPath(formData.resourceFolderId)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Chọn thư mục tài nguyên...</span>
                      )}
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                    
                    {showFolderPicker && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${!formData.resourceFolderId ? 'bg-indigo-50 text-indigo-700' : ''}`}
                          onClick={() => { setFormData({ ...formData, resourceFolderId: '' }); setShowFolderPicker(false); }}
                        >
                          <span className="text-sm text-gray-500">-- Không chọn --</span>
                        </div>
                        {buildFolderTree().map(folder => (
                          <div key={folder.id} onClick={() => setShowFolderPicker(false)}>
                            <FolderPickerItem folder={folder} level={0} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">* Học viên thuộc khóa học này có thể xem tài nguyên trong thư mục đã chọn</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá/buổi học</label>
                  <input type="number" value={formData.pricePerSession} onChange={(e) => setFormData({ ...formData, pricePerSession: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
                  <input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" min={0} max={100} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" rows={2} placeholder="Mô tả khóa học..." />
                </div>
              </div>
              
              {/* Preview */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-medium text-indigo-900 mb-2">Tính toán học phí</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-indigo-600">Giá gốc:</span><p className="font-medium">{formatCurrency(formData.totalSessions * formData.pricePerSession)}</p></div>
                  <div><span className="text-indigo-600">Giảm giá:</span><p className="font-medium text-red-500">-{formatCurrency((formData.totalSessions * formData.pricePerSession) * (formData.discount / 100))}</p></div>
                  <div><span className="text-indigo-600">Học phí:</span><p className="font-bold text-indigo-700">{formatCurrency(calculateTuition(formData.totalSessions, formData.pricePerSession, formData.discount))}</p></div>
                  <div><span className="text-indigo-600">Học phí/buổi:</span><p className="font-medium">{formatCurrency(Math.round(calculateTuition(formData.totalSessions, formData.pricePerSession, formData.discount) / formData.totalSessions))}</p></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Hủy</button>
              <button onClick={handleSave} disabled={!formData.name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {editingCourse ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
