/**
 * LeadNova Shared Auth Constants & Types
 * This file can be imported in both Client and Server components.
 */

export type LeadNovaRole = 'Patron' | 'Genel Müdür' | 'Admin' | 'Proje Yöneticisi' | 'Vardiya Amiri' | 'Personel';

export const ROLE_HIERARCHY: Record<LeadNovaRole, number> = {
  'Patron': 100,
  'Genel Müdür': 90,
  'Admin': 80,
  'Vardiya Amiri': 50,
  'Proje Yöneticisi': 40,
  'Personel': 10
};

/**
 * Patron, GM veya Admin olup olmadığını kontrol eder (Shared).
 */
export function isBoss(role: string) {
  return ['Patron', 'Genel Müdür', 'Admin'].includes(role);
}
