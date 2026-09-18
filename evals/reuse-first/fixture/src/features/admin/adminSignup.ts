export interface AdminSignupForm {
  name: string;
  email: string;
  password: string;
}

export function handleAdminSignup(form: AdminSignupForm): string[] {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push('El nombre es obligatorio');
  if (!form.email.endsWith('@tienda.es')) {
    errors.push('Los administradores deben usar un email @tienda.es');
  }
  return errors;
}
