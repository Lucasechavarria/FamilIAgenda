import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility para componer clases de Tailwind de forma dinámica y segura.
 * Combina clsx (lógica condicional) con tailwind-merge (resolución de conflictos).
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary-500', 'text-white')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
