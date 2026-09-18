import { formatDateTime } from '../../lib/dates';
import { escapeHtml } from '../../lib/html';
import type { User } from '../../types';

export function renderUserProfile(user: User): string {
  return `
    <section class="profile">
      <h2>${escapeHtml(user.name)}</h2>
      <p>${escapeHtml(user.email)}</p>
      <p>Alta: ${formatDateTime(user.createdAt)}</p>
    </section>`;
}
