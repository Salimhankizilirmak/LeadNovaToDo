export type UserRole = 
  | 'Patron' 
  | 'Genel Müdür' 
  | 'Üretim Müdürü' 
  | 'Satış Pazarlama' 
  | 'Muhasebe' 
  | 'Vardiya Amiri' 
  | 'Personel'
  | 'Admin'
  | 'Member';

export interface Member {
  id: string;
  email?: string;
  display_name?: string | null;
  full_name?: string | null;
  role?: UserRole;
  avatar_url?: string | null;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  uploaded_by: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string | null;
  project_id: string;
  assignee_id: string | null;
  created_by: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  assignee?: Member | null;
  project?: { name: string; color: string } | null;
  attachments?: TaskAttachment[];
}
