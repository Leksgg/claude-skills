import { validateUserPassword } from '../../validation/password';

export interface SignupForm {
  name: string;
  email: string;
  password: string;
}

export function handleSignup(form: SignupForm): string[] {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push('El nombre es obligatorio');
  if (!form.email.includes('@')) errors.push('Email no válido');
  if (!validateUserPassword(form.password)) {
    errors.push('La contraseña debe tener al menos 8 caracteres y un número');
  }
  return errors;
}
