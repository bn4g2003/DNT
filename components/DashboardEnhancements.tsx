/**
 * Dashboard Enhancements Component
 * Bổ sung các biểu đồ và thống kê mới - SỬ DỤNG DỮ LIỆU CÓ SẴN
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { formatCurrency } from '../src/utils/currencyUtils';

const COLORS = ['#0D9488', '#FF6B5A', '#F59E0B', '#10B981', '#6366F1', '#EF4444'];

interface EnhancedStats {
  // Lớp học
  classesActive: number;
  classesFinished: number;
  classesOpenedThisMonth: number;
  classesEndingThisMonth: number;
  
  // Học viên
  studentsActive: number;
  studentsCompleted: number;
  studentsDropped: number;
  studentsReserved: number;
  studentsReturned: number; // Tái tục
  
  // Trends
  studentTrend: { month: string; count: number }[];
  revenueTrend: { month: string; amount: number }[];
  leadSourceTrend: { month: string; [key: string]: any }[];
  
  // Pie charts
  courseRevenue: { name: string; value: number }[];
  leadSources: { name: string; value: number }[];
  
  // KPI
  monthlyGoals: { name: string; target: number; actual: number; percent: number }[];
}

export const DashboardEnhancements: React.FC = () => {
  const [stats, setStats] = useState<EnhancedStats>({
    classesActive: 0,
    classesFinished: 0,
    classesOpenedThisMonth: 0,
    classesEndingThisMonth: 0,
    studentsActive: 0,
    studentsCompleted: 0,
    studentsDropped: 0,
    studentsReserved: 0,
    studentsReturned: 0,
    studentTrend: [],
    revenueTrend: [],
    leadSourceTrend: [],
    courseRevenue: [],
    leadSources: [],
    monthlyGoals: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnhancedData();
  }, []);

  const fetchEnhancedData = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const firstDayOfMonth = new Date(thisYear, thisMonth, 1);
      const lastDayOfMonth = new Date(thisYear, thisMonth + 1, 0);

      // 1. Fetch Classes
      const classesSnap = await getDocs(collection(db, 'classes'));
      const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const classesActive = classes.filter((c: any) => c.status === 'Đang học' || c.status === 'STUDYING').length;
      const classesFinished = classes.filter((c: any) => c.status === 'Kết thúc' || c.status === 'FINISHED').length;
      
      const classesOpenedThisMonth = classes.filter((c: any) => {
        if (!c.startDate) return false;
        const startDate = new Date(c.startDate);
        return startDate >= firstDayOfMonth && startDate <= lastDayOfMonth;
      }).length;
      
      const classesEndingThisMonth = classes.filter((c: any) => {
        if (!c.endDate) return false;
        const endDate = new Date(c.endDate);
        return endDate >= firstDayOfMonth && endDate <= lastDayOfMonth;
      }).length;

      // 2. Fetch Students
      const studentsSnap = await getDocs(collection(db, 'students'));
      const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const studentsActive = students.filter((s: any) => s.status === 'Đang học').length;
      const studentsCompleted = students.filter((s: any) => s.status === 'Đã học hết phí').length;
      const studentsDropped = students.filter((s: any) => s.status === 'Nghỉ học').length;
      const studentsReserved = students.filter((s: any) => s.status === 'Bảo lưu').length;
      
      // Tái tục: học viên có reserveDate trong quá khứ nhưng status = Đang học
      const studentsReturned = students.filter((s: any) => {
        if (s.status !== 'Đang học') return false;
        if (!s.reserveDate) return false;
        const reserveDate = new Date(s.reserveDate);
        return reserveDate < now;
      }).length;

      // 3. Student Trend (6 tháng gần nhất)
      const studentTrend: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(thisYear, thisMonth - i, 1);
        const monthStr = `${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`;
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const count = students.filter((s: any) => {
          if (!s.createdAt) return false;
          const created = new Date(s.createdAt);
          return created >= monthStart && created <= monthEnd;
        }).length;
        
        studentTrend.push({ month: monthStr, count });
      }

      // 4. Revenue Trend (6 tháng gần nhất)
      const contractsSnap = await getDocs(collection(db, 'contracts'));
      const contracts = contractsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const revenueTrend: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(thisYear, thisMonth - i, 1);
        const monthStr = `${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`;
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const amount = contracts
          .filter((c: any) => {
            if (!c.contractDate && !c.createdAt) return false;
            const date = new Date(c.contractDate || c.createdAt);
            return date >= monthStart && date <= monthEnd && (c.status === 'Đã thanh toán' || c.status === 'Paid');
          })
          .reduce((sum, c: any) => sum + (c.totalAmount || c.finalTotal || 0), 0);
        
        revenueTrend.push({ month: monthStr, amount });
      }

      // 5. Course Revenue (Tỷ trọng doanh thu theo khóa học)
      const courseRevenueMap = new Map<string, number>();
      contracts
        .filter((c: any) => c.status === 'Đã thanh toán' || c.status === 'Paid')
        .forEach((c: any) => {
          if (c.items && Array.isArray(c.items)) {
            c.items.forEach((item: any) => {
              if (item.type === 'course') {
                const courseName = item.name || 'Khác';
                courseRevenueMap.set(courseName, (courseRevenueMap.get(courseName) || 0) + (item.finalPrice || 0));
              }
            });
          }
        });
      
      const courseRevenue = Array.from(courseRevenueMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

      // 6. Lead Sources (Kênh tuyển sinh)
      const leadsSnap = await getDocs(collection(db, 'leads'));
      const leads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const leadSourceMap = new Map<string, number>();
      leads.forEach((l: any) => {
        const source = l.source || 'Khác';
        leadSourceMap.set(source, (leadSourceMap.get(source) || 0) + 1);
      });
      
      const leadSources = Array.from(leadSourceMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // 7. Lead Source Trend (6 tháng)
      const leadSourceTrend: { month: string; [key: string]: any }[] = [];
      const allSources = Array.from(leadSourceMap.keys());
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(thisYear, thisMonth - i, 1);
        const monthStr = `${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`;
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthData: any = { month: monthStr };
        allSources.forEach(source => {
          monthData[source] = leads.filter((l: any) => {
            if (!l.createdAt) return false;
            const created = new Date(l.createdAt);
            return created >= monthStart && created <= monthEnd && (l.source || 'Khác') === source;
          }).length;
        });
        
        leadSourceTrend.push(monthData);
      }

      // 8. Monthly Goals (KPI từ departmentGoals)
      const goalsSnap = await getDocs(
        query(
          collection(db, 'departmentGoals'),
          where('month', '==', thisMonth + 1),
          where('year', '==', thisYear)
        )
      );
      
      const monthlyGoals = goalsSnap.docs.map(d => {
        const data = d.data();
        const percent = data.kpiTarget > 0 ? Math.round((data.kpiActual / data.kpiTarget) * 100) : 0;
        return {
          name: data.title || data.departmentName,
          target: data.kpiTarget || 0,
          actual: data.kpiActual || 0,
          percent
        };
      });

      setStats({
        classesActive,
        classesFinished,
        classesOpenedThisMonth,
        classesEndingThisMonth,
        studentsActive,
        studentsCompleted,
        studentsDropped,
        studentsReserved,
        studentsReturned,
        studentTrend,
        revenueTrend,
        leadSourceTrend,
        courseRevenue,
        leadSources,
        monthlyGoals,
      });
      
    } catch (error) {
      console.error('Error fetching enhanced data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards Row 1: Lớp học */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Lớp đang học</p>
              <p className="text-2xl font-bold text-teal-600">{stats.classesActive}</p>
            </div>
            <BookOpen className="text-teal-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Lớp đã kết thúc</p>
              <p className="text-2xl font-bold text-gray-600">{stats.classesFinished}</p>
            </div>
            <BookOpen className="text-gray-400" size={32} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Lớp mở tháng này</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.classesOpenedThisMonth}</p>
            </div>
            <TrendingUp className="text-emerald-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Lớp kết thúc tháng này</p>
              <p className="text-2xl font-bold text-amber-600">{stats.classesEndingThisMonth}</p>
            </div>
            <Activity className="text-amber-500" size={32} />
          </div>
        </div>
      </div>

      {/* Stats Cards Row 2: Học viên */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">HV đang học</p>
              <p className="text-2xl font-bold text-teal-600">{stats.studentsActive}</p>
            </div>
            <Users className="text-teal-500" size={28} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">HV hoàn thành</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.studentsCompleted}</p>
            </div>
            <Users className="text-emerald-500" size={28} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">HV nghỉ học</p>
              <p className="text-2xl font-bold text-red-600">{stats.studentsDropped}</p>
            </div>
            <Users className="text-red-500" size={28} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">HV bảo lưu</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.studentsReserved}</p>
            </div>
            <Users className="text-indigo-500" size={28} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">HV tái tục</p>
              <p className="text-2xl font-bold text-purple-600">{stats.studentsReturned}</p>
            </div>
            <TrendingUp className="text-purple-500" size={28} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Trend Line Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl">
              <TrendingUp className="text-white" size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Xu hướng học viên (6 tháng)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.studentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend Line Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <Activity className="text-white" size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Xu hướng doanh thu (6 tháng)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}tr`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pie Charts + Lead Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Revenue Pie */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
          <h3 className="font-bold text-gray-800 mb-4">Doanh thu theo khóa học</h3>
          <div className="h-64">
            {stats.courseRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.courseRevenue} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {stats.courseRevenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Lead Sources Pie */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
          <h3 className="font-bold text-gray-800 mb-4">Tỷ trọng kênh tuyển sinh</h3>
          <div className="h-64">
            {stats.leadSources.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.leadSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {stats.leadSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Monthly Goals (KPI) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Target className="text-white" size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Mục tiêu tháng</h3>
          </div>
          <div className="space-y-3">
            {stats.monthlyGoals.length > 0 ? (
              stats.monthlyGoals.map((goal, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">{goal.name}</span>
                    <span className={`font-bold ${goal.percent >= 100 ? 'text-emerald-600' : goal.percent >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                      {goal.percent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${goal.percent >= 100 ? 'bg-emerald-500' : goal.percent >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(goal.percent, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Thực tế: {goal.actual.toLocaleString()}</span>
                    <span>Mục tiêu: {goal.target.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">Chưa có mục tiêu tháng này</div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Source Trend */}
      {stats.leadSourceTrend.length > 0 && stats.leadSources.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
              <BarChart3 className="text-white" size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Xu hướng kênh tuyển sinh (6 tháng)</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.leadSourceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {stats.leadSources.map((source, idx) => (
                  <Bar key={source.name} dataKey={source.name} fill={COLORS[idx % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
