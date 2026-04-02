import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DailyKanban } from '../components/DailyKanban';
import { taskService } from '../services/api';

// Mock del servicio de tareas
vi.mock('../services/api', () => ({
  taskService: {
    getTasks: vi.fn(),
    updateTask: vi.fn()
  }
}));

describe('DailyKanban', () => {
  const mockTasks = [
    { id: 1, title: 'Tarea 1', status: 'pending', priority: 'medium' },
    { id: 2, title: 'Tarea 2', status: 'completed', priority: 'high' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar las columnas correctamente', async () => {
    vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks);

    render(<DailyKanban date={new Date()} />);

    // Esperar a que los títulos de las columnas aparezcan
    // Usamos queryByText con waitFor para mayor control
    await waitFor(() => {
      expect(screen.queryByText('Pendiente')).toBeDefined();
      expect(screen.queryByText('En Proceso')).toBeDefined();
      expect(screen.queryByText('Hecho')).toBeDefined();
    }, { timeout: 5000 });
    
    // Verificar que las tareas están en el documento
    await waitFor(() => {
        expect(screen.queryByText('Tarea 1')).toBeDefined();
        expect(screen.queryByText('Tarea 2')).toBeDefined();
    }, { timeout: 5000 });
  });

  it('debe mostrar "Lista limpia" si no hay tareas en una columna', async () => {
    vi.mocked(taskService.getTasks).mockResolvedValue([]);

    render(<DailyKanban date={new Date()} />);

    await waitFor(() => {
      const emptyMessages = screen.queryAllByText('Lista limpia');
      expect(emptyMessages.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });
});
