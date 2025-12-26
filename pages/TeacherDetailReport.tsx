/**
 * Teacher Detail Report Page
 * Báo cáo chi tiết giáo viên
 */

import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, Clock, TrendingUp, Award, FileText, Search, Filter,
  Download, RefreshCw, Edit, Save, X, ChevronDown, BarChart3
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { Staff, ClassModel, Student, AttendanceRecord, StudentAttendance, TeacherDetailReport as TeacherReport } from '../types';
import * as teacherReportService from '../src/services/teacherReportService';

interface TeacherStats {
  teacherId: string;
  teacherName: string;
  role: string;
  totalClasses: number;
  totalSessions: number;
  totalStudents: number;
  droppedStudents: number;
  standardRate: number;
  attendanceRate: number;
  homeworkRate: number;
  averageTestScore: number;
  managerNote?: string;
}

export const TeacherDetailReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStats[]>([]);
  const [savedReports, setSavedReports] = useState<TeacherReport[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (teachers.length > 0 && classes.length > 0) {
      calculateStats();
    }
  }, [teachers, classes, students, attendance, selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffSnap, classesSnap, studentsSnap, attendanceSnap, reportsSnap] = await Promise.all([
        getDocs(collection(db, 'staff')),
        getDocs(collection(db, 'classes')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'student_attendance')),
        getDocs(collection(db, 'teacher_reports')),
      ]);
      
      const allStaff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Staff[];
      const teacherStaff = allStaff.filter(s => 
        s.role === 'Giáo viên' || s.role === 'Trợ giảng' || 
        s.roles?.includes('Giáo viên') || s.roles?.includes('Trợ giảng')
      );
      
      setTeachers(teacherStaff);
      setClasses(classesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ClassModel[]);
      setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[]);
      setAttendance(attendanceSnap.docs.map(d => ({ id: d.id, ...d.data() })) as StudentAttendance[]);
      setSavedReports(reportsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as TeacherReport[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats: TeacherStats[] = teachers.map(teacher => {
      // Find classes taught by this teacher
      const teacherClasses = classes.filter(c => 
        c.teacherId === teacher.id || 
        c.teacher === teacher.name ||
        c.assistant === teacher.name
      );
      
      // Active classes only
      const activeClasses = teacherClasses.filter(c => c.status === 'Đang học');
      
      // Students in these classes
      const classIds = activeClasses.map(c => c.id);
      const classStudents = students.filter(s => 
        s.classIds?.some(id => classIds.includes(id)) ||
        classIds.includes(s.classId || '')
      );
      
      const activeStudents = classStudents.filter(s => s.status === 'Đang học');
      const droppedStudents = classStudents.filter(s => s.status === 'Nghỉ học');
      
      // Calculate total sessions from active classes
      const totalSessions = activeClasses.reduce((sum, c) => {
        const progress = c.progress?.match(/(\d+)\/(\d+)/);
        return sum + (progress ? parseInt(progress[1]) : 0);
      }, 0);
      
      // Attendance rate
      const studentIds = activeStudents.map(s => s.id);
      const studentAttendance = attendance.filter(a => 
        studentIds.includes(a.studentId) &&
        a.date?.startsWith(selectedPeriod)
      );
      
      const totalAttendanceRecords = studentAttendance.length;
      const presentRecords = studentAttendance.filter(a => 
        a.status === 'Đúng giờ' || a.status === 'Trễ giờ'
      ).length;
      const attendanceRate = totalAttendanceRecords > 0 
        ? Math.round((presentRecords / totalAttendanceRecords) * 100) 
        : 0;
      
      // Homework rate
      const homeworkRecords = studentAttendance.filter(a => a.homeworkCompletion !== undefined);
      const homeworkRate = homeworkRecords.length > 0
        ? Math.round(homeworkRecords.reduce((sum, a) => sum + (a.homeworkCompletion || 0), 0) / homeworkRecords.length)
        : 0;
      
      // Average test score
      const testRecords = studentAttendance.filter(a => a.score !== undefined && a.score > 0);
      const averageTestScore = testRecords.length > 0
        ? Math.round(testRecords.reduce((sum, a) => sum + (a.score || 0), 0) / testRecords.length * 10) / 10
        : 0;
      
      // Standard rate (students with attendance >= 80% and homework >= 70%)
      const standardStudents = activeStudents.filter(s => {
        const sAttendance = studentAttendance.filter(a => a.studentId === s.id);
        const sPresent = sAttendance.filter(a => a.status === 'Đúng giờ' || a.status === 'Trễ giờ').length;
        const sRate = sAttendance.length > 0 ? (sPresent / sAttendance.length) * 100 : 0;
        const sHomework = sAttendance.filter(a => a.homeworkCompletion !== undefined);
        const sHwRate = sHomework.length > 0 
          ? sHomework.reduce((sum, a) => sum + (a.homeworkCompletion || 0), 0) / sHomework.length 
          : 0;
        return sRate >= 80 && sHwRate >= 70;
      });
      const standardRate = activeStudents.length > 0
        ? Math.round((standardStudents.length / activeStudents.length) * 100)
        : 0;
      
      // Get saved note
      const savedReport = savedReports.find(r => 
        r.teacherId === teacher.id && r.period === selectedPeriod
      );
      
      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        role: teacher.role,
        totalClasses: activeClasses.length,
        totalSessions,
        totalStudents: activeStudents.length,
        droppedStudents: droppedStudents.length,
        standardRate,
        attendanceRate,
        homeworkRate,
        averageTestScore,
        managerNote: savedReport?.managerNote,
      };
    });
    
    setTeacherStats(stats);
  };


  const handleSaveNote = async (teacherId: string) => {
    try {
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) return;
      
      const stat = teacherStats.find(s => s.teacherId === teacherId);
      if (!stat) return;
      
      await teacherReportService.createTeacherReport({
        teacherId,
        teacherName: teacher.name,
        totalClasses: stat.totalClasses,
        totalSessions: stat.totalSessions,
        totalStudents: stat.totalStudents,
        droppedStudents: stat.droppedStudents,
        standardRate: stat.standardRate,
        attendanceRate: stat.attendanceRate,
        homeworkRate: stat.homeworkRate,
        averageTestScore: stat.averageTestScore,
        managerNote: noteText,
        period: selectedPeriod,
        createdAt: new Date().toISOString(),
      });
      
      setTeacherStats(prev => prev.map(s => 
        s.teacherId === teacherId ? { ...s, managerNote: noteText } : s
      ));
      setEditingNote(null);
      setNoteText('');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Lỗi lưu đánh giá');
    }
  };

  const filteredStats = teacherStats.filter(s => {
    const matchSearch = s.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = !filterRole || s.role === filterRole;
    return matchSearch && matchRole;
  });

  // Summary
  const totalTeachers = filteredStats.length;
  const avgAttendance = filteredStats.length > 0
    ? Math.round(filteredStats.reduce((sum, s) => sum + s.attendanceRate, 0) / filteredStats.length)
    : 0;
  const avgHomework = filteredStats.length > 0
    ? Math.round(filteredStats.reduce((sum, s) => sum + s.homeworkRate, 0) / filteredStats.length)
    : 0;
  const avgTestScore = filteredStats.length > 0
    ? Math.round(filteredStats.reduce((sum, s) => sum + s.averageTestScore, 0) / filteredStats.length * 10) / 10
    : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo chi tiết giáo viên</h1>
          <p className="text-gray-500 mt-1">Thống kê hiệu suất giảng dạy</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw size={18} />
            Làm mới
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Download size={18} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng GV/TG</p>
              <p className="text-xl font-bold">{totalTeachers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tỷ lệ đi học TB</p>
              <p className="text-xl font-bold">{avgAttendance}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tỷ lệ BTVN TB</p>
              <p className="text-xl font-bold">{avgHomework}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Điểm Test TB</p>
              <p className="text-xl font-bold">{avgTestScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm giáo viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tất cả vai trò</option>
          <option value="Giáo viên">Giáo viên</option>
          <option value="Trợ giảng">Trợ giảng</option>
        </select>
        <input
          type="month"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lớp đang dạy</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Số buổi dạy</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">HS đang dạy</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">HS nghỉ ngang</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Đạt chuẩn (%)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Đi học (%)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">BTVN (%)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Điểm Test TB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStats.map(stat => (
                  <tr key={stat.teacherId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{stat.teacherName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        stat.role === 'Giáo viên' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {stat.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{stat.totalClasses}</td>
                    <td className="px-4 py-3 text-center">{stat.totalSessions}</td>
                    <td className="px-4 py-3 text-center">{stat.totalStudents}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={stat.droppedStudents > 0 ? 'text-red-500' : ''}>
                        {stat.droppedStudents}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        stat.standardRate >= 80 ? 'text-green-600' :
                        stat.standardRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stat.standardRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        stat.attendanceRate >= 80 ? 'text-green-600' :
                        stat.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stat.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        stat.homeworkRate >= 70 ? 'text-green-600' :
                        stat.homeworkRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stat.homeworkRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{stat.averageTestScore}</td>
                    <td className="px-4 py-3">
                      {editingNote === stat.teacherId ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            placeholder="Nhập đánh giá..."
                          />
                          <button
                            onClick={() => handleSaveNote(stat.teacherId)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => { setEditingNote(null); setNoteText(''); }}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 truncate max-w-[150px]">
                            {stat.managerNote || '-'}
                          </span>
                          <button
                            onClick={() => { setEditingNote(stat.teacherId); setNoteText(stat.managerNote || ''); }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStats.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>
      )}
    </div>
  );
};
