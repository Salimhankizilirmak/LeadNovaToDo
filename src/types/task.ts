export interface Member {
  id: string;
  email?: string;
  display_name?: string | null;
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
  assignee?: Member | null; // Join verisi için opsiyonel
  project?: { name: string; color: string } | null;
}
