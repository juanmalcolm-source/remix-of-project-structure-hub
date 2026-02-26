import type { Character, Location, FinancingSource, CreativeAnalysis, ProductionNotes } from '@/hooks/useProject';
import type { Tables } from '@/integrations/supabase/types';

type BudgetLine = Tables<'budget_lines'>;

interface DossierProject {
  title: string;
  logline?: string | null;
  genero?: string | null;
  tono?: string | null;
  estilo_visual_sugerido?: string | null;
  creative_analysis?: CreativeAnalysis;
  production_notes?: ProductionNotes;
  characters?: Character[];
  locations?: Location[];
  sequences?: Tables<'sequences'>[];
  financing_sources?: FinancingSource[];
}

const CHAPTER_NAMES: Record<number, string> = {
  1: 'Guión y Música',
  2: 'Personal Artístico',
  3: 'Equipo Técnico',
  4: 'Escenografía',
  5: 'Estudios Rodaje/Sonorización',
  6: 'Maquinaria, Rodaje y Transportes',
  7: 'Viajes, Hoteles y Comidas',
  8: 'Película Virgen / Material Sensible',
  9: 'Laboratorio / Postproducción',
  10: 'Seguros',
  11: 'Gastos Generales',
  12: 'Gastos Explotación y Financiación',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateDossierHTML(
  project: DossierProject | null | undefined,
  budgetLines: BudgetLine[] | null | undefined,
  selectedSections: string[],
): string {
  if (!project) return '<html><body><p>Sin datos de proyecto</p></body></html>';

  const analysis = project.creative_analysis;
  const notes = project.production_notes;
  const characters = project.characters ?? [];
  const locations = project.locations ?? [];
  const financingSources = project.financing_sources ?? [];
  const lines = budgetLines ?? [];

  const sections: string[] = [];

  // ── Portada ─────────────────────────────────────────────────────────
  sections.push(`
    <div class="cover">
      <div class="cover-content">
        <p class="cover-label">DOSSIER DE PRODUCCIÓN</p>
        <h1 class="cover-title">${esc(project.title)}</h1>
        ${project.logline ? `<p class="cover-logline">"${esc(project.logline)}"</p>` : ''}
        <div class="cover-meta">
          ${project.genero ? `<span>${esc(project.genero)}</span>` : ''}
          ${project.tono ? `<span>${esc(project.tono)}</span>` : ''}
          ${analysis?.estimated_budget_range ? `<span>${esc(analysis.estimated_budget_range)}</span>` : ''}
        </div>
        <p class="cover-date">${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p class="cover-footer">Generado con Fractal Kit</p>
      </div>
    </div>
  `);

  // ── Overview ────────────────────────────────────────────────────────
  if (selectedSections.includes('overview')) {
    sections.push(`
      <div class="section">
        <h2>Sinopsis y Logline</h2>
        ${project.logline ? `<div class="highlight-box"><strong>Logline:</strong> ${esc(project.logline)}</div>` : ''}
        ${analysis?.synopsis ? `<h3>Sinopsis</h3><p>${esc(analysis.synopsis)}</p>` : ''}
        ${analysis?.central_theme ? `<h3>Tema Central</h3><p>${esc(analysis.central_theme)}</p>` : ''}
        ${analysis?.core_emotional ? `<h3>Núcleo Emocional</h3><p>${esc(analysis.core_emotional)}</p>` : ''}
        <div class="info-grid">
          ${project.genero ? `<div class="info-item"><strong>Género</strong><span>${esc(project.genero)}</span></div>` : ''}
          ${project.tono ? `<div class="info-item"><strong>Tono</strong><span>${esc(project.tono)}</span></div>` : ''}
          ${project.estilo_visual_sugerido ? `<div class="info-item"><strong>Estilo Visual</strong><span>${esc(project.estilo_visual_sugerido)}</span></div>` : ''}
          ${analysis?.estimated_budget_range ? `<div class="info-item"><strong>Presupuesto Est.</strong><span>${esc(analysis.estimated_budget_range)}</span></div>` : ''}
        </div>
      </div>
    `);
  }

  // ── Personajes ──────────────────────────────────────────────────────
  if (selectedSections.includes('characters') && characters.length > 0) {
    const byCategory: Record<string, Character[]> = {};
    for (const c of characters) {
      const cat = c.category || 'Sin categoría';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(c);
    }

    sections.push(`
      <div class="section">
        <h2>Personajes (${characters.length})</h2>
        ${Object.entries(byCategory)
          .map(
            ([cat, chars]) => `
          <h3>${esc(cat)} (${chars.length})</h3>
          ${chars
            .map(
              (c) => `
            <div class="character-card">
              <h4>${esc(c.name)}</h4>
              ${c.description ? `<p>${esc(c.description)}</p>` : ''}
              <div class="character-meta">
                ${c.edad_aproximada ? `<span><strong>Edad:</strong> ${esc(c.edad_aproximada)}</span>` : ''}
                ${c.genero ? `<span><strong>Género:</strong> ${esc(c.genero)}</span>` : ''}
                ${c.shooting_days ? `<span><strong>Días rodaje:</strong> ${c.shooting_days}</span>` : ''}
                ${c.funcion_narrativa ? `<span><strong>Función:</strong> ${esc(c.funcion_narrativa)}</span>` : ''}
              </div>
              ${c.dramatic_arc ? `<p class="small"><strong>Arco dramático:</strong> ${esc(c.dramatic_arc)}</p>` : ''}
              ${c.transformacion ? `<p class="small"><strong>Transformación:</strong> ${esc(c.transformacion)}</p>` : ''}
            </div>
          `,
            )
            .join('')}
        `,
          )
          .join('')}
      </div>
    `);
  }

  // ── Localizaciones ──────────────────────────────────────────────────
  if (selectedSections.includes('locations') && locations.length > 0) {
    sections.push(`
      <div class="section">
        <h2>Localizaciones (${locations.length})</h2>
        <table>
          <thead>
            <tr><th>Localización</th><th>Tipo</th><th>Complejidad</th><th>Días Est.</th><th>Dirección</th></tr>
          </thead>
          <tbody>
            ${locations
              .map(
                (l) => `<tr>
              <td><strong>${esc(l.name)}</strong></td>
              <td>${esc(l.location_type ?? '')}</td>
              <td>${esc(l.complexity ?? '')}</td>
              <td>${l.estimated_days ?? '-'}</td>
              <td>${esc(l.address ?? '')}</td>
            </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `);
  }

  // ── Análisis Narrativo ──────────────────────────────────────────────
  if (selectedSections.includes('narrative') && analysis) {
    sections.push(`
      <div class="section">
        <h2>Análisis Narrativo</h2>
        <div class="scores-grid">
          ${analysis.score_narrativo != null ? `<div class="score-card"><div class="score-value">${analysis.score_narrativo}</div><div class="score-label">Narrativo</div></div>` : ''}
          ${analysis.score_comercial != null ? `<div class="score-card"><div class="score-value">${analysis.score_comercial}</div><div class="score-label">Comercial</div></div>` : ''}
          ${analysis.score_festival != null ? `<div class="score-card"><div class="score-value">${analysis.score_festival}</div><div class="score-label">Festival</div></div>` : ''}
        </div>
        ${analysis.potencial_comercial ? `<h3>Potencial Comercial</h3><p>${esc(analysis.potencial_comercial)}</p>` : ''}
        ${analysis.potencial_festival ? `<h3>Potencial Festival</h3><p>${esc(analysis.potencial_festival)}</p>` : ''}
      </div>
    `);
  }

  // ── Memoria de Producción ───────────────────────────────────────────
  if (selectedSections.includes('memoria') && notes) {
    const memorySections = [
      { key: 'director_intentions', title: 'Intenciones del Director' },
      { key: 'artistic_vision', title: 'Visión Artística' },
      { key: 'personal_connection', title: 'Conexión Personal' },
      { key: 'target_audience', title: 'Público Objetivo' },
      { key: 'aesthetic_proposal', title: 'Propuesta Estética' },
      { key: 'production_viability', title: 'Viabilidad de Producción' },
      { key: 'team_strengths', title: 'Fortalezas del Equipo' },
      { key: 'confirmed_locations', title: 'Localizaciones Confirmadas' },
      { key: 'visual_references', title: 'Referencias Visuales' },
    ];

    const memContent = memorySections
      .filter((s) => notes[s.key as keyof typeof notes])
      .map(
        (s) => `
        <h3>${s.title}</h3>
        <p>${esc(String(notes[s.key as keyof typeof notes]))}</p>
      `,
      )
      .join('');

    if (memContent) {
      sections.push(`<div class="section"><h2>Memoria de Producción</h2>${memContent}</div>`);
    }
  }

  // ── Desglose de Personajes (producción) ─────────────────────────────
  if (selectedSections.includes('desglose_personajes') && characters.length > 0) {
    const charsWithCost = characters.filter((c) => c.shooting_days || c.daily_rate);
    if (charsWithCost.length > 0) {
      sections.push(`
        <div class="section">
          <h2>Desglose de Personajes — Producción</h2>
          <table>
            <thead>
              <tr><th>Personaje</th><th>Categoría</th><th>Días</th><th>Tarifa/Día</th><th>Agencia %</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${charsWithCost
                .map((c) => {
                  const days = c.shooting_days ?? 0;
                  const rate = c.daily_rate ?? 0;
                  const agPct = c.agency_percentage ?? 0;
                  const total = days * rate * (1 + agPct / 100);
                  return `<tr>
                    <td>${esc(c.name)}</td>
                    <td>${esc(c.category ?? '')}</td>
                    <td>${days}</td>
                    <td class="currency">${formatCurrency(rate)}</td>
                    <td>${agPct}%</td>
                    <td class="currency"><strong>${formatCurrency(total)}</strong></td>
                  </tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `);
    }
  }

  // ── Desglose de Localizaciones (producción) ─────────────────────────
  if (selectedSections.includes('desglose_localizaciones') && locations.length > 0) {
    sections.push(`
      <div class="section">
        <h2>Desglose de Localizaciones — Producción</h2>
        <table>
          <thead>
            <tr><th>Localización</th><th>Tipo</th><th>Complejidad</th><th>Días Est.</th><th>Zona</th><th>Necesidades Especiales</th></tr>
          </thead>
          <tbody>
            ${locations
              .map(
                (l) => `<tr>
              <td>${esc(l.name)}</td>
              <td>${esc(l.location_type ?? '')}</td>
              <td>${esc(l.complexity ?? '')}</td>
              <td>${l.estimated_days ?? '-'}</td>
              <td>${esc(l.zone ?? '')}</td>
              <td>${esc(l.special_needs ?? '')}</td>
            </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `);
  }

  // ── Presupuesto ICAA ────────────────────────────────────────────────
  if (selectedSections.includes('presupuesto') && lines.length > 0) {
    const chapterTotals: { chapter: number; name: string; total: number }[] = [];
    for (let ch = 1; ch <= 12; ch++) {
      const total = lines.filter((l) => l.chapter === ch).reduce((s, l) => s + (l.total ?? 0), 0);
      chapterTotals.push({ chapter: ch, name: CHAPTER_NAMES[ch], total });
    }
    const grandTotal = chapterTotals.reduce((s, c) => s + c.total, 0);

    sections.push(`
      <div class="section">
        <h2>Presupuesto ICAA — Resumen</h2>
        <table>
          <thead>
            <tr><th>Cap.</th><th>Concepto</th><th style="text-align:right">Total</th></tr>
          </thead>
          <tbody>
            ${chapterTotals
              .map(
                (c) => `<tr>
              <td>${String(c.chapter).padStart(2, '0')}</td>
              <td>${esc(c.name)}</td>
              <td class="currency">${formatCurrency(c.total)}</td>
            </tr>`,
              )
              .join('')}
            <tr class="total-row">
              <td colspan="2"><strong>TOTAL GENERAL</strong></td>
              <td class="currency"><strong>${formatCurrency(grandTotal)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `);
  }

  // ── Plan Financiero ─────────────────────────────────────────────────
  if (selectedSections.includes('plan_financiero') && financingSources.length > 0) {
    const totalFinancing = financingSources.reduce((s, f) => s + (f.amount ?? 0), 0);

    sections.push(`
      <div class="section">
        <h2>Plan de Financiación</h2>
        <table>
          <thead>
            <tr><th>Fuente</th><th>Tipo</th><th>Estado</th><th style="text-align:right">Importe</th></tr>
          </thead>
          <tbody>
            ${financingSources
              .map(
                (f) => `<tr>
              <td>${esc(f.source_name)}</td>
              <td>${esc(f.source_type ?? '')}</td>
              <td>${esc(f.status ?? '')}</td>
              <td class="currency">${formatCurrency(f.amount ?? 0)}</td>
            </tr>`,
              )
              .join('')}
            <tr class="total-row">
              <td colspan="3"><strong>TOTAL FINANCIACIÓN</strong></td>
              <td class="currency"><strong>${formatCurrency(totalFinancing)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `);
  }

  // ── Assemble HTML ───────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Dossier — ${esc(project.title)}</title>
  <style>
    @page { margin: 2cm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a2e; }

    .cover { page-break-after: always; display: flex; align-items: center; justify-content: center; min-height: 90vh; text-align: center; }
    .cover-content { max-width: 500px; }
    .cover-label { text-transform: uppercase; letter-spacing: 3px; font-size: 10pt; color: #6b7280; margin-bottom: 24px; }
    .cover-title { font-size: 28pt; font-weight: 700; margin-bottom: 16px; color: #1a1a2e; }
    .cover-logline { font-style: italic; font-size: 12pt; color: #4b5563; margin-bottom: 24px; line-height: 1.5; }
    .cover-meta { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
    .cover-meta span { background: #f3f4f6; padding: 4px 12px; border-radius: 4px; font-size: 9pt; }
    .cover-date { font-size: 10pt; color: #9ca3af; margin-bottom: 8px; }
    .cover-footer { font-size: 8pt; color: #d1d5db; }

    .section { page-break-inside: avoid; margin-bottom: 32px; }
    h2 { font-size: 16pt; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #6366f1; padding-bottom: 6px; margin-bottom: 16px; margin-top: 24px; }
    h3 { font-size: 12pt; font-weight: 600; color: #374151; margin: 16px 0 8px; }
    h4 { font-size: 11pt; font-weight: 600; color: #1a1a2e; margin-bottom: 4px; }
    p { margin-bottom: 10px; }
    .small { font-size: 9pt; color: #6b7280; }

    .highlight-box { background: #eef2ff; border-left: 4px solid #6366f1; padding: 12px 16px; margin-bottom: 16px; font-size: 11pt; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
    .info-item { background: #f9fafb; padding: 10px; border-radius: 6px; }
    .info-item strong { display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 2px; }
    .info-item span { font-size: 10pt; font-weight: 500; }

    .character-card { background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 10px; page-break-inside: avoid; }
    .character-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 9pt; color: #6b7280; margin-top: 6px; }

    .scores-grid { display: flex; gap: 20px; margin-bottom: 16px; }
    .score-card { text-align: center; background: #f9fafb; padding: 16px 24px; border-radius: 8px; }
    .score-value { font-size: 28pt; font-weight: 700; color: #6366f1; }
    .score-label { font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9pt; }
    thead { background: #f3f4f6; }
    th { text-align: left; padding: 8px 10px; font-weight: 600; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
    .currency { text-align: right; font-variant-numeric: tabular-nums; }
    .total-row { background: #eef2ff; font-weight: 600; }
    .total-row td { border-top: 2px solid #6366f1; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section { page-break-inside: avoid; }
      .no-print { display: none; }
    }

    .print-header { background: #6366f1; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
    .print-header button { background: white; color: #6366f1; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 11pt; }
    .print-header button:hover { background: #eef2ff; }
  </style>
</head>
<body>
  <div class="no-print print-header">
    <span>Vista previa del dossier — ${esc(project.title)}</span>
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>
  ${sections.join('\n')}
</body>
</html>`;
}
