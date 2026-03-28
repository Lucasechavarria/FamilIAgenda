import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AIOptimizationResponse } from '../types';

// Re-declarar para evitar errores de tipos con jsPDF autotable si no se cargan globalmente
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface MetricsData {
  totalEvents: number;
  completedEvents: number;
  pendingEvents: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  categoryBreakdown: { [key: string]: number };
  memberStats: Array<{
    user_id: number;
    user_name: string;
    assigned_count: number;
    completed_count: number;
    completion_rate: number;
  }>;
}

export const generateWeeklyReport = async (
  metrics: MetricsData,
  familyName: string,
  range: 'week' | 'month' | 'all',
  aiInsights: AIOptimizationResponse | null = null
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- Estilos y Colores ---
  const primaryColor = [79, 70, 229]; // Indigo-600 (#4f46e6) - Color de marca
  const accentColor = [16, 185, 129]; // Emerald-500
  const secondaryColor = [244, 63, 94]; // Rose-500
  const textColor = [15, 23, 42]; // Slate-900
  const lightTextColor = [100, 116, 139]; // Slate-500
  
  const rangeText = range === 'week' ? 'Semanal' : range === 'month' ? 'Mensual' : 'Histórico';
  const dateStr = new Date().toLocaleDateString('es-ES', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

  // --- Header ---
  // Logo Estilizado (Vectorial)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(20, 15, 12, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('IA', 26, 23, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FamilIAgenda', 36, 25);
  
  // Subtítulo
  doc.setFontSize(14);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Reporte de Actividad ${rangeText}`, 20, 40);
  
  // Línea decorativa
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 45, pageWidth - 20, 45);

  // Información de la familia y fecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
  doc.text(`Familia: ${familyName}`, 20, 55);
  doc.text(`Generado: ${dateStr}`, pageWidth - 20, 55, { align: 'right' });

  // --- Resumen Ejecutivo (KPIs) ---
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Resumen de Rendimiento', 20, 70);

  const completionRate = metrics.totalEvents > 0 
    ? Math.round((metrics.completedEvents / metrics.totalEvents) * 100) 
    : 0;

  // Cuadros de métricas
  const drawMetricCard = (x: number, y: number, label: string, value: string, color: number[]) => {
    doc.setFillColor(248, 250, 252); 
    doc.roundedRect(x, y, 42, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.1);
    doc.roundedRect(x, y, 42, 28, 2, 2, 'D');
    
    doc.setFontSize(8);
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.text(label.toUpperCase(), x + 21, y + 10, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 21, y + 20, { align: 'center' });
  };

  drawMetricCard(20, 75, 'Total Eventos', metrics.totalEvents.toString(), primaryColor);
  drawMetricCard(66, 75, 'Completados', metrics.completedEvents.toString(), accentColor);
  drawMetricCard(112, 75, 'Pendientes', metrics.pendingEvents.toString(), [245, 158, 11]);
  drawMetricCard(158, 75, '% de Éxito', `${completionRate}%`, secondaryColor);

  // --- Análisis de IA (Si está disponible) ---
  let currentY = 120;
  if (aiInsights && aiInsights.analisis) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Análisis del Asistente IA', 20, currentY);
    
    doc.setFillColor(238, 242, 255); // Indigo-50
    doc.roundedRect(20, currentY + 4, pageWidth - 40, 25, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const splitAnalysis = doc.splitTextToSize(aiInsights.analisis, pageWidth - 50);
    doc.text(splitAnalysis, 25, currentY + 12);
    
    currentY += 40;
  }

  // --- Distribución por Categoría (Con Gráficos Vectoriales) ---
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Distribución por Categoría', 20, currentY);

  const categoryLabels: Record<string, {name: string, color: number[]}> = {
    work: {name: 'Trabajo', color: [124, 58, 237]},
    school: {name: 'Escuela', color: [79, 70, 229]},
    health: {name: 'Salud', color: [244, 63, 94]},
    leisure: {name: 'Ocio', color: [16, 185, 129]},
    personal: {name: 'Personal', color: [6, 182, 212]},
    family: {name: 'Familia', color: [236, 72, 153]},
    other: {name: 'Otro', color: [100, 116, 139]}
  };

  Object.entries(metrics.categoryBreakdown).forEach(([key, count], index) => {
    const yPos = currentY + 10 + (index * 12);
    const cat = categoryLabels[key] || {name: key, color: lightTextColor};
    const percentage = metrics.totalEvents > 0 ? (count / metrics.totalEvents) : 0;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(cat.name, 20, yPos + 6);
    
    // Bar Background
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(60, yPos + 2, 100, 5, 1, 1, 'F');
    
    // Bar Fill
    doc.setFillColor(cat.color[0], cat.color[1], cat.color[2]);
    doc.roundedRect(60, yPos + 2, Math.max(1, 100 * percentage), 5, 1, 1, 'F');
    
    doc.text(`${count} (${Math.round(percentage * 100)}%)`, 165, yPos + 6);
  });

  // --- Rendimiento por Miembro ---
  const memberData = metrics.memberStats.map(m => [
    m.user_name,
    m.assigned_count,
    m.completed_count,
    `${m.completion_rate}%`
  ]);

  (doc as any).autoTable({
    startY: currentY + 15 + (Object.keys(metrics.categoryBreakdown).length * 12),
    head: [['Miembro de la Familia', 'Asignadas', 'Completadas', '% de Éxito']],
    body: memberData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, halign: 'center', fontSize: 10 },
    columnStyles: { 
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center', textColor: primaryColor, fontStyle: 'bold' }
    },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 }
  });

  // --- Footer ---
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
  doc.text('Generado con ❤️ por FamilIAgenda – Tu asistente inteligente de organización familiar.', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Página 1 de 1 – ${dateStr}`, pageWidth / 2, footerY + 5, { align: 'center' });

  // Guardar PDF
  doc.save(`Reporte_${rangeText}_${familyName.replace(/\s+/g, '_')}.pdf`);
};
