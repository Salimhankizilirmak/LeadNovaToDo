import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * LeadNova Veritabanı Şeması (Turso/SQLite)
 */

// 1. Organizasyonlar
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(), // Clerk Org ID: org_...
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull(), // Clerk User ID: user_...
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

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

// 3. Projeler
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), // nanoid/uuid generated on server
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6366F1'),
  status: text('status').notNull().default('active'), // active, completed, archived
  orgId: text('org_id').notNull().references(() => organizations.id),
  createdBy: text('created_by').notNull().references(() => profiles.id),
  managerId: text('manager_id').references(() => profiles.id), // Proje Sorumlusu
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 4. Görevler
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(), 
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'), // todo, in_progress, done
  priority: text('priority').notNull().default('medium'), // low, medium, high, critical
  projectId: text('project_id').notNull().references(() => projects.id),
  orgId: text('org_id').notNull().references(() => organizations.id),
  assigneeId: text('assignee_id').references(() => profiles.id),
  dueDate: text('due_date'),
  createdBy: text('created_by').notNull().references(() => profiles.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 5. Hücreler (Departmanlar)
export const cells = sqliteTable('cells', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  orgId: text('org_id').notNull().references(() => organizations.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 6. Hücre Üyeleri (Çoktan Çoka İlişki)
export const cellMembers = sqliteTable('cell_members', {
  cellId: text('cell_id').notNull().references(() => cells.id),
  userId: text('user_id').notNull().references(() => profiles.id),
}, (table) => ({
  pk: sql`PRIMARY KEY (${table.cellId}, ${table.userId})`
}));

// 7. Organizasyon Üyeleri
export const orgMembers = sqliteTable('org_members', {
  orgId: text('org_id').notNull().references(() => organizations.id),
  userId: text('user_id').notNull().references(() => profiles.id),
  role: text('role').notNull().default('member'), // admin, member
}, (table) => ({
  pk: sql`PRIMARY KEY (${table.orgId}, ${table.userId})`
}));
