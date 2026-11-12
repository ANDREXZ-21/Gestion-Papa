'use strict';

(() => {
  const DATA = {
    slug: 'astrix-meta',
    name: 'Astrix Meta · Gestión Trabajo Papá',
    technicalName: 'Meta-estética generativa',
    summary:
      'Sistema de gestión de turnos de vigilancia, compensatorios y vacaciones con diseño generativo Astrix Meta: tokens visibles, variación cromática procedural y superficies configurables en vivo.',
    category: 'hibrido',
    priority: 'nice',
    version: '1.0.0',
    year: '2026',
    palette: ['#0B0B12', '#7C5CFF', '#19E3B1', '#F5F2EA', '#FF4D6D'],
    base: {
      bg: '#0B0B12',
      surface: '#141420',
      surface2: '#1B1B2C',
      fg: '#F5F2EA',
      muted: '#C9C6D8',
      accent: '#7C5CFF',
      accent2: '#19E3B1',
      border: '#34344A',
      radius: '18px',
      cardRadius: '20px',
      btnRadius: '12px',
    },
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const KEY = 'catalogo.app.' + DATA.slug + '.v1';

  const MODES = ['light', 'dark', 'contrast', 'auto'];
  const MODE_LABEL = { light: 'Claro', dark: 'Oscuro', contrast: 'Contraste', auto: 'Auto' };
  const MODE_ICON = { light: 'sun', dark: 'moon', contrast: 'contrast', auto: 'monitor' };
  const THEME_NAMES = [
    'Firma',
    'Solar',
    'Cítrico',
    'Bosque',
    'Menta',
    'Cielo',
    'Océano',
    'Índigo',
    'Violeta',
    'Magenta',
    'Rubí',
    'Cobre',
  ];

  const GEO = [
    { name: 'Recto', r: '0px', c: '0px', b: '0px' },
    { name: 'Sutil', r: '4px', c: '5px', b: '4px' },
    { name: 'Suave', r: '8px', c: '10px', b: '8px' },
    { name: 'Redondo', r: '14px', c: '16px', b: '12px' },
    { name: 'Curvo', r: '20px', c: '24px', b: '16px' },
    { name: 'Burbuja', r: '28px', c: '32px', b: '24px' },
    { name: 'Cápsula', r: '999px', c: '28px', b: '999px' },
    { name: 'Orgánico', r: '28px 10px 28px 10px', c: '32px 12px 32px 12px', b: '24px 8px 24px 8px' },
    { name: 'Cortado', r: '18px 0 18px 0', c: '22px 0 22px 0', b: '14px 0 14px 0' },
    { name: 'Papel', r: '2px', c: '3px', b: '2px' },
    { name: 'Bloque', r: '12px 12px 2px 2px', c: '16px 16px 2px 2px', b: '10px 10px 2px 2px' },
    { name: 'Asimétrico', r: '6px 30px 6px 30px', c: '8px 34px 8px 34px', b: '5px 22px 5px 22px' },
  ];

  const BGS = [
    'Firma',
    'Rejilla',
    'Puntos',
    'Malla',
    'Aurora',
    'Ondas',
    'Rayas',
    'Grano',
    'Blobs',
    'Circuito',
    'Papel',
    'Vitral',
  ];

  const ANIMS = [
    'Fade',
    'Subida',
    'Lateral',
    'Escala',
    'Desenfoque',
    'Rotación',
    'Flip',
    'Muelle',
    'Escalonada',
    'Pulso',
    'Flotación',
    'Glitch',
  ];

  const PANEL_TABS = [
    { id: 'themes', icon: 'palette', label: 'Temas' },
    { id: 'geometry', icon: 'layers', label: 'Geometría' },
    { id: 'backgrounds', icon: 'image', label: 'Fondos' },
    { id: 'animations', icon: 'play', label: 'Animaciones' },
    { id: 'colors', icon: 'palette', label: 'Colores' },
    { id: 'languages', icon: 'globe', label: 'Idiomas' },
    { id: 'accessibility', icon: 'accessibility', label: 'Accesibilidad' },
    { id: 'backups', icon: 'download', label: 'Backups' },
    { id: 'database', icon: 'database', label: 'Base de datos' },
    { id: 'about', icon: 'info', label: 'Acerca de' },
  ];

  const EN = {
    'Claro': 'Light',
    'Oscuro': 'Dark',
    'Contraste': 'Contrast',
    'Alto contraste': 'High contrast',
    'Auto': 'Auto',
    'Automático': 'Auto',
    'Panel': 'Panel',
    'Panel de control': 'Control panel',
    'Personalizar': 'Customize',
    'Accesibilidad': 'Accessibility',
    'Idioma': 'Language',
    'Idiomas': 'Languages',
    'Backup': 'Backup',
    'Backups': 'Backups',
    'Cerrar sesión': 'Sign out',
    'Iniciar sesión': 'Sign in',
    'Tema': 'Theme',
    'Modo': 'Mode',
    'Temas': 'Themes',
    'Geometría': 'Geometry',
    'Fondos': 'Backgrounds',
    'Animaciones': 'Animations',
    'Colores': 'Colors',
    'Acerca de': 'About',
    'Base de datos': 'Database',
    'Restablecer': 'Reset',
    'Cerrar': 'Close',
    'Guardar': 'Save',
    'Aplicar': 'Apply',
    'Exportar': 'Export',
    'Importar': 'Import',
    'Copiar': 'Copy',
    'Eliminar': 'Delete',
    'Cancelar': 'Cancel',
    'Aceptar': 'Accept',
    'Firma': 'Signature',
    'Solar': 'Solar',
    'Cítrico': 'Citrus',
    'Bosque': 'Forest',
    'Menta': 'Mint',
    'Cielo': 'Sky',
    'Océano': 'Ocean',
    'Índigo': 'Indigo',
    'Violeta': 'Violet',
    'Magenta': 'Magenta',
    'Rubí': 'Ruby',
    'Cobre': 'Copper',
    'Recto': 'Sharp',
    'Sutil': 'Subtle',
    'Suave': 'Soft',
    'Redondo': 'Rounded',
    'Curvo': 'Curved',
    'Burbuja': 'Bubble',
    'Cápsula': 'Pill',
    'Orgánico': 'Organic',
    'Cortado': 'Cut',
    'Papel': 'Paper',
    'Bloque': 'Block',
    'Asimétrico': 'Asymmetric',
    'Rejilla': 'Grid',
    'Puntos': 'Dots',
    'Malla': 'Mesh',
    'Aurora': 'Aurora',
    'Ondas': 'Waves',
    'Rayas': 'Stripes',
    'Grano': 'Grain',
    'Blobs': 'Blobs',
    'Circuito': 'Circuit',
    'Vitral': 'Stained glass',
    'Fade': 'Fade',
    'Subida': 'Rise',
    'Lateral': 'Slide',
    'Escala': 'Scale',
    'Desenfoque': 'Blur',
    'Rotación': 'Rotate',
    'Flip': 'Flip',
    'Muelle': 'Spring',
    'Escalonada': 'Stagger',
    'Pulso': 'Pulse',
    'Flotación': 'Float',
    'Glitch': 'Glitch',
    'Acento': 'Accent',
    'Acento 2': 'Accent 2',
    'Fondo': 'Background',
    'Superficie': 'Surface',
    'Texto': 'Text',
    'Texto secundario': 'Muted text',
    'Vista previa': 'Preview',
    '12 temas · 4 modos · 12 geometrías · 12 fondos': '12 themes · 4 modes · 12 geometries · 12 backgrounds',
    'Offline · guardado local': 'Offline · local save',
    '12 temas con variantes claras y oscuras.': '12 themes with light and dark variants.',
    'Claro, oscuro, alto contraste y automático. Se guarda por estilo.': 'Light, dark, high contrast and auto. Saved per style.',
    '12 geometrías aplicadas a radios de tarjetas, botones y controles.': '12 geometries applied to card, button and control radii.',
    '12 fondos dinámicos, coherentes con la paleta del estilo.': '12 dynamic backgrounds, coherent with the style palette.',
    '12 animaciones de entrada y feedback. Reduce el movimiento desde Accesibilidad si lo necesitas.': '12 entrance and feedback animations. Reduce motion from Accessibility if needed.',
    'Los cambios se guardan en este navegador y se aplican al instante.': 'Changes are saved in this browser and applied instantly.',
    'Idioma de la interfaz': 'Interface language',
    'El sistema cambia según el idioma seleccionado desde una base de conocimiento local. Sin red.': 'The system changes with the language selected from a local knowledge base. No network.',
    'Base de conocimiento': 'Knowledge base',
    'Reducir movimiento': 'Reduce motion',
    'Texto grande': 'Large text',
    'Subrayar enlaces': 'Underline links',
    'Anillo de foco ampliado': 'Larger focus ring',
    'Espaciado de línea': 'Line spacing',
    'Espaciado de letras': 'Letter spacing',
    'Escala del texto': 'Text scale',
    'Filtro de color': 'Color filter',
    'Normal': 'Normal',
    'Amplio': 'Wide',
    'Muy amplio': 'Very wide',
    'Ninguno': 'None',
    'Restablecer accesibilidad': 'Reset accessibility',
    'Exportar backup': 'Export backup',
    'Copiar backup': 'Copy backup',
    'Importar backup': 'Import backup',
    'Restablecer todo': 'Reset everything',
    'El backup incluye tema, modo, geometría, fondos, animaciones, colores, idioma y accesibilidad.': 'The backup includes theme, mode, geometry, backgrounds, animations, colors, language and accessibility.',
    'Buscar en la base de datos…': 'Search the database…',
    'Clave': 'Key',
    'Tamaño': 'Size',
    'Tipo': 'Type',
    'Todo se guarda en localStorage. Puedes exportar o borrar la caché local.': 'Everything is stored in localStorage. You can export or clear the local cache.',
    'Exportar base de datos': 'Export database',
    'Borrar caché local': 'Clear local cache',
    'Uso local': 'Local usage',
    'Restablecer configuración': 'Reset configuration',
    '¿Seguro que quieres restablecer toda la configuración de este estilo?': 'Reset all settings for this style?',
    'Se borrarán tema, modo, geometría, fondos, animaciones, colores, idioma y accesibilidad.': 'Theme, mode, geometry, backgrounds, animations, colors, language and accessibility will be reset.',
    'Sí, restablecer': 'Yes, reset',
    'Configuración aplicada': 'Settings applied',
    'Backup exportado': 'Backup exported',
    'Backup importado': 'Backup imported',
    'Backup copiado': 'Backup copied',
    'No se pudo importar el backup': 'Could not import backup',
    'Caché local borrada': 'Local cache cleared',
    'Idioma actualizado': 'Language updated',
    'Modo actualizado': 'Mode updated',
    'Tema actualizado': 'Theme updated',
    'Geometría actualizada': 'Geometry updated',
    'Fondo actualizado': 'Background updated',
    'Animación actualizada': 'Animation updated',
    'Colores actualizados': 'Colors updated',
    'Contraste bajo': 'Low contrast',
    'El texto sobre el acento no alcanza 4.5:1. El sistema seguirá funcionando, pero revisa la combinación.': 'Text on the accent does not reach 4.5:1. Everything still works, but review the combination.',
    'Hecho offline con HTML, CSS y JavaScript vanilla. Sin CDN ni frameworks.': 'Made offline with vanilla HTML, CSS and JavaScript. No CDN or frameworks.',
    'Cambiar modo': 'Change mode',
    'Cambiar modo de tema': 'Toggle theme mode',
    'Cerrar panel': 'Close panel',
    /* Traducciones de la interfaz de Gestión Trabajo Papá */
    'Saltar al contenido principal': 'Skip to main content',
    'Gestión Trabajo Papá': 'Dad Work Management',
    'Control de Turnos de Vigilancia, Compensatorios y Vacaciones': 'Security Shifts, Compensatory Days & Vacation Control',
    'En línea · Sincronizado': 'Online · Synced',
    '1. Turnos y Compensatorios': '1. Shifts & Compensatory Days',
    '2. Historial y Saldo de Vacaciones': '2. Vacation History & Balance',
    '3. Respaldo y Perfil Laboral': '3. Encrypted Backup & Work Profile',
    '4. Soporte y Novedades': '4. Helpdesk & Payroll Claims',
    'Ingreso de Guarda de Seguridad': 'Security Guard Sign In',
    'Entrar a mis turnos': 'Enter my shifts',
    'Ingreso directo Papá (PIN 1234)': 'Quick Sign-In Dad (PIN 1234)',
    'Resumen de Días Trabajados (Desde el 1 de Enero hasta Hoy)': 'Worked Days Summary (Jan 1st to Today)',
    'Contabilizar:': 'Count scope:',
    'Fecha de Hoy / Corte:': 'Today / Cutoff Date:',
    '⚡ Generador avanzado': '⚡ Advanced Generator',
    'Saldo Compensatorios Pendientes': 'Pending Compensatory Balance',
    '🔄 ¿Cómo vas en tus turnos hoy? (Calcula los otros días en adelante)': '🔄 How is your shift rotation today? (Project upcoming days)',
    '📅 Calcular mis turnos desde el 1 de enero y proyectar días en adelante': '📅 Calculate my shifts from Jan 1st and project forward',
    '➡️ Tus próximos turnos de hoy en adelante:': '➡️ Your upcoming shifts from today:',
    '◀ Mes anterior': '◀ Prev month',
    'Mes siguiente ▶': 'Next month ▶',
    'Ir a Hoy': 'Go to Today',
    'Registrar o Modificar Turno Diario': 'Register or Edit Daily Shift',
    'Guardar turno del día': 'Save daily shift',
    'Limpiar formulario': 'Clear form',
    'Programación e Histórico de Turnos del Mes': 'Monthly Shift Schedule & History',
    'Control de Vacaciones Causadas, Disfrutadas y Pendientes': 'Accrued, Taken & Pending Vacation Control',
    'Registrar Vacaciones Disfrutadas o Programar Próximas': 'Log Taken Vacations or Schedule Upcoming',
    'Registrar periodo de vacaciones': 'Save vacation period',
    'Historial de Vacaciones Registradas': 'Registered Vacations History',
    'Datos Laborales y Preferencias de Notificación': 'Work Profile & Notification Preferences',
    'Guardar configuración laboral': 'Save work profile',
    'Puestos de Guardia Habituales': 'Usual Guard Posts',
    'Agregar puesto a la lista': 'Add post to list',
    'Copia de Seguridad Cifrada y Recuperación': 'Encrypted Backup & Recovery',
    'Generar y descargar copia de seguridad cifrada': 'Generate & download encrypted backup',
    'Mesa de Ayuda y Registro de Novedades / Reclamos de Nómina': 'Helpdesk & Payroll Discrepancy Claims',
    'Enviar solicitud de revisión': 'Submit review request',
    'Mis Solicitudes y Estado de Seguimiento': 'My Requests & Tracking Status',
  };

  const REVERSE = Object.fromEntries(Object.entries(EN).map(([es, en]) => [en, es]));

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function normHex(v) {
    const m = String(v || '').match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    const h = m[1];
    return '#' + (h.length === 3 ? h.split('').map((c) => c + c).join('') : h).toLowerCase();
  }

  function hexRgb(hex) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbHex(r, g, b) {
    return (
      '#' +
      [r, g, b]
        .map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0'))
        .join('')
    );
  }

  function lum(hex) {
    const { r, g, b } = hexRgb(hex);
    const f = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }

  function contrast(a, b) {
    if (!normHex(a) || !normHex(b)) return 1;
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function rgbHsl(hex) {
    const { r, g, b } = hexRgb(hex);
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    return { h: h * 60, s, l };
  }

  function hslHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return rgbHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  function shiftHue(hex, deg) {
    const c = normHex(hex);
    if (!c) return hex;
    const h = rgbHsl(c);
    return hslHex(h.h + deg, h.s, h.l);
  }

  function mix(a, b, t) {
    const A = hexRgb(a);
    const B = hexRgb(b);
    return rgbHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
  }

  function bestInk(bgs) {
    const ink = ['#0b0b0f', '#ffffff']
      .map((c) => ({ c, score: Math.min(...bgs.map((b) => contrast(c, b))) }))
      .sort((a, b) => b.score - a.score)[0];
    return ink ? ink.c : '#ffffff';
  }

  function primaryBackground(hex) {
    const c = normHex(hex) || '#7c5cff';
    if (lum(c) >= 0.42) return c;
    const h = rgbHsl(c);
    for (let l = h.l; l >= 0; l -= 0.02) {
      const candidate = hslHex(h.h, h.s, l);
      if (contrast('#ffffff', candidate) >= 4.5) return candidate;
    }
    return '#0b0b0f';
  }

  function primaryForeground(bg) {
    return lum(bg) >= 0.42 ? '#0b0b0f' : '#ffffff';
  }

  function readableOn(hex, bgs) {
    const c = normHex(hex);
    if (!c) return hex;
    const list = bgs.filter((b) => normHex(b));
    if (!list.length || list.every((b) => contrast(c, b) >= 4.5)) return c;
    const h = rgbHsl(c);
    const avg = list.reduce((n, b) => n + lum(b), 0) / list.length;
    const dir = avg > 0.42 ? -1 : 1;
    for (let step = 1; step <= 100; step += 1) {
      const next = Math.max(0, Math.min(1, h.l + (dir * step) / 100));
      const candidate = hslHex(h.h, h.s, next);
      if (list.every((b) => contrast(candidate, b) >= 4.5)) return candidate;
      if (next === 0 || next === 1) break;
    }
    return avg > 0.42 ? '#0b0b0f' : '#ffffff';
  }

  function derive(accent, accent2, mode) {
    if (mode === 'dark') {
      return {
        bg: mix('#0b0d12', accent, 0.06),
        surface: mix('#141821', accent, 0.09),
        surface2: mix('#1c2130', accent, 0.12),
        fg: '#f5f6fa',
        muted: '#b8bec9',
        border: mix('#303747', accent, 0.2),
        accent,
        accent2,
      };
    }
    return {
      bg: mix('#faf9f6', accent, 0.05),
      surface: '#ffffff',
      surface2: mix('#eff1f5', accent, 0.07),
      fg: '#14161b',
      muted: '#59606c',
      border: mix('#d8dce4', accent, 0.16),
      accent,
      accent2,
    };
  }

  function themeSet(index, mode) {
    if (mode === 'contrast') {
      return {
        bg: '#000000',
        surface: '#0b0b0b',
        surface2: '#151515',
        fg: '#ffffff',
        muted: '#e8e8e8',
        border: '#ffffff',
        accent: '#ffe14d',
        accent2: '#7cf7ff',
      };
    }
    const base = DATA.base || {};
    const accent = normHex(base.accent) || '#7c5cff';
    const accent2 = normHex(base.accent2) || '#19e3b1';
    if (index === 0) {
      const baseBg = normHex(base.bg);
      const baseSurface = normHex(base.surface);
      const baseDark = baseBg ? lum(baseBg) < 0.4 : mode === 'dark';
      if (mode === 'dark' && baseDark && baseSurface) {
        return {
          bg: baseBg || '#0b0b12',
          surface: baseSurface,
          surface2: normHex(base.surface2) || baseSurface,
          fg: normHex(base.fg) || '#f5f2ea',
          muted: normHex(base.muted) || '#c9c6d8',
          border: normHex(base.border) || '#34344a',
          accent,
          accent2,
        };
      }
      if (mode === 'light' && !baseDark && baseSurface) {
        return {
          bg: baseBg || '#faf9f6',
          surface: baseSurface,
          surface2: normHex(base.surface2) || baseSurface,
          fg: normHex(base.fg) || '#14161b',
          muted: normHex(base.muted) || '#59606c',
          border: normHex(base.border) || '#d8dce4',
          accent,
          accent2,
        };
      }
    }
    const shift = index === 0 ? 0 : index * 30;
    return derive(shiftHue(accent, shift), shiftHue(accent2, shift), mode);
  }

  const DEFAULT = {
    theme: 0,
    mode: 'dark',
    geo: 3,
    bg: 0,
    anim: 2,
    lang: 'es',
    custom: {},
    a11y: {
      reduceMotion: false,
      largeText: false,
      lineHeight: 1.6,
      letterSpacing: 0,
      underline: false,
      focusRing: false,
      colorBlind: 'none',
      fontScale: 100,
    },
  };

  let cfg = load();
  let lastFocus = null;
  let panelOpen = false;
  let activePanelTab = 'themes';
  let modalCleanup = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT);
      const parsed = JSON.parse(raw);
      const merged = Object.assign(clone(DEFAULT), parsed);
      merged.a11y = Object.assign(clone(DEFAULT.a11y), parsed.a11y || {});
      merged.custom = parsed.custom || {};
      if (!MODES.includes(merged.mode)) merged.mode = 'dark';
      return merged;
    } catch {
      return clone(DEFAULT);
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cfg));
    } catch {
      // ignore storage quota errors
    }
  }

  function resolvedMode() {
    if (cfg.mode === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return cfg.mode;
  }

  function currentSet() {
    const mode = resolvedMode();
    const base = themeSet(cfg.theme, mode);
    const custom = (cfg.custom && cfg.custom[mode]) || {};
    return Object.assign({}, base, custom);
  }

  function applyTheme() {
    const mode = resolvedMode();
    const set = currentSet();
    const root = document.documentElement.style;
    root.setProperty('--bg', set.bg);
    root.setProperty('--surface', set.surface);
    root.setProperty('--surface-2', set.surface2);
    root.setProperty('--fg', set.fg);
    root.setProperty('--muted', set.muted);
    root.setProperty('--accent', set.accent);
    root.setProperty('--accent-2', set.accent2);
    root.setProperty('--border', set.border);
    root.setProperty('--accent-text', readableOn(set.accent, [set.bg, set.surface]));
    root.setProperty('--accent-2-text', readableOn(set.accent2, [set.bg, set.surface]));
    root.setProperty('--ink-accent', bestInk([set.accent]));
    root.setProperty('--ink-accent-2', bestInk([set.accent2]));
    const primaryBg = primaryBackground(set.accent);
    root.setProperty('--primary-bg', primaryBg);
    root.setProperty('--primary-fg', primaryForeground(primaryBg));
    root.setProperty(
      '--ui-shadow',
      mode === 'contrast' ? 'none' : '0 26px 60px -42px rgba(0,0,0,.65)'
    );
    document.documentElement.dataset.appMode = mode;
    document.body.dataset.appMode = mode;
    document.body.classList.toggle('is-contrast', mode === 'contrast');
    document.body.dataset.appTheme = String(cfg.theme);
    document.documentElement.style.colorScheme =
      mode === 'dark' || mode === 'contrast' ? 'dark' : 'light';
    updateModeButton();
    if (panelOpen) renderPanel();
  }

  function applyGeometry() {
    const g = GEO[cfg.geo] || GEO[3];
    const s = document.documentElement.style;
    s.setProperty('--ui-radius', g.r);
    s.setProperty('--ui-card', g.c);
    s.setProperty('--ui-btn', g.b);
    document.body.dataset.appGeo = String(cfg.geo);
  }

  function applyBackground() {
    document.body.dataset.appBg = String(cfg.bg);
  }

  function reducedMotion() {
    return (
      cfg.a11y.reduceMotion ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    );
  }

  function applyAnimation() {
    document.body.dataset.appAnim = String(cfg.anim);
    const content = $('.app-content');
    if (content && !reducedMotion()) {
      content.style.animation = 'none';
      void content.offsetWidth;
      content.style.animation = '';
    }
  }

  function applyA11y() {
    const a = cfg.a11y;
    const root = document.documentElement;
    root.style.fontSize = 16 * ((a.fontScale || 100) / 100) + 'px';
    root.style.setProperty('--ui-line', String(a.lineHeight || 1.6));
    root.style.setProperty('--ui-letter', (a.letterSpacing || 0) + 'em');
    document.body.classList.toggle('a11y-reduce-motion', !!reducedMotion());
    document.body.classList.toggle('a11y-underline', !!a.underline);
    document.body.classList.toggle('a11y-focus', !!a.focusRing);
    document.body.classList.remove(
      'a11y-cb-protanopia',
      'a11y-cb-deuteranopia',
      'a11y-cb-tritanopia'
    );
    if (a.colorBlind && a.colorBlind !== 'none') {
      document.body.classList.add('a11y-cb-' + a.colorBlind);
    }
    document.body.style.lineHeight = String(a.lineHeight || 1.6);
    document.body.style.letterSpacing = (a.letterSpacing || 0) + 'em';
  }

  function tr(text) {
    return cfg.lang === 'en' ? EN[text] || text : text;
  }

  function translateNode(node, dict) {
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    if (!trimmed || !dict[trimmed]) return;
    const start = raw.indexOf(trimmed);
    node.nodeValue =
      raw.slice(0, start) + dict[trimmed] + raw.slice(start + trimmed.length);
  }

  function translateAttributes(dict) {
    $$('[placeholder],[aria-label],[title]').forEach((el) => {
      ['placeholder', 'aria-label', 'title'].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (value && dict[value]) el.setAttribute(attr, dict[value]);
      });
    });
  }

  function applyLang() {
    document.documentElement.lang = cfg.lang;
    const dict = cfg.lang === 'en' ? EN : REVERSE;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p || /^(SCRIPT|STYLE|TEXTAREA|OPTION|CODE|PRE)$/.test(p.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => translateNode(node, dict));
    translateAttributes(dict);
    updateModeButton();
    renderPanel();
  }

  function updateModeButton() {
    const mode = cfg.mode;
    const btn = $('#mode-toggle');
    if (!btn) return;
    btn.setAttribute(
      'aria-label',
      tr('Modo') + ': ' + tr(MODE_LABEL[mode]) + '. ' + tr('Cambiar modo')
    );
    btn.setAttribute('title', tr('Modo') + ': ' + tr(MODE_LABEL[mode]));
    const use = btn.querySelector('use');
    if (use) use.setAttribute('href', '#i-' + MODE_ICON[mode]);
    const label = $('#mode-label');
    if (label) label.textContent = tr(MODE_LABEL[mode]);
  }

  function announcePanel(msg) {
    const live = $('#live-region');
    if (!live) return;
    live.textContent = '';
    window.setTimeout(() => {
      live.textContent = msg;
    }, 30);
  }

  function escHtml(v) {
    return String(v == null ? '' : v).replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
    );
  }

  function toast(title, type, text) {
    const stack = $('#toast-stack');
    if (!stack) return;
    const t = type || 'info';
    const el = document.createElement('div');
    el.className = 'app-toast app-toast--' + t;
    const iconName =
      t === 'success' ? 'check' : t === 'warn' ? 'alert' : t === 'danger' ? 'alert' : 'info';
    el.innerHTML =
      '<svg aria-hidden="true"><use href="#i-' +
      iconName +
      '"/></svg><div><strong>' +
      escHtml(tr(title || 'Guardado')) +
      '</strong>' +
      (text ? '<p>' + escHtml(tr(text)) + '</p>' : '') +
      '</div><button class="app-toast-close" type="button" aria-label="' +
      tr('Cerrar') +
      '"><svg aria-hidden="true"><use href="#i-close"/></svg></button>';
    stack.appendChild(el);
    announcePanel(title || 'Guardado');
    const remove = () => {
      el.classList.add('is-out');
      window.setTimeout(() => el.remove(), 220);
    };
    el.querySelector('.app-toast-close').addEventListener('click', remove);
    window.setTimeout(remove, 4200);
  }

  function focusables(root) {
    return $$(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      root
    ).filter((el) => el.offsetParent !== null);
  }

  function trap(root) {
    const onKey = (event) => {
      if (event.key !== 'Tab') return;
      const list = focusables(root);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    root.addEventListener('keydown', onKey);
    return () => root.removeEventListener('keydown', onKey);
  }

  function openModal(opts) {
    const root = $('#modal-root');
    if (!root) return;
    const actions = opts.actions || [{ label: 'Aceptar', kind: 'primary', close: true }];
    root.innerHTML =
      '<div class="app-modal-backdrop" id="modal-backdrop"><section class="app-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="app-modal-head"><h2 id="modal-title">' +
      escHtml(tr(opts.title || 'Aceptar')) +
      '</h2><button class="app-icon-btn" type="button" data-modal-close aria-label="' +
      tr('Cerrar') +
      '"><svg class="app-icon" aria-hidden="true"><use href="#i-close"/></svg></button></div><div class="app-modal-body">' +
      (opts.body || '') +
      '</div><div class="app-modal-foot">' +
      actions
        .map(
          (a, i) =>
            '<button class="app-btn ' +
            (a.kind === 'danger'
              ? 'app-btn--danger'
              : a.kind === 'primary'
              ? 'app-btn--primary'
              : '') +
            '" type="button" data-modal-action="' +
            i +
            '">' +
            escHtml(tr(a.label || 'Aceptar')) +
            '</button>'
        )
        .join('') +
      '</div></section></div>';
    const backdrop = $('#modal-backdrop');
    const dialog = $('.app-modal', backdrop);
    document.body.classList.add('modal-open');
    const close = () => {
      if (modalCleanup) modalCleanup();
      root.innerHTML = '';
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    modalCleanup = trap(dialog);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
    $$('[data-modal-close]', dialog).forEach((b) => b.addEventListener('click', close));
    $$('[data-modal-action]', dialog).forEach((b) =>
      b.addEventListener('click', () => {
        const action = actions[Number(b.dataset.modalAction)];
        if (action && action.onClick) action.onClick(close);
        else close();
      })
    );
    const first = focusables(dialog)[0];
    if (first) first.focus();
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    return close;
  }

  function tabsHtml() {
    return PANEL_TABS.map(
      (t) =>
        '<button class="app-cp-tab" role="tab" type="button" id="cp-tab-' +
        t.id +
        '" data-cp-tab="' +
        t.id +
        '" aria-selected="' +
        (activePanelTab === t.id) +
        '" aria-controls="cp-panel-' +
        t.id +
        '"><svg aria-hidden="true"><use href="#i-' +
        t.icon +
        '"/></svg><span>' +
        tr(t.label) +
        '</span></button>'
    ).join('');
  }

  function themeSwatch(name, i) {
    const light = themeSet(i, 'light');
    return (
      '<button class="app-cp-choice" type="button" data-theme="' +
      i +
      '" aria-pressed="' +
      (cfg.theme === i) +
      '"><span class="app-cp-swatch" style="background:linear-gradient(135deg,' +
      light.accent +
      ',' +
      light.accent2 +
      ')"></span><span>' +
      tr(name) +
      '</span></button>'
    );
  }

  function bgPreview(i) {
    const a = 'var(--accent)';
    const b = 'var(--accent-2)';
    const f = 'var(--fg)';
    const map = [
      'linear-gradient(135deg,color-mix(in srgb,' + a + ' 24%,transparent),color-mix(in srgb,' + b + ' 18%,transparent))',
      'linear-gradient(' + f + ' 1px,transparent 1px),linear-gradient(90deg,' + f + ' 1px,transparent 1px)',
      'radial-gradient(' + a + ' 1.3px,transparent 1.4px)',
      'radial-gradient(60% 60% at 20% 20%,' + a + ',transparent 65%),radial-gradient(60% 60% at 80% 80%,' + b + ',transparent 65%)',
      'radial-gradient(50% 50% at 30% 20%,' + a + ',transparent 60%),radial-gradient(50% 50% at 80% 70%,' + b + ',transparent 60%)',
      'repeating-radial-gradient(circle at 30% 70%,' + a + ' 0 1px,transparent 2px 14px)',
      'repeating-linear-gradient(135deg,' + a + ' 0 2px,transparent 2px 9px)',
      'radial-gradient(' + f + ' .7px,transparent .8px)',
      'radial-gradient(40% 40% at 30% 30%,' + a + ',transparent 60%),radial-gradient(40% 40% at 70% 70%,' + b + ',transparent 60%)',
      'linear-gradient(' + a + ' 1px,transparent 1px),linear-gradient(90deg,' + b + ' 1px,transparent 1px)',
      'radial-gradient(' + f + ' .6px,transparent .7px)',
      'conic-gradient(from 90deg at 50% 50%,' + a + ',transparent 30%,' + b + ' 60%,transparent 90%)',
    ];
    return map[i] || map[0];
  }

  function storageUsage() {
    let chars = 0;
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('catalogo.') || k.startsWith('gestion_papa_')) {
          chars += k.length + (localStorage.getItem(k) || '').length;
        }
      });
    } catch {
      // ignore
    }
    return tr('Uso local') + ': ' + (chars / 1024).toFixed(1) + ' KB';
  }

  function dbRows() {
    const rows = [];
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('catalogo.') || k.startsWith('gestion_papa_'))
        .sort()
        .forEach((k) => {
          const value = localStorage.getItem(k) || '';
          rows.push({
            key: k.replace('catalogo.', ''),
            size: (value.length / 1024).toFixed(2) + ' KB',
            type: value.trim().startsWith('{') || value.trim().startsWith('[') ? 'JSON' : 'texto',
          });
        });
    } catch {
      // ignore
    }
    return rows;
  }

  function renderTab(tab) {
    if (tab === 'themes') {
      const modes = MODES.map(
        (m) =>
          '<button class="app-cp-choice" type="button" data-mode="' +
          m +
          '" aria-pressed="' +
          (cfg.mode === m) +
          '"><svg class="app-icon" aria-hidden="true" style="width:15px;height:15px"><use href="#i-' +
          MODE_ICON[m] +
          '"/></svg><span>' +
          tr(MODE_LABEL[m]) +
          '</span></button>'
      ).join('');
      return (
        '<div class="app-cp-section"><strong>' +
        tr('Tema') +
        '</strong><div class="app-cp-grid">' +
        THEME_NAMES.map((n, i) => themeSwatch(n, i)).join('') +
        '</div><small>' +
        tr('12 temas con variantes claras y oscuras.') +
        '</small></div><div class="app-cp-section"><strong>' +
        tr('Modo') +
        '</strong><div class="app-cp-grid">' +
        modes +
        '</div><small>' +
        tr('Claro, oscuro, alto contraste y automático. Se guarda por estilo.') +
        '</small></div><div class="app-cp-section"><strong>' +
        tr('Vista previa') +
        '</strong><div class="card" style="padding:12px;margin:0"><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span class="app-avatar">GP</span><strong style="font-size:.8rem">' +
        escHtml(DATA.name) +
        '</strong><span class="app-badge" style="margin-left:auto">' +
        tr(MODE_LABEL[cfg.mode]) +
        '</span></div><div class="app-progress"><span style="width:76%"></span></div></div></div>'
      );
    }

    if (tab === 'geometry') {
      return (
        '<div class="app-cp-section"><strong>' +
        tr('Geometría') +
        '</strong><div class="app-cp-grid">' +
        GEO.map(
          (g, i) =>
            '<button class="app-cp-choice" type="button" data-geo="' +
            i +
            '" aria-pressed="' +
            (cfg.geo === i) +
            '"><span class="app-cp-preview" style="border-radius:' +
            g.r +
            '"></span><span>' +
            tr(g.name) +
            '</span></button>'
        ).join('') +
        '</div><small>' +
        tr('12 geometrías aplicadas a radios de tarjetas, botones y controles.') +
        '</small></div>'
      );
    }

    if (tab === 'backgrounds') {
      return (
        '<div class="app-cp-section"><strong>' +
        tr('Fondos') +
        '</strong><div class="app-cp-grid app-cp-grid--3">' +
        BGS.map(
          (n, i) =>
            '<button class="app-cp-choice" type="button" data-bg="' +
            i +
            '" aria-pressed="' +
            (cfg.bg === i) +
            '"><span class="app-cp-preview" style="background:' +
            bgPreview(i) +
            ';background-size:' +
            (i === 1 || i === 9
              ? '10px 10px'
              : i === 2 || i === 7 || i === 10
              ? '7px 7px'
              : '100% 100%') +
            '"></span><span>' +
            tr(n) +
            '</span></button>'
        ).join('') +
        '</div><small>' +
        tr('12 fondos dinámicos, coherentes con la paleta del estilo.') +
        '</small></div>'
      );
    }

    if (tab === 'animations') {
      return (
        '<div class="app-cp-section"><strong>' +
        tr('Animaciones') +
        '</strong><div class="app-cp-grid">' +
        ANIMS.map(
          (n, i) =>
            '<button class="app-cp-choice" type="button" data-anim="' +
            (i + 1) +
            '" aria-pressed="' +
            (cfg.anim === i + 1) +
            '"><svg class="app-icon" aria-hidden="true" style="width:15px;height:15px"><use href="#i-play"/></svg><span>' +
            tr(n) +
            '</span></button>'
        ).join('') +
        '</div><small>' +
        tr(
          '12 animaciones de entrada y feedback. Reduce el movimiento desde Accesibilidad si lo necesitas.'
        ) +
        '</small></div>'
      );
    }

    if (tab === 'colors') {
      const set = currentSet();
      const rows = [
        ['accent', 'Acento', set.accent],
        ['accent2', 'Acento 2', set.accent2],
        ['bg', 'Fondo', set.bg],
        ['surface', 'Superficie', set.surface],
        ['fg', 'Texto', set.fg],
        ['muted', 'Texto secundario', set.muted],
      ];
      return (
        '<div class="app-cp-section"><strong>' +
        tr('Colores') +
        '</strong>' +
        rows
          .map(
            ([k, label, value]) =>
              '<div class="app-cp-color-row"><label for="cp-color-' +
              k +
              '">' +
              tr(label) +
              '</label><input id="cp-color-' +
              k +
              '" type="color" data-color="' +
              k +
              '" value="' +
              (normHex(value) || '#000000') +
              '"></div>'
          )
          .join('') +
        '<small id="cp-color-warning" class="app-cp-note">' +
        tr('Los cambios se guardan en este navegador y se aplican al instante.') +
        '</small><div class="app-row"><button class="app-btn app-btn--sm app-btn--primary" type="button" data-action="colors-apply">' +
        tr('Aplicar') +
        '</button><button class="app-btn app-btn--sm" type="button" data-action="colors-reset">' +
        tr('Restablecer') +
        '</button></div></div>'
      );
    }

    if (tab === 'languages') {
      return (
        '<div class="app-cp-section"><strong>' +
        tr('Idioma de la interfaz') +
        '</strong><div class="app-cp-grid"><button class="app-cp-choice" type="button" data-lang="es" aria-pressed="' +
        (cfg.lang === 'es') +
        '"><span class="app-cp-swatch" style="background:linear-gradient(135deg,#f59e0b,#ef4444)"></span><span>Español</span></button><button class="app-cp-choice" type="button" data-lang="en" aria-pressed="' +
        (cfg.lang === 'en') +
        '"><span class="app-cp-swatch" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6)"></span><span>English</span></button></div></div><div class="app-cp-section"><strong>' +
        tr('Base de conocimiento') +
        '</strong><div class="app-cp-note">' +
        tr(
          'El sistema cambia según el idioma seleccionado desde una base de conocimiento local. Sin red.'
        ) +
        '</div></div>'
      );
    }

    if (tab === 'accessibility') {
      const a = cfg.a11y;
      return (
        '<div class="app-cp-section"><strong>' +
        tr('Accesibilidad') +
        '</strong><label class="app-check app-check--switch"><input type="checkbox" data-a11y="reduceMotion" ' +
        (a.reduceMotion ? 'checked' : '') +
        '> ' +
        tr('Reducir movimiento') +
        '</label><label class="app-check app-check--switch"><input type="checkbox" data-a11y="largeText" ' +
        (a.largeText ? 'checked' : '') +
        '> ' +
        tr('Texto grande') +
        '</label><label class="app-check app-check--switch"><input type="checkbox" data-a11y="underline" ' +
        (a.underline ? 'checked' : '') +
        '> ' +
        tr('Subrayar enlaces') +
        '</label><label class="app-check app-check--switch"><input type="checkbox" data-a11y="focusRing" ' +
        (a.focusRing ? 'checked' : '') +
        '> ' +
        tr('Anillo de foco ampliado') +
        '</label></div><div class="app-cp-section"><label for="cp-line">' +
        tr('Espaciado de línea') +
        '</label><select class="app-select" id="cp-line" data-a11y="lineHeight"><option value="1.4" ' +
        (a.lineHeight == 1.4 ? 'selected' : '') +
        '>1.4</option><option value="1.6" ' +
        (a.lineHeight == 1.6 ? 'selected' : '') +
        '>1.6</option><option value="1.8" ' +
        (a.lineHeight == 1.8 ? 'selected' : '') +
        '>1.8</option><option value="2" ' +
        (a.lineHeight == 2 ? 'selected' : '') +
        '>2.0</option></select></div><div class="app-cp-section"><label for="cp-letter">' +
        tr('Espaciado de letras') +
        '</label><select class="app-select" id="cp-letter" data-a11y="letterSpacing"><option value="0" ' +
        (a.letterSpacing == 0 ? 'selected' : '') +
        '>' +
        tr('Normal') +
        '</option><option value="0.03" ' +
        (a.letterSpacing == 0.03 ? 'selected' : '') +
        '>' +
        tr('Amplio') +
        '</option><option value="0.06" ' +
        (a.letterSpacing == 0.06 ? 'selected' : '') +
        '>' +
        tr('Muy amplio') +
        '</option></select></div><div class="app-cp-section"><label for="cp-scale">' +
        tr('Escala del texto') +
        ' <output id="cp-scale-out">' +
        (a.fontScale || 100) +
        '%</output></label><input class="app-range" id="cp-scale" type="range" min="90" max="140" step="5" value="' +
        (a.fontScale || 100) +
        '" data-a11y="fontScale"></div><div class="app-cp-section"><label for="cp-cb">' +
        tr('Filtro de color') +
        '</label><select class="app-select" id="cp-cb" data-a11y="colorBlind"><option value="none" ' +
        (a.colorBlind === 'none' ? 'selected' : '') +
        '>' +
        tr('Ninguno') +
        '</option><option value="protanopia" ' +
        (a.colorBlind === 'protanopia' ? 'selected' : '') +
        '>Protanopia</option><option value="deuteranopia" ' +
        (a.colorBlind === 'deuteranopia' ? 'selected' : '') +
        '>Deuteranopia</option><option value="tritanopia" ' +
        (a.colorBlind === 'tritanopia' ? 'selected' : '') +
        '>Tritanopia</option></select></div><div class="app-row"><button class="app-btn app-btn--sm" type="button" data-action="a11y-reset">' +
        tr('Restablecer accesibilidad') +
        '</button></div>'
      );
    }

    if (tab === 'backups') {
      return (
        '<div class="app-cp-section"><strong>' +
        tr('Backups') +
        '</strong><div class="app-row"><button class="app-btn app-btn--sm app-btn--primary" type="button" data-action="backup-export">' +
        tr('Exportar backup') +
        '</button><button class="app-btn app-btn--sm" type="button" data-action="backup-copy">' +
        tr('Copiar backup') +
        '</button></div><label class="app-btn app-btn--sm" for="backup-file" style="width:fit-content">' +
        tr('Importar backup') +
        '</label><input id="backup-file" type="file" accept="application/json,.json" hidden><small class="app-cp-note">' +
        tr(
          'El backup incluye tema, modo, geometría, fondos, animaciones, colores, idioma y accesibilidad.'
        ) +
        '</small><div class="app-row"><button class="app-btn app-btn--sm app-btn--danger" type="button" data-action="backup-reset">' +
        tr('Restablecer todo') +
        '</button></div><small id="cp-storage" class="app-cp-note">' +
        storageUsage() +
        '</small></div>'
      );
    }

    if (tab === 'database') {
      const rows = dbRows();
      return (
        '<div class="app-cp-section"><strong>' +
        tr('Base de datos') +
        '</strong><input class="app-input" id="cp-db-search" placeholder="' +
        escHtml(tr('Buscar en la base de datos…')) +
        '" style="margin-bottom:7px"><div class="app-cp-db"><table class="app-table"><thead><tr><th>' +
        tr('Clave') +
        '</th><th>' +
        tr('Tamaño') +
        '</th><th>' +
        tr('Tipo') +
        '</th></tr></thead><tbody id="cp-db-body">' +
        rows
          .map(
            (r) =>
              '<tr><td class="app-mono" style="font-size:.58rem;max-width:130px;overflow:hidden;text-overflow:ellipsis">' +
              escHtml(r.key) +
              '</td><td>' +
              r.size +
              '</td><td>' +
              escHtml(r.type) +
              '</td></tr>'
          )
          .join('') +
        '</tbody></table></div><small class="app-cp-note">' +
        tr('Todo se guarda en localStorage. Puedes exportar o borrar la caché local.') +
        '</small><div class="app-row"><button class="app-btn app-btn--sm" type="button" data-action="db-export">' +
        tr('Exportar base de datos') +
        '</button><button class="app-btn app-btn--sm app-btn--danger" type="button" data-action="db-clear">' +
        tr('Borrar caché local') +
        '</button></div></div>'
      );
    }

    if (tab === 'about') {
      return (
        '<div class="app-cp-section"><strong>' +
        escHtml(DATA.name) +
        '</strong><p class="app-small app-muted">' +
        escHtml(DATA.summary) +
        '</p><div class="app-row"><span class="app-badge">' +
        escHtml(DATA.category) +
        '</span><span class="app-badge">' +
        escHtml(DATA.priority) +
        '</span><span class="app-badge">v' +
        escHtml(DATA.version) +
        '</span></div></div><div class="app-cp-section"><strong>' +
        tr('Base de conocimiento') +
        '</strong><div class="app-cp-note">12 ' +
        tr('Temas').toLowerCase() +
        ', 4 ' +
        tr('Modo').toLowerCase() +
        's, 12 ' +
        tr('Geometría').toLowerCase() +
        's, 12 ' +
        tr('Fondos').toLowerCase() +
        ' y 12 ' +
        tr('Animaciones').toLowerCase() +
        '.</div></div><div class="app-cp-section"><small class="app-cp-note">' +
        tr('Hecho offline con HTML, CSS y JavaScript vanilla. Sin CDN ni frameworks.') +
        '</small></div>'
      );
    }

    return '';
  }

  function renderPanel() {
    const tabs = $('#cp-tabs');
    const panels = $('#cp-panels');
    if (!tabs || !panels) return;
    tabs.innerHTML = tabsHtml();
    panels.innerHTML = PANEL_TABS.map(
      (t) =>
        '<section class="app-cp-tabpanel" role="tabpanel" id="cp-panel-' +
        t.id +
        '" data-cp-panel="' +
        t.id +
        '" aria-labelledby="cp-tab-' +
        t.id +
        '" ' +
        (activePanelTab === t.id ? '' : 'hidden') +
        '>' +
        renderTab(t.id) +
        '</section>'
    ).join('');
    const active = $('[data-cp-tab="' + activePanelTab + '"]');
    if (active) active.setAttribute('aria-selected', 'true');
  }

  function openPanel(tab) {
    const panel = $('#control-panel');
    const backdrop = $('#panel-backdrop');
    if (!panel) return;
    activePanelTab = tab || activePanelTab || 'themes';
    lastFocus = document.activeElement;
    panelOpen = true;
    panel.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-open'));
    document.body.classList.add('panel-open');
    const toggle = $('#panel-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    renderPanel();
    const first = $('[data-cp-tab="' + activePanelTab + '"]');
    if (first) first.focus();
    if (panel._cleanup) panel._cleanup();
    panel._cleanup = trap(panel);
  }

  function closePanel() {
    const panel = $('#control-panel');
    const backdrop = $('#panel-backdrop');
    if (!panel) return;
    panelOpen = false;
    panel.classList.remove('is-open');
    if (panel._cleanup) {
      panel._cleanup();
      panel._cleanup = null;
    }
    window.setTimeout(() => {
      panel.hidden = true;
      backdrop.hidden = true;
    }, 220);
    document.body.classList.remove('panel-open');
    const toggle = $('#panel-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function updateColorWarning() {
    const warning = $('#cp-color-warning');
    if (!warning) return;
    const accent = $('#cp-color-accent');
    const fg = $('#cp-color-fg');
    if (!accent || !fg) return;
    const ratio = contrast(accent.value, fg.value);
    warning.textContent =
      ratio < 4.5
        ? tr('Contraste bajo') +
          ': ' +
          ratio.toFixed(2) +
          ':1. ' +
          tr(
            'El texto sobre el acento no alcanza 4.5:1. El sistema seguirá funcionando, pero revisa la combinación.'
          )
        : tr('Los cambios se guardan en este navegador y se aplican al instante.') +
          ' · ' +
          ratio.toFixed(2) +
          ':1';
  }

  function normalize(v) {
    return String(v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function backupObject() {
    return {
      app: 'gestion-trabajo-papa-astrix-meta',
      slug: DATA.slug,
      version: DATA.version,
      exportedAt: new Date().toISOString(),
      config: cfg,
    };
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportBackup() {
    download(
      'backup-' + DATA.slug + '-' + new Date().toISOString().slice(0, 10) + '.json',
      JSON.stringify(backupObject(), null, 2)
    );
    toast('Backup exportado', 'success');
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const config = parsed.config || parsed;
        if (!config || typeof config !== 'object') throw new Error('sin config');
        Object.assign(cfg, config);
        cfg.a11y = Object.assign(clone(DEFAULT.a11y), config.a11y || {});
        save();
        applyAll();
        toast('Backup importado', 'success');
      } catch {
        toast('No se pudo importar el backup', 'danger');
      }
    };
    reader.readAsText(file);
  }

  function fallbackCopy(text, done) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      done();
    } catch {
      toast('No se pudo copiar', 'danger');
    }
    area.remove();
  }

  function copyBackup() {
    const text = JSON.stringify(backupObject(), null, 2);
    const done = () => toast('Backup copiado', 'success');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function resetAll() {
    openModal({
      title: 'Restablecer configuración',
      body:
        '<p>' +
        tr('¿Seguro que quieres restablecer toda la configuración de este estilo?') +
        '</p><p class="app-small app-muted">' +
        tr('Se borrarán tema, modo, geometría, fondos, animaciones, colores, idioma y accesibilidad.') +
        '</p>',
      actions: [
        { label: 'Cancelar', close: true },
        {
          label: 'Sí, restablecer',
          kind: 'danger',
          onClick: (close) => {
            try {
              localStorage.removeItem(KEY);
            } catch {
              // ignore
            }
            cfg = clone(DEFAULT);
            save();
            close();
            applyAll();
            toast('Configuración aplicada', 'success');
          },
        },
      ],
    });
  }

  function setA11y(key, value) {
    if (key === 'fontScale') cfg.a11y.fontScale = Number(value);
    else if (key === 'lineHeight') cfg.a11y.lineHeight = Number(value);
    else if (key === 'letterSpacing') cfg.a11y.letterSpacing = Number(value);
    else if (key === 'largeText') {
      cfg.a11y.largeText = !!value;
      cfg.a11y.fontScale = value ? Math.max(cfg.a11y.fontScale, 125) : 100;
    } else cfg.a11y[key] = value;
    save();
    applyA11y();
    const scale = $('#cp-scale');
    if (scale) scale.value = cfg.a11y.fontScale;
    const out = $('#cp-scale-out');
    if (out) out.textContent = cfg.a11y.fontScale + '%';
  }

  function handleAction(action) {
    if (action === 'open-panel') {
      openPanel('themes');
      return;
    }
    if (action === 'colors-apply') {
      const get = (k) => {
        const el = $('#cp-color-' + k);
        return el ? el.value : null;
      };
      const mode = resolvedMode();
      cfg.custom[mode] = {
        accent: get('accent'),
        accent2: get('accent2'),
        bg: get('bg'),
        surface: get('surface'),
        fg: get('fg'),
        muted: get('muted'),
      };
      save();
      applyTheme();
      renderPanel();
      toast('Colores actualizados', 'success');
      return;
    }
    if (action === 'colors-reset') {
      delete cfg.custom[resolvedMode()];
      save();
      applyTheme();
      renderPanel();
      toast('Colores actualizados', 'info');
      return;
    }
    if (action === 'a11y-reset') {
      cfg.a11y = clone(DEFAULT.a11y);
      save();
      applyA11y();
      renderPanel();
      toast('Restablecer accesibilidad', 'info');
      return;
    }
    if (action === 'backup-export') {
      exportBackup();
      return;
    }
    if (action === 'backup-copy') {
      copyBackup();
      return;
    }
    if (action === 'backup-reset') {
      resetAll();
      return;
    }
    if (action === 'db-export') {
      const data = {};
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('catalogo.') || k.startsWith('gestion_papa_'))
          .forEach((k) => {
            data[k] = localStorage.getItem(k);
          });
      } catch {
        // ignore
      }
      download('database-' + DATA.slug + '.json', JSON.stringify(data, null, 2));
      toast('Exportar base de datos', 'success');
      return;
    }
    if (action === 'db-clear') {
      openModal({
        title: 'Borrar caché local',
        body:
          '<p>' +
          tr(
            'Se borrarán todas las claves de personalización en localStorage. La página se recargará.'
          ) +
          '</p>',
        actions: [
          { label: 'Cancelar', close: true },
          {
            label: 'Borrar caché local',
            kind: 'danger',
            onClick: (close) => {
              try {
                Object.keys(localStorage)
                  .filter((k) => k.startsWith('catalogo.'))
                  .forEach((k) => localStorage.removeItem(k));
              } catch {
                // ignore
              }
              close();
              toast('Caché local borrada', 'success');
              window.setTimeout(() => location.reload(), 500);
            },
          },
        ],
      });
    }
  }

  function applyAll() {
    applyTheme();
    applyGeometry();
    applyBackground();
    applyAnimation();
    applyA11y();
    applyLang();
  }

  function bind() {
    document.addEventListener('click', (event) => {
      const cpTab = event.target.closest('[data-cp-tab]');
      if (cpTab) {
        activePanelTab = cpTab.dataset.cpTab;
        renderPanel();
        const next = $('[data-cp-tab="' + activePanelTab + '"]');
        if (next) next.focus();
        return;
      }
      const panelTab = event.target.closest('[data-panel-tab]');
      if (panelTab) {
        event.preventDefault();
        openPanel(panelTab.dataset.panelTab);
        return;
      }
      const mode = event.target.closest('[data-mode]');
      if (mode) {
        cfg.mode = mode.dataset.mode;
        save();
        applyTheme();
        toast('Modo actualizado', 'success', tr(MODE_LABEL[cfg.mode]));
        return;
      }
      const theme = event.target.closest('[data-theme]');
      if (theme) {
        cfg.theme = Number(theme.dataset.theme);
        save();
        applyTheme();
        toast('Tema actualizado', 'success', tr(THEME_NAMES[cfg.theme]));
        return;
      }
      const geo = event.target.closest('[data-geo]');
      if (geo) {
        cfg.geo = Number(geo.dataset.geo);
        save();
        applyGeometry();
        renderPanel();
        toast('Geometría actualizada', 'success');
        return;
      }
      const bg = event.target.closest('[data-bg]');
      if (bg) {
        cfg.bg = Number(bg.dataset.bg);
        save();
        applyBackground();
        renderPanel();
        toast('Fondo actualizado', 'success');
        return;
      }
      const anim = event.target.closest('[data-anim]');
      if (anim) {
        cfg.anim = Number(anim.dataset.anim);
        save();
        applyAnimation();
        renderPanel();
        toast('Animación actualizada', 'success');
        return;
      }
      const lang = event.target.closest('[data-lang]');
      if (lang) {
        cfg.lang = lang.dataset.lang;
        save();
        applyLang();
        toast('Idioma actualizado', 'success');
        return;
      }
      const action = event.target.closest('[data-action]');
      if (action) {
        handleAction(action.dataset.action);
        return;
      }
    });

    document.addEventListener('input', (event) => {
      const dbSearch = event.target.closest('#cp-db-search');
      if (dbSearch) {
        const q = normalize(dbSearch.value);
        $$('#cp-db-body tr').forEach((row) => {
          row.hidden = !!q && !normalize(row.textContent).includes(q);
        });
        return;
      }
      const scale = event.target.closest('#cp-scale');
      if (scale) {
        const out = $('#cp-scale-out');
        if (out) out.textContent = scale.value + '%';
        setA11y('fontScale', scale.value);
        return;
      }
      if (event.target.closest('[data-color]')) {
        updateColorWarning();
      }
    });

    document.addEventListener('change', (event) => {
      const a11y = event.target.closest('[data-a11y]');
      if (a11y) {
        const key = a11y.dataset.a11y;
        setA11y(key, a11y.type === 'checkbox' ? a11y.checked : a11y.value);
        if (!a11y.matches('input[type="range"]')) renderPanel();
        return;
      }
      if (event.target.closest('[data-color]')) {
        updateColorWarning();
        return;
      }
      const file = event.target.closest('#backup-file');
      if (file) {
        importBackup(file.files && file.files[0]);
      }
    });

    $('#mode-toggle')?.addEventListener('click', () => {
      const i = MODES.indexOf(cfg.mode);
      cfg.mode = MODES[(i + 1) % MODES.length];
      save();
      applyTheme();
      toast('Modo actualizado', 'success', tr(MODE_LABEL[cfg.mode]));
    });

    $('#cp-close')?.addEventListener('click', closePanel);
    $('#cp-close2')?.addEventListener('click', closePanel);
    $('#panel-backdrop')?.addEventListener('click', closePanel);
    $('#cp-reset')?.addEventListener('click', resetAll);
    $('#panel-toggle')?.addEventListener('click', () => openPanel('themes'));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && panelOpen) {
        closePanel();
        return;
      }
      if (
        panelOpen &&
        event.target.closest('#cp-tabs') &&
        (event.key === 'ArrowDown' ||
          event.key === 'ArrowUp' ||
          event.key === 'ArrowLeft' ||
          event.key === 'ArrowRight')
      ) {
        const tabs = $$('[data-cp-tab]');
        const idx = tabs.indexOf(document.activeElement);
        if (idx >= 0) {
          event.preventDefault();
          const next =
            (idx +
              (event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1) +
              tabs.length) %
            tabs.length;
          tabs[next].click();
        }
      }
    });

    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) {
        mq.addEventListener('change', () => {
          if (cfg.mode === 'auto') applyTheme();
        });
      }
    }

    window.addEventListener('storage', (event) => {
      if (event.key !== KEY || !event.newValue) return;
      cfg = load();
      applyAll();
    });
  }

  function init() {
    applyAll();
    renderPanel();
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
