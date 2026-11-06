export type Role = 'PLATFORM_OWNER' | 'COMPANY_ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  company_id: string | null;
  name: string;
  email: string;
  role: Role;
  job_title: string | null;
  avatar_url: string | null;
  phone: string | null;
  language: string;
  timezone: string;
  date_format: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  description: string | null;
  logo_url: string | null;
  industry: string;
  country: string;
  timezone: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_count?: number;
  task_count?: number;
  report_count?: number;
  active_members?: number;
  completed_tasks?: number;
  total_tasks?: number;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  company_id: string;
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
  progress_percent: number;
  notes: string | null;
  completed_at: string | null;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_avatar_url?: string | null;
  user_job_title?: string | null;
}

export interface Task {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
  due_date: string | null;
  target_scope: 'single' | 'multiple' | 'all';
  category: string;
  estimated_hours: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_email?: string;
  company_name?: string;
  assignments?: TaskAssignment[];
  my_assignment?: TaskAssignment | null;
  reports?: TaskReport[];
}

export interface TaskReport {
  id: string;
  company_id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  summary: string;
  work_done: string;
  blockers: string;
  hours_spent: number;
  status: 'submitted' | 'reviewed' | 'approved' | 'revision_requested';
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  employee_email?: string;
  employee_job_title?: string | null;
  employee_avatar?: string | null;
  task_title?: string;
  company_name?: string;
}

export interface Reminder {
  id: string;
  company_id: string;
  user_id: string | null;
  created_by: string;
  title: string;
  message: string;
  due_date: string | null;
  priority: 'info' | 'warning' | 'urgent';
  is_read: number;
  created_at: string;
  creator_name?: string;
}

export interface ActivityLog {
  id: string;
  company_id: string | null;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  user_avatar_url?: string | null;
  company_name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  role: Role;
  [key: string]: any;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}
