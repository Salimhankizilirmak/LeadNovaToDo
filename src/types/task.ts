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
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType?: string;
  createdBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  createdBy: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  assignee?: Member | null;
  project?: { name: string; color: string } | null;
  attachments?: TaskAttachment[];
}
