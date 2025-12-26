
import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StudentStatus } from './types';
import { useAuth } from './src/hooks/useAuth';
import { initAutoNotifications } from './src/services/autoNotificationTriggers';

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ClassManager = lazy(() => import('./pages/ClassManager').then(m => ({ default: m.ClassManager })));
const AcademicHub = lazy(() => import('./pages/AcademicHub').then(m => ({ default: m.AcademicHub })));
const ServiceHub = lazy(() => import('./pages/ServiceHub').then(m => ({ default: m.ServiceHub })));
const MarketingHub = lazy(() => import('./pages/MarketingHub').then(m => ({ default: m.MarketingHub })));
const FinanceHub = lazy(() => import('./pages/FinanceHub').then(m => ({ default: m.FinanceHub })));
const ReportHub = lazy(() => import('./pages/ReportHub').then(m => ({ default: m.ReportHub })));
const ConfigurationHub = lazy(() => import('./pages/ConfigurationHub').then(m => ({ default: m.ConfigurationHub })));

const StudentManager = lazy(() => import('./pages/StudentManager').then(m => ({ default: m.StudentManager })));
const TrialStudents = lazy(() => import('./pages/TrialStudents').then(m => ({ default: m.TrialStudents })));
const Schedule = lazy(() => import('./pages/Schedule').then(m => ({ default: m.Schedule })));
const HolidayManager = lazy(() => import('./pages/HolidayManager').then(m => ({ default: m.HolidayManager })));
const TutoringManager = lazy(() => import('./pages/TutoringManager').then(m => ({ default: m.TutoringManager })));
const AttendanceHistory = lazy(() => import('./pages/AttendanceHistory').then(m => ({ default: m.AttendanceHistory })));
const Attendance = lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const StudentDetail = lazy(() => import('./pages/StudentDetail').then(m => ({ default: m.StudentDetail })));
const StaffManager = lazy(() => import('./pages/StaffManager').then(m => ({ default: m.StaffManager })));
const ProductManager = lazy(() => import('./pages/ProductManager').then(m => ({ default: m.ProductManager })));
const InventoryManager = lazy(() => import('./pages/InventoryManager').then(m => ({ default: m.InventoryManager })));
const RoomManager = lazy(() => import('./pages/RoomManager').then(m => ({ default: m.RoomManager })));
const EnrollmentHistory = lazy(() => import('./pages/EnrollmentHistory').then(m => ({ default: m.EnrollmentHistory })));
const ParentManager = lazy(() => import('./pages/ParentManager').then(m => ({ default: m.ParentManager })));
const SalaryManager = lazy(() => import('./pages/SalaryManager').then(m => ({ default: m.SalaryManager })));
const StaffRewardPenalty = lazy(() => import('./pages/StaffRewardPenalty').then(m => ({ default: m.StaffRewardPenalty })));
const WorkConfirmation = lazy(() => import('./pages/WorkConfirmation').then(m => ({ default: m.WorkConfirmation })));
const SalaryReportTeacher = lazy(() => import('./pages/SalaryReportTeacher').then(m => ({ default: m.SalaryReportTeacher })));
const SalaryReportStaff = lazy(() => import('./pages/SalaryReportStaff').then(m => ({ default: m.SalaryReportStaff })));
const ContractCreation = lazy(() => import('./pages/ContractCreation').then(m => ({ default: m.ContractCreation })));
const ContractList = lazy(() => import('./pages/ContractList').then(m => ({ default: m.ContractList })));
const FeedbackManager = lazy(() => import('./pages/FeedbackManager').then(m => ({ default: m.FeedbackManager })));
const CustomerServiceDashboard = lazy(() => import('./pages/CustomerServiceDashboard').then(m => ({ default: m.CustomerServiceDashboard })));
const RevenueReport = lazy(() => import('./pages/RevenueReport').then(m => ({ default: m.RevenueReport })));
const DebtManagement = lazy(() => import('./pages/DebtManagement').then(m => ({ default: m.DebtManagement })));
const CustomerDatabase = lazy(() => import('./pages/CustomerDatabase').then(m => ({ default: m.CustomerDatabase })));
const CampaignManager = lazy(() => import('./pages/CampaignManager').then(m => ({ default: m.CampaignManager })));
const MarketingTaskManager = lazy(() => import('./pages/MarketingTaskManager').then(m => ({ default: m.MarketingTaskManager })));
const MarketingKpiManager = lazy(() => import('./pages/MarketingKpiManager').then(m => ({ default: m.MarketingKpiManager })));
const MarketingPlatformStats = lazy(() => import('./pages/MarketingPlatformStats').then(m => ({ default: m.MarketingPlatformStats })));
const TrainingReport = lazy(() => import('./pages/TrainingReport').then(m => ({ default: m.TrainingReport })));
const InvoiceManager = lazy(() => import('./pages/InvoiceManager').then(m => ({ default: m.InvoiceManager })));
const CenterSettings = lazy(() => import('./pages/CenterSettings').then(m => ({ default: m.CenterSettings })));
const CurriculumManager = lazy(() => import('./pages/CurriculumManager').then(m => ({ default: m.CurriculumManager })));
const HomeworkManager = lazy(() => import('./pages/HomeworkManager').then(m => ({ default: m.HomeworkManager })));
const MonthlyReport = lazy(() => import('./pages/MonthlyReport').then(m => ({ default: m.MonthlyReport })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const FeedbackFormPublic = lazy(() => import('./pages/FeedbackFormPublic').then(m => ({ default: m.FeedbackFormPublic })));
const StudentLogin = lazy(() => import('./pages/StudentLogin').then(m => ({ default: m.StudentLogin })));
const StudentPortal = lazy(() => import('./pages/StudentPortal').then(m => ({ default: m.StudentPortal })));
const SurveyManager = lazy(() => import('./pages/SurveyManager').then(m => ({ default: m.SurveyManager })));
const SurveyFormPublic = lazy(() => import('./pages/SurveyFormPublic').then(m => ({ default: m.SurveyFormPublic })));

// New pages for Resource Library, Course Management, Teacher Management
const ResourceLibrary = lazy(() => import('./pages/ResourceLibrary').then(m => ({ default: m.ResourceLibrary })));
const CourseManager = lazy(() => import('./pages/CourseManager').then(m => ({ default: m.CourseManager })));
const TeacherDetailReport = lazy(() => import('./pages/TeacherDetailReport').then(m => ({ default: m.TeacherDetailReport })));
const TeacherTaskManager = lazy(() => import('./pages/TeacherTaskManager').then(m => ({ default: m.TeacherTaskManager })));
const TeacherGoalManager = lazy(() => import('./pages/TeacherGoalManager').then(m => ({ default: m.TeacherGoalManager })));
const PayrollHub = lazy(() => import('./pages/PayrollHub').then(m => ({ default: m.PayrollHub })));
const TeacherHub = lazy(() => import('./pages/TeacherHub').then(m => ({ default: m.TeacherHub })));

// ERS - Employee Rating System pages
const DepartmentGoalManager = lazy(() => import('./pages/DepartmentGoalManager').then(m => ({ default: m.DepartmentGoalManager })));
const DepartmentBonusConfig = lazy(() => import('./pages/DepartmentBonusConfig').then(m => ({ default: m.DepartmentBonusConfig })));

// Page loading spinner component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="text-gray-500 text-sm">Đang tải...</span>
    </div>
  </div>
);

// Placeholder components for routes not fully implemented
const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
    <div className="text-6xl mb-4">🚧</div>
    <h3 className="text-xl font-medium text-gray-600">Trang đang phát triển</h3>
    <p className="mt-2">{title}</p>
  </div>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden print:block print:h-auto print:overflow-visible">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible">
        <Header title="Hệ thống quản lý trung tâm" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 print:p-0 print:overflow-visible">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  // Khởi tạo auto notification listeners
  useEffect(() => {
    const cleanup = initAutoNotifications();
    return cleanup; // Cleanup khi unmount
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* Default route - Student Login */}
        <Route path="/" element={<Suspense fallback={<PageLoader />}><StudentLogin /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
        <Route path="/feedback/:campaignId/:token" element={<Suspense fallback={<PageLoader />}><FeedbackFormPublic /></Suspense>} />
        <Route path="/survey/:token" element={<Suspense fallback={<PageLoader />}><SurveyFormPublic /></Suspense>} />
        <Route path="/student/login" element={<Suspense fallback={<PageLoader />}><StudentLogin /></Suspense>} />
        <Route path="/student/portal" element={<Suspense fallback={<PageLoader />}><StudentPortal /></Suspense>} />

        {/* Protected Routes - Admin */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />

                <Route path="/training/hub" element={<AcademicHub />} />
                {/* Legacy Routes */}
                <Route path="/training/classes" element={<ClassManager />} />
                <Route path="/training/courses" element={<CourseManager />} />
                <Route path="/training/resources" element={<ResourceLibrary />} />
                <Route path="/training/schedule" element={<Schedule />} />
                <Route path="/training/holidays" element={<HolidayManager />} />
                <Route path="/training/attendance" element={<Attendance />} />
                <Route path="/training/tutoring" element={<TutoringManager />} />
                <Route path="/training/homework" element={<HomeworkManager />} />
                <Route path="/training/attendance-history" element={<AttendanceHistory />} />
                <Route path="/training/enrollment" element={<EnrollmentHistory />} />

                {/* Customer Routes */}
                <Route path="/customers/hub" element={<ServiceHub />} />
                {/* Legacy Routes */}
                <Route path="/customers/students" element={<StudentManager key="all-students" title="Danh sách học viên" />} />
                <Route path="/customers/student-detail/:id" element={<StudentDetail />} />
                <Route path="/customers/parents" element={<ParentManager />} />
                <Route path="/customers/dropped" element={<StudentManager key="dropped-students" initialStatusFilter={StudentStatus.DROPPED} title="Danh sách học viên đã nghỉ" />} />
                <Route path="/customers/reserved" element={<StudentManager key="reserved-students" initialStatusFilter={StudentStatus.RESERVED} title="Danh sách học viên bảo lưu" />} />
                <Route path="/customers/trial" element={<TrialStudents />} />
                <Route path="/customers/feedback" element={<FeedbackManager />} />
                <Route path="/customers/surveys" element={<SurveyManager />} />
                <Route path="/customers/service-dashboard" element={<CustomerServiceDashboard />} />

                {/* Business Routes */}
                <Route path="/business/hub" element={<MarketingHub />} />
                <Route path="/business/leads" element={<CustomerDatabase />} />
                <Route path="/business/campaigns" element={<CampaignManager />} />
                <Route path="/business/tasks" element={<MarketingTaskManager />} />
                <Route path="/business/kpi" element={<MarketingKpiManager />} />
                <Route path="/business/platforms" element={<MarketingPlatformStats />} />

                {/* HR Routes */}
                <Route path="/hr/staff" element={<StaffManager />} />
                <Route path="/hr/department-goals" element={<DepartmentGoalManager />} />
                <Route path="/hr/department-bonus" element={<DepartmentBonusConfig />} />
                <Route path="/hr/department-bonus" element={<DepartmentBonusConfig />} />
                <Route path="/hr/teacher-hub" element={<TeacherHub />} />
                <Route path="/hr/payroll" element={<PayrollHub />} />

                {/* Legacy Routes - kept for direct access if needed */}
                <Route path="/hr/teacher-report" element={<TeacherDetailReport />} />
                <Route path="/hr/teacher-tasks" element={<TeacherTaskManager />} />
                <Route path="/hr/teacher-goals" element={<TeacherGoalManager />} />
                <Route path="/hr/salary" element={<SalaryManager />} />
                <Route path="/hr/rewards" element={<StaffRewardPenalty />} />
                <Route path="/hr/work-confirmation" element={<WorkConfirmation />} />
                <Route path="/hr/salary-teacher" element={<SalaryReportTeacher />} />
                <Route path="/hr/salary-staff" element={<SalaryReportStaff />} />

                {/* Finance Routes */}
                <Route path="/finance/hub" element={<FinanceHub />} />
                <Route path="/finance/contracts" element={<ContractList />} />
                <Route path="/finance/contracts/create" element={<ContractCreation />} />
                <Route path="/finance/invoices" element={<InvoiceManager />} />
                <Route path="/finance/revenue" element={<RevenueReport />} />
                <Route path="/finance/debt" element={<DebtManagement />} />

                {/* Report Routes */}
                <Route path="/reports/hub" element={<ReportHub />} />
                <Route path="/reports/training" element={<TrainingReport />} />
                <Route path="/reports/finance" element={<RevenueReport />} />
                <Route path="/reports/monthly" element={<MonthlyReport />} />

                {/* Settings Routes */}
                <Route path="/settings/hub" element={<ConfigurationHub />} />
                <Route path="/settings/staff" element={<StaffManager />} />
                <Route path="/settings/products" element={<ProductManager />} />
                <Route path="/settings/inventory" element={<InventoryManager />} />
                <Route path="/settings/rooms" element={<RoomManager />} />
                <Route path="/settings/center" element={<CenterSettings />} />
                <Route path="/settings/curriculum" element={<CurriculumManager />} />

                {/* Teacher Management Routes */}
                <Route path="/hr/teacher-report" element={<TeacherDetailReport />} />
                <Route path="/hr/teacher-tasks" element={<TeacherTaskManager />} />
                <Route path="/hr/teacher-goals" element={<TeacherGoalManager />} />

                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
