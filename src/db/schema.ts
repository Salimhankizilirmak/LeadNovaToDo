import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

/**
 * LeadNova Veritabanı Şeması (Turso/SQLite)
 */

// 1. Organizasyonlar
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(), // Clerk Org ID: org_...
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull(), // Clerk User ID: user_...
  ownerEmail: text('owner_email').notNull().default(''), // Firma Sahibi (Patron) E-postası
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  profiles: many(profiles),
  projects: many(projects),
  tasks: many(tasks),
  cells: many(cells),
}));

// 2. Kullanıcı Profilleri (Clerk Sync)
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(), // Clerk User ID: user_...
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('Personel'), // Patron, Genel Müdür, Personel
  orgId: text('org_id').references(() => organizations.id),
  avatarUrl: text('avatar_url'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [profiles.orgId],
    references: [organizations.id],
  }),
  assignedTasks: many(tasks, { relationName: 'assignee' }),
  createdTasks: many(tasks, { relationName: 'creator' }),
  managedProjects: many(projects, { relationName: 'manager' }),
  projectManagers: many(projectManagers),
  projectMessages: many(projectMessages),
}));


// 3. Projeler
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6366F1'),
  status: text('status').notNull().default('active'),
  orgId: text('org_id').notNull().references(() => organizations.id),
  cellId: text('cell_id').references(() => cells.id), // Projenin bağlı olduğu Hücre/Departman
  createdBy: text('created_by').notNull().references(() => profiles.id),
  managerId: text('manager_id').references(() => profiles.id), // Opsiyonel (Geriye dönük uyumluluk için, yakında kaldırılabilir)
  budget: integer('budget').default(0), // Kuruş cinsinden bütçe (TRY)
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const projectManagers = sqliteTable('project_managers', {
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  managerId: text('manager_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.projectId, t.managerId] })
}));

export const projectManagersRelations = relations(projectManagers, ({ one }) => ({
  project: one(projects, {
    fields: [projectManagers.projectId],
    references: [projects.id],
  }),
  manager: one(profiles, {
    fields: [projectManagers.managerId],
    references: [profiles.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.orgId],
    references: [organizations.id],
  }),
  cell: one(cells, {
    fields: [projects.cellId],
    references: [cells.id],
  }),
  creator: one(profiles, {
    fields: [projects.createdBy],
    references: [profiles.id],
    relationName: 'creator',
  }),
  manager: one(profiles, {
    fields: [projects.managerId],
    references: [profiles.id],
    relationName: 'manager',
  }),
  tasks: many(tasks),
  managers: many(projectManagers),
  messages: many(projectMessages),
  attachments: many(projectAttachments),
}));


// 4. Görevler
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  projectId: text('project_id').notNull().references(() => projects.id),
  orgId: text('org_id').notNull().references(() => organizations.id),
  assigneeId: text('assignee_id').references(() => profiles.id),
  blockId: text('block_id').references(() => blocks.id), // Fiziksel İstasyon (Blok) Ataması
  dueDate: text('due_date'),
  createdBy: text('created_by').notNull().references(() => profiles.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  organization: one(organizations, {
    fields: [tasks.orgId],
    references: [organizations.id],
  }),
  block: one(blocks, {
    fields: [tasks.blockId],
    references: [blocks.id],
  }),
  assignee: one(profiles, {
    fields: [tasks.assigneeId],
    references: [profiles.id],
    relationName: 'assignee',
  }),
  creator: one(profiles, {
    fields: [tasks.createdBy],
    references: [profiles.id],
    relationName: 'creator',
  }),
  attachments: many(taskAttachments),
}));

// 4a. Görev Ekleri (UploadThing Entegrasyonu İçin)
export const taskAttachments = sqliteTable('task_attachments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  createdBy: text('created_by').notNull().references(() => profiles.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const taskAttachmentsRelations = relations(taskAttachments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAttachments.taskId],
    references: [tasks.id],
  }),
}));


