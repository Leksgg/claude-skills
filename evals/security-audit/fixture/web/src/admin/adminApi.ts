const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY;

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await fetch('/api/admin/users', { headers: { 'X-Admin-Key': ADMIN_KEY } });
  if (!res.ok) throw new Error('No se pudieron cargar los usuarios');
  return res.json();
}

export async function setUserRole(id: string, role: AdminUser['role']): Promise<void> {
  const res = await fetch(`/api/admin/users/${id}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('No se pudo cambiar el rol');
}
