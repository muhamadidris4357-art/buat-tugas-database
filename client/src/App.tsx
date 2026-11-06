import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import DashboardRouter from '@/pages/Dashboard/DashboardRouter';
import PlatformOwnerDashboard from '@/pages/Dashboard/PlatformOwnerDashboard';
import CompanyAdminDashboard from '@/pages/Dashboard/CompanyAdminDashboard';
import EmployeeDashboard from '@/pages/Dashboard/EmployeeDashboard';
import TaskList from '@/pages/Tasks/TaskList';
import TaskCreate from '@/pages/Tasks/TaskCreate';
import TaskDetail from '@/pages/Tasks/TaskDetail';
import ReportList from '@/pages/Reports/ReportList';
import ReportCreate from '@/pages/Reports/ReportCreate';
import ReminderList from '@/pages/Reminders/ReminderList';
import UserList from '@/pages/Users/UserList';
import UserCreate from '@/pages/Users/UserCreate';
import CompanyList from '@/pages/Companies/CompanyList';
import CompanyDetail from '@/pages/Companies/CompanyDetail';
import Profile from '@/pages/Profile/Profile';
import Settings from '@/pages/Settings/Settings';
import ActivityList from '@/pages/Activities/ActivityList';

function App() {
  const { state } = useAuth();
  const isAuthenticated = state.isAuthenticated;

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages (no layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* App layout - requires authentication */}
        <Route
          element={
            <>
              {!isAuthenticated ? <Navigate to="/login" replace /> : <Layout />}
            </>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/dashboard/owner" element={<PlatformOwnerDashboard />} />
          <Route path="/dashboard/admin" element={<CompanyAdminDashboard />} />
          <Route path="/dashboard/employee" element={<EmployeeDashboard />} />

          {/* Tasks */}
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/tasks/create" element={<TaskCreate />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportList />} />
          <Route path="/reports/create" element={<ReportCreate />} />

          {/* Reminders */}
          <Route path="/reminders" element={<ReminderList />} />

          {/* Users */}
          <Route path="/users" element={<UserList />} />
          <Route path="/users/create" element={<UserCreate />} />

          {/* Companies */}
          <Route path="/companies" element={<CompanyList />} />
          <Route path="/company-profile" element={<CompanyDetail />} />

          {/* Profile & Settings */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Activities */}
          <Route path="/activities" element={<ActivityList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