// 4b. Görev Geçmişi (Audit Logs)
export const taskHistory = sqliteTable('task_history', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  changedBy: text('changed_by').notNull().references(() => profiles.id),
  actionType: text('action_type').notNull().default('status_change'), // 'status_change', 'priority_change', 'assignee_change', 'attachment_added', 'update_details'
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  details: text('details'), // Opsiyonel ekstra açıklamalar (JSON veya Text)
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(tasks, {
    fields: [taskHistory.taskId],
    references: [tasks.id],
  }),
  user: one(profiles, {
    fields: [taskHistory.changedBy],
    references: [profiles.id],
  }),
}));

// 5. Hücreler (Departmanlar)
export const cells = sqliteTable('cells', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  orgId: text('org_id').notNull().references(() => organizations.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const cellsRelations = relations(cells, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [cells.orgId],
    references: [organizations.id],
  }),
  members: many(cellMembers),
  blocks: many(blocks),
  projects: many(projects),
}));

// 6. Hücre Üyeleri (Çoktan Çoka İlişki)
export const cellMembers = sqliteTable('cell_members', {
  cellId: text('cell_id').notNull().references(() => cells.id),
  userId: text('user_id').notNull().references(() => profiles.id),
  isSupervisor: integer('is_supervisor', { mode: 'boolean' }).default(false), // Vardiya Amiri Flag (Many-to-Many Esnekliği)
}, (table) => [
  primaryKey({ columns: [table.cellId, table.userId] })
]);

export const cellMembersRelations = relations(cellMembers, ({ one }) => ({
  cell: one(cells, {
    fields: [cellMembers.cellId],
    references: [cells.id],
  }),
  user: one(profiles, {
    fields: [cellMembers.userId],
    references: [profiles.id],
  }),
}));

// 7. Organizasyon Üyeleri
export const orgMembers = sqliteTable('org_members', {
  orgId: text('org_id').notNull().references(() => organizations.id),
  userId: text('user_id').notNull().references(() => profiles.id),
  role: text('role').notNull().default('member'),
}, (table) => [
  primaryKey({ columns: [table.orgId, table.userId] })
]);

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgMembers.orgId],
    references: [organizations.id],
  }),
  user: one(profiles, {
    fields: [orgMembers.userId],
    references: [profiles.id],
  }),
}));

// 8. Proje İçi Sohbet (Project Chat)
export const projectMessages = sqliteTable('project_messages', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  userId: text('user_id').notNull().references(() => profiles.id),
  message: text('message').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const projectMessagesRelations = relations(projectMessages, ({ one }) => ({
  project: one(projects, {
    fields: [projectMessages.projectId],
    references: [projects.id],
  }),
  user: one(profiles, {
    fields: [projectMessages.userId],
    references: [profiles.id],
  }),
}));

// 9. Proje Ekleri (Project Attachments)
export const projectAttachments = sqliteTable('project_attachments', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  createdBy: text('created_by').notNull().references(() => profiles.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const projectAttachmentsRelations = relations(projectAttachments, ({ one }) => ({
  project: one(projects, {
    fields: [projectAttachments.projectId],
    references: [projects.id],
  }),
  creator: one(profiles, {
    fields: [projectAttachments.createdBy],
    references: [profiles.id],
  }),
}));


// 5b. Bloklar (İstasyonlar - Hücrelerin içindeki fiziksel birimler)
export const blocks = sqliteTable('blocks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  cellId: text('cell_id').references(() => cells.id),
  orgId: text('org_id').notNull().references(() => organizations.id),
  createdBy: text('created_by').notNull().references(() => profiles.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  cell: one(cells, {
    fields: [blocks.cellId],
    references: [cells.id],
  }),
  organization: one(organizations, {
    fields: [blocks.orgId],
    references: [organizations.id],
  }),
  creator: one(profiles, {
    fields: [blocks.createdBy],
    references: [profiles.id],
  }),
  tasks: many(tasks),
}));
