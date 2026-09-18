/** Reglas de contraseña para clientes: mínimo 8 caracteres y al menos un número. */
export function validateUserPassword(password: string): boolean {
  return password.length >= 8 && /\d/.test(password);
}
