'use strict';

(function () {
  const STORAGE_KEYS = {
    TOKEN: 'gestion_papa_session_token',
    USER: 'gestion_papa_user',
    OFFLINE_QUEUE: 'gestion_papa_offline_queue_v1',
    CACHE_SHIFTS: 'gestion_papa_cache_shifts_v1',
    CACHE_VACATIONS: 'gestion_papa_cache_vacations_v1',
  };

  const SHIFT_LABELS = {
    diurno: '☀️ Turno Diurno',
    nocturno: '🌙 Turno Nocturno',
    relevo: '🔄 Turno de Relevo',
    descanso_reglamentario: '🏠 Descanso Reglamentario',
    descanso_compensatorio: '✅ Descanso Compensatorio',
    permiso_incapacidad: '🏥 Permiso / Incapacidad',
    vacaciones: '🏖️ Vacaciones',
  };

  const VAC_STATUS_LABELS = {
    disfrutada: '✅ Disfrutada',
    programada: '📅 Programada',
    pendiente_aprobacion: '⏳ Pendiente de aprobación',
  };

  const TICKET_CATEGORY_LABELS = {
    error_turno: '📋 Diferencia en turno/festivo',
    duda_vacaciones: '🏖️ Saldo de vacaciones',
    sugerencia: '💡 Sugerencia',
    soporte_tecnico: '🛠️ Soporte técnico',
  };

  const state = {
    token: localStorage.getItem(STORAGE_KEYS.TOKEN) || null,
    user: null,
    posts: [],
    shifts: [],
    summary: null,
    vacations: null,
    backups: [],
    tickets: [],
    festivosMap: new Map(),
    lastModalTrigger: null,
    pendingConflict: null,
  };

  // Registrar Service Worker para PWA Offline-First
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  // Utilidad para anunciar mensajes en región viva accesible
  function announce(message, type = 'info') {
    const region = document.getElementById('global-live-region');
    if (!region) return;
    region.className = `alert-box alert-${type}`;
    region.textContent = message;
    region.classList.remove('hidden');
    clearTimeout(region._hideTimer);
    region._hideTimer = setTimeout(() => {
      region.classList.add('hidden');
    }, 6500);
  }

  function getOfflineQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveOfflineQueue(queue) {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    updateConnectionUI();
  }

  function enqueueOfflineOperation(type, payload) {
    const queue = getOfflineQueue();
    queue.push({
      clientOpId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      queuedAt: new Date().toISOString(),
    });
    saveOfflineQueue(queue);
  }

  function updateConnectionUI() {
    const badge = document.getElementById('connection-status');
    const btnSync = document.getElementById('btn-sync-now');
    const countSpan = document.getElementById('pending-ops-count');
    const queue = getOfflineQueue();
    const isOnline = navigator.onLine;

    if (countSpan) {
      countSpan.textContent = String(queue.length);
    }

    if (!isOnline) {
      badge.textContent = `Sin internet · Guardado en dispositivo (${queue.length} pend.)`;
      badge.classList.add('offline');
    } else if (queue.length > 0) {
      badge.textContent = `En línea · ${queue.length} cambio(s) por sincronizar`;
      badge.classList.add('offline');
    } else {
      badge.textContent = 'En línea · Sincronizado';
      badge.classList.remove('offline');
    }

    if (btnSync) {
      if (queue.length > 0) {
        btnSync.classList.remove('hidden');
      } else {
        btnSync.classList.add('hidden');
      }
    }
  }

  async function apiFetch(path, options = {}) {
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      options.headers || {}
    );
    if (state.token) {
      headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch(path, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(
        (data.error && data.error.message) || 'Error en la comunicación con el servidor.'
      );
      err.code = data.error && data.error.code;
      err.details = data.error && data.error.details;
      err.status = response.status;
      throw err;
    }
    return data;
  }

  function getMonthBounds(monthValue) {
    const [y, m] = (monthValue || '2026-11').split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const mm = String(m).padStart(2, '0');
    return {
      from: `${y}-${mm}-01`,
      to: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
      year: y,
    };
  }

  // =========================================================
  // RENDERIZADO SEGURO DE DOM (SIN XSS / SIN INNERHTML CON DATOS DE USUARIO)
  // =========================================================
  function populatePostsSelects() {
    const selectIds = ['shift-post', 'pat-post'];
    for (const id of selectIds) {
      const sel = document.getElementById(id);
      if (!sel) continue;
      const currentVal = sel.value;
      sel.textContent = '';
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = '-- Seleccionar puesto --';
      sel.appendChild(defaultOpt);

      for (const p of state.posts) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.location ? `${p.name} (${p.location})` : p.name;
        sel.appendChild(opt);
      }
      if (currentVal) {
        sel.value = currentVal;
      } else if (state.posts.length > 0) {
        sel.value = state.posts[0].id;
      }
    }
  }

  function renderShiftsAndSummary() {
    if (state.summary) {
      const p = state.summary.periodo;
      const g = state.summary.acumuladoGlobal;

      document.getElementById('kpi-dias-trabajados').textContent = String(p.totalDiasTrabajados);
      document.getElementById('kpi-detalle-turnos').textContent =
        `${p.diasDiurnos} Diurnos · ${p.diasNocturnos} Nocturnos · ${p.diasRelevo} Relevos`;

      document.getElementById('kpi-descansos-reg').textContent = String(p.descansosReglamentarios);
      document.getElementById('kpi-horas-totales').textContent =
        `${p.totalHorasTrabajadas} horas laboradas en el mes`;

      document.getElementById('kpi-festivos-laborados').textContent = String(
        p.festivosODominicalesLaborados
      );
      document.getElementById('kpi-horas-festivas').textContent =
        `${p.horasFestivas} horas en domingo o festivo`;

      document.getElementById('kpi-saldo-compensatorios').textContent = String(
        g.saldoCompensatoriosPendientes
      );
      document.getElementById('kpi-detalle-compensatorios').textContent =
        `${g.compensatoriosGenerados} generados vs ${g.compensatoriosDisfrutados} disfrutados`;

      const fatigueBanner = document.getElementById('fatigue-alert-banner');
      if (p.alertaFatiga) {
        fatigueBanner.classList.remove('hidden');
      } else {
        fatigueBanner.classList.add('hidden');
      }
    }

    const tbody = document.getElementById('shifts-tbody');
    const emptyState = document.getElementById('shifts-empty-state');
    const tableContainer = document.getElementById('shifts-table-container');

    tbody.textContent = '';

    if (!state.shifts || state.shifts.length === 0) {
      emptyState.classList.remove('hidden');
      tableContainer.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tableContainer.classList.remove('hidden');

    for (const s of state.shifts) {
      const tr = document.createElement('tr');

      // Columna 1: Fecha y festivo
      const tdDate = document.createElement('td');
      tdDate.setAttribute('data-label', 'Fecha');
      const dateStrong = document.createElement('strong');
      dateStrong.textContent = s.shiftDate;
      tdDate.appendChild(dateStrong);
      if (s.isHolidayOrSunday) {
        const festBadge = document.createElement('span');
        festBadge.className = 'badge badge-festivo';
        festBadge.style.marginLeft = '6px';
        festBadge.textContent = s.holidayName || 'Dom/Festivo';
        tdDate.appendChild(festBadge);
      }
      tr.appendChild(tdDate);

      // Columna 2: Tipo de Jornada
      const tdType = document.createElement('td');
      tdType.setAttribute('data-label', 'Jornada');
      const typeBadge = document.createElement('span');
      typeBadge.className = `badge badge-${s.shiftType}`;
      typeBadge.textContent = SHIFT_LABELS[s.shiftType] || s.shiftType;
      tdType.appendChild(typeBadge);
      tr.appendChild(tdType);

      // Columna 3: Horario y horas
      const tdHours = document.createElement('td');
      tdHours.setAttribute('data-label', 'Horario y Horas');
      tdHours.textContent =
        s.hoursWorked > 0
          ? `${s.startTime} a ${s.endTime} (${s.hoursWorked}h)`
          : 'Día libre (0h)';
      tr.appendChild(tdHours);

      // Columna 4: Puesto y relevo
      const tdPost = document.createElement('td');
      tdPost.setAttribute('data-label', 'Puesto y Relevo');
      const postText = s.postName || 'Sin puesto';
      const reliefText = s.reliefGuardName ? ` · Relevo: ${s.reliefGuardName}` : '';
      tdPost.textContent = s.hoursWorked > 0 ? `${postText}${reliefText}` : '—';
      tr.appendChild(tdPost);

      // Columna 5: Compensatorio y Minuta
      const tdNotes = document.createElement('td');
      tdNotes.setAttribute('data-label', 'Compensatorio / Minuta');
      if (s.generatesCompensatory) {
        const compTag = document.createElement('span');
        compTag.className = 'badge badge-descanso_compensatorio';
        compTag.style.marginRight = '6px';
        compTag.textContent = '+1 Compensatorio';
        tdNotes.appendChild(compTag);
      }
      const noteSpan = document.createElement('span');
      noteSpan.textContent = s.notes || 'Sin novedad';
      tdNotes.appendChild(noteSpan);
      tr.appendChild(tdNotes);

      // Columna 6: Acciones (Editar / Eliminar)
      const tdActions = document.createElement('td');
      tdActions.setAttribute('data-label', 'Acciones');
      const actionWrap = document.createElement('div');
      actionWrap.style.display = 'inline-flex';
      actionWrap.style.gap = '6px';

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn btn-secondary btn-sm';
      btnEdit.textContent = 'Editar';
      btnEdit.setAttribute('aria-label', `Editar turno del ${s.shiftDate}`);
      btnEdit.addEventListener('click', () => loadShiftIntoForm(s));

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'btn btn-danger btn-sm';
      btnDel.textContent = 'Borrar';
      btnDel.setAttribute('aria-label', `Borrar turno del ${s.shiftDate}`);
      btnDel.addEventListener('click', () => handleDeleteShift(s.shiftDate));

      actionWrap.appendChild(btnEdit);
      actionWrap.appendChild(btnDel);
      tdActions.appendChild(actionWrap);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  }

  function loadShiftIntoForm(shift) {
    document.getElementById('shift-date').value = shift.shiftDate;
    document.getElementById('shift-type').value = shift.shiftType;
    document.getElementById('shift-start').value = shift.startTime;
    document.getElementById('shift-end').value = shift.endTime;
    document.getElementById('shift-hours').value = String(shift.hoursWorked);
    document.getElementById('shift-post').value = shift.postId || '';
    document.getElementById('shift-relief').value = shift.reliefGuardName || '';
    document.getElementById('shift-notes').value = shift.notes || '';
    document.getElementById('shift-generates-comp').checked = Boolean(shift.generatesCompensatory);
    document.getElementById('shift-expected-version').value = String(shift.version || 1);
    document.getElementById('quick-date-label').textContent = shift.shiftDate;
    updateHolidayHintForSelectedDate();
    document.getElementById('shift-type').focus();
    announce(`Turno del ${shift.shiftDate} cargado en el formulario para edición.`, 'info');
  }

  function renderVacations() {
    if (!state.vacations) return;
    const { resumen, historial } = state.vacations;

    document.getElementById('vac-kpi-ingreso').textContent = resumen.fechaIngreso;
    document.getElementById('vac-kpi-anios').textContent =
      `${resumen.periodosCompletosCausados} periodos anuales cumplidos (${resumen.diasPorAnio} días/año)`;

    document.getElementById('vac-kpi-causados').textContent = String(resumen.diasCausadosCompletos);
    document.getElementById('vac-kpi-proporcional').textContent =
      `+${resumen.diasProporcionalesAnioEnCurso} días proporcionales del año en curso`;

    document.getElementById('vac-kpi-disfrutados').textContent = String(resumen.diasDisfrutados);
    document.getElementById('vac-kpi-programados').textContent =
      `${resumen.diasProgramados} días programados próximamente`;

    document.getElementById('vac-kpi-pendientes').textContent = String(
      resumen.saldoPendientePeriodosCumplidos
    );
    document.getElementById('vac-kpi-disponible-total').textContent =
      `${resumen.saldoDisponibleTotal} días incluyendo proporcional actual`;

    const accumAlert = document.getElementById('vacation-accumulation-alert');
    if (resumen.alertaAcumulacion) {
      accumAlert.classList.remove('hidden');
    } else {
      accumAlert.classList.add('hidden');
    }

    // Tabla de periodos causados
    const periodsTbody = document.getElementById('vacation-periods-tbody');
    periodsTbody.textContent = '';
    for (const p of resumen.periodosDetalle) {
      const tr = document.createElement('tr');

      const tdPer = document.createElement('td');
      tdPer.setAttribute('data-label', 'Periodo Anual');
      const strong = document.createElement('strong');
      strong.textContent = p.periodo;
      tdPer.appendChild(strong);
      tr.appendChild(tdPer);

      const tdDates = document.createElement('td');
      tdDates.setAttribute('data-label', 'Fechas del Periodo');
      tdDates.textContent = `${p.fechaInicioPeriodo} al ${p.fechaFinPeriodo}`;
      tr.appendChild(tdDates);

      const tdCausados = document.createElement('td');
      tdCausados.setAttribute('data-label', 'Días Causados');
      tdCausados.textContent = `${p.diasCausados} días hábiles`;
      tr.appendChild(tdCausados);

      const tdDisf = document.createElement('td');
      tdDisf.setAttribute('data-label', 'Días Disfrutados');
      tdDisf.textContent = `${p.diasDisfrutados} días`;
      tr.appendChild(tdDisf);

      const tdPend = document.createElement('td');
      tdPend.setAttribute('data-label', 'Días Pendientes');
      const pendStrong = document.createElement('strong');
      pendStrong.textContent = `${p.diasPendientes} días`;
      tdPend.appendChild(pendStrong);
      tr.appendChild(tdPend);

      const tdEst = document.createElement('td');
      tdEst.setAttribute('data-label', 'Estado');
      const badge = document.createElement('span');
      if (p.estadoPeriodo === 'completo') {
        badge.className = 'badge badge-descanso_reglamentario';
        badge.textContent = 'Disfrutado completo';
      } else if (p.estadoPeriodo === 'parcial') {
        badge.className = 'badge badge-diurno';
        badge.textContent = `Parcial (${p.diasPendientes} pend.)`;
      } else {
        badge.className = 'badge badge-nocturno';
        badge.textContent = 'Pendiente por disfrutar';
      }
      tdEst.appendChild(badge);
      tr.appendChild(tdEst);

      periodsTbody.appendChild(tr);
    }

    // Historial de vacaciones tomadas
    const histTbody = document.getElementById('vacations-history-tbody');
    const emptyState = document.getElementById('vacations-empty-state');
    const tableWrap = document.getElementById('vacations-table-container');
    histTbody.textContent = '';

    if (!historial || historial.length === 0) {
      emptyState.classList.remove('hidden');
      tableWrap.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tableWrap.classList.remove('hidden');

    for (const rec of historial) {
      const tr = document.createElement('tr');

      const tdPer = document.createElement('td');
      tdPer.setAttribute('data-label', 'Periodo');
      tdPer.textContent = rec.periodLabel;
      tr.appendChild(tdPer);

      const tdStart = document.createElement('td');
      tdStart.setAttribute('data-label', 'Desde');
      tdStart.textContent = rec.startDate;
      tr.appendChild(tdStart);

      const tdEnd = document.createElement('td');
      tdEnd.setAttribute('data-label', 'Hasta');
      tdEnd.textContent = rec.endDate;
      tr.appendChild(tdEnd);

      const tdDays = document.createElement('td');
      tdDays.setAttribute('data-label', 'Días Hábiles');
      const strongDays = document.createElement('strong');
      strongDays.textContent = `${rec.businessDays} días`;
      tdDays.appendChild(strongDays);
      tr.appendChild(tdDays);

      const tdStatus = document.createElement('td');
      tdStatus.setAttribute('data-label', 'Estado');
      tdStatus.textContent = VAC_STATUS_LABELS[rec.status] || rec.status;
      tr.appendChild(tdStatus);

      const tdNotes = document.createElement('td');
      tdNotes.setAttribute('data-label', 'Observaciones');
      tdNotes.textContent = rec.notes || '—';
      tr.appendChild(tdNotes);

      const tdAct = document.createElement('td');
      tdAct.setAttribute('data-label', 'Acciones');
      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'btn btn-danger btn-sm';
      btnDel.textContent = 'Eliminar';
      btnDel.setAttribute('aria-label', `Eliminar registro de vacaciones del periodo ${rec.periodLabel}`);
      btnDel.addEventListener('click', () => handleDeleteVacation(rec.id));
      tdAct.appendChild(btnDel);
      tr.appendChild(tdAct);

      histTbody.appendChild(tr);
    }
  }

  function renderBackupsList() {
    const listEl = document.getElementById('backups-list');
    const emptyEl = document.getElementById('backups-empty-state');
    listEl.textContent = '';

    if (!state.backups || state.backups.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    for (const b of state.backups) {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.flexWrap = 'wrap';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.gap = '10px';
      li.style.padding = '12px';
      li.style.background = '#f8fafc';
      li.style.border = '1px solid #cbd5e1';
      li.style.borderRadius = '8px';

      const info = document.createElement('span');
      info.textContent = `${b.filename} (${Math.round(b.sizeBytes / 1024)} KB · ${b.updatedAt.slice(0, 19).replace('T', ' ')})`;

      const btnRestore = document.createElement('button');
      btnRestore.type = 'button';
      btnRestore.className = 'btn btn-secondary btn-sm';
      btnRestore.textContent = 'Restaurar esta copia';
      btnRestore.addEventListener('click', () => handleRestoreBackup(b.filename));

      li.appendChild(info);
      li.appendChild(btnRestore);
      listEl.appendChild(li);
    }
  }

  function renderTickets() {
    const tbody = document.getElementById('tickets-tbody');
    const emptyEl = document.getElementById('tickets-empty-state');
    tbody.textContent = '';

    if (!state.tickets || state.tickets.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    for (const t of state.tickets) {
      const tr = document.createElement('tr');

      const tdCat = document.createElement('td');
      tdCat.setAttribute('data-label', 'Categoría');
      tdCat.textContent = TICKET_CATEGORY_LABELS[t.category] || t.category;
      tr.appendChild(tdCat);

      const tdSub = document.createElement('td');
      tdSub.setAttribute('data-label', 'Asunto y Detalle');
      const strong = document.createElement('strong');
      strong.textContent = t.subject;
      const p = document.createElement('div');
      p.style.fontSize = '0.85rem';
      p.style.color = '#334155';
      p.textContent = t.description;
      tdSub.appendChild(strong);
      tdSub.appendChild(p);
      tr.appendChild(tdSub);

      const tdOwner = document.createElement('td');
      tdOwner.setAttribute('data-label', 'Responsable');
      tdOwner.textContent = t.owner;
      tr.appendChild(tdOwner);

      const tdStatus = document.createElement('td');
      tdStatus.setAttribute('data-label', 'Estado');
      const badge = document.createElement('span');
      badge.className = 'badge badge-nocturno';
      badge.textContent = t.status.toUpperCase();
      tdStatus.appendChild(badge);
      tr.appendChild(tdStatus);

      const tdDate = document.createElement('td');
      tdDate.setAttribute('data-label', 'Fecha');
      tdDate.textContent = t.createdAt.slice(0, 10);
      tr.appendChild(tdDate);

      tbody.appendChild(tr);
    }
  }

  function populateUserProfileForm() {
    if (!state.user) return;
    document.getElementById('prof-name').value = state.user.fullName || '';
    document.getElementById('prof-hire-date').value = state.user.hireDate || '2022-03-01';
    document.getElementById('prof-vac-days').value = String(state.user.vacationDaysPerYear || 15);
    document.getElementById('prof-pattern').value = state.user.preferredPattern || '2x2x2';
    document.getElementById('prof-notifications').checked = Boolean(state.user.notificationsEnabled);
    document.getElementById('current-user-label').textContent = `👮 ${state.user.fullName}`;
    document.getElementById('user-session-bar').classList.remove('hidden');
  }

  // =========================================================
  // CARGA DE DATOS DESDE SERVIDOR O CACHÉ LOCAL
  // =========================================================
  async function loadAllData() {
    const monthVal = document.getElementById('filter-month').value || '2026-11';
    const { from, to, year } = getMonthBounds(monthVal);

    try {
      const [meRes, postsRes, festivosRes, shiftsRes, vacRes, backupsRes, ticketsRes] =
        await Promise.all([
          apiFetch('/api/auth/me'),
          apiFetch('/api/puestos'),
          apiFetch(`/api/festivos?year=${year}`),
          apiFetch(`/api/turnos?from=${from}&to=${to}`),
          apiFetch('/api/vacaciones'),
          apiFetch('/api/backups'),
          apiFetch('/api/soporte/tickets'),
        ]);

      state.user = meRes.user;
      state.posts = postsRes.posts || [];
      state.shifts = shiftsRes.shifts || [];
      state.summary = shiftsRes.summary || null;
      state.vacations = vacRes;
      state.backups = backupsRes.backups || [];
      state.tickets = ticketsRes.tickets || [];

      state.festivosMap.clear();
      for (const f of festivosRes.festivos || []) {
        state.festivosMap.set(f.date, f.name);
      }

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
      localStorage.setItem(
        STORAGE_KEYS.CACHE_SHIFTS,
        JSON.stringify({ shifts: state.shifts, summary: state.summary })
      );
      localStorage.setItem(STORAGE_KEYS.CACHE_VACATIONS, JSON.stringify(state.vacations));
    } catch (err) {
      if (err.status === 401) {
        showLoginView();
        return;
      }
      // Si estamos offline, hidratar desde caché local
      const cachedShifts = localStorage.getItem(STORAGE_KEYS.CACHE_SHIFTS);
      const cachedVac = localStorage.getItem(STORAGE_KEYS.CACHE_VACATIONS);
      const cachedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (cachedUser) state.user = JSON.parse(cachedUser);
      if (cachedShifts) {
        const parsed = JSON.parse(cachedShifts);
        state.shifts = parsed.shifts || [];
        state.summary = parsed.summary || null;
      }
      if (cachedVac) {
        state.vacations = JSON.parse(cachedVac);
      }
      announce('Modo sin conexión activo: mostrando datos guardados en el dispositivo.', 'warning');
    }

    populateUserProfileForm();
    populatePostsSelects();
    renderShiftsAndSummary();
    renderVacations();
    renderBackupsList();
    renderTickets();
    updateHolidayHintForSelectedDate();
  }

  function showLoginView() {
    state.token = null;
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    document.getElementById('user-session-bar').classList.add('hidden');
    document.getElementById('main-nav').classList.add('hidden');
    for (const sec of document.querySelectorAll('main > section')) {
      sec.classList.add('hidden');
    }
    document.getElementById('view-login').classList.remove('hidden');
  }

  function showAuthenticatedApp() {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    switchTab('view-turnos');
  }

  function switchTab(targetId) {
    const sections = ['view-turnos', 'view-vacaciones', 'view-respaldo', 'view-soporte'];
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        if (id === targetId) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    }
    for (const btn of document.querySelectorAll('.nav-btn')) {
      if (btn.getAttribute('data-tab') === targetId) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    }
  }

  // =========================================================
  // VALIDACIÓN ACCESIBLE DE FORMULARIOS Y ACCIONES
  // =========================================================
  function setFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errEl = document.getElementById(errorId);
    if (input) {
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    if (errEl) {
      errEl.textContent = message || '';
    }
  }

  function updateHolidayHintForSelectedDate() {
    const dateVal = document.getElementById('shift-date').value;
    const hintEl = document.getElementById('shift-date-holiday-hint');
    const compCheckbox = document.getElementById('shift-generates-comp');
    const shiftType = document.getElementById('shift-type').value;
    document.getElementById('quick-date-label').textContent = dateVal || 'Hoy';

    if (!dateVal || !/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      hintEl.textContent = '';
      return;
    }

    const [y, m, d] = dateVal.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const isSunday = dt.getUTCDay() === 0;
    const holidayName = state.festivosMap.get(dateVal);
    const esLaborado = ['diurno', 'nocturno', 'relevo'].includes(shiftType);

    // Verificar si ya existe turno en esa fecha para pre-cargar su versión
    const existing = state.shifts.find((s) => s.shiftDate === dateVal);
    const verInput = document.getElementById('shift-expected-version');
    if (existing) {
      verInput.value = String(existing.version);
    } else {
      verInput.value = '';
    }

    if (holidayName) {
      hintEl.textContent = `🎉 Día Festivo en Colombia (${holidayName}). Si trabajas hoy, genera compensatorio.`;
      if (!existing) compCheckbox.checked = esLaborado;
    } else if (isSunday) {
      hintEl.textContent = '📅 Domingo dominical. Si trabajas hoy, genera compensatorio.';
      if (!existing) compCheckbox.checked = esLaborado;
    } else {
      hintEl.textContent = 'Día ordinario de lunes a sábado.';
      if (!existing) compCheckbox.checked = false;
    }
  }

  async function saveShiftPayload(payload) {
    const monthVal = document.getElementById('filter-month').value || '2026-11';
    const { from, to } = getMonthBounds(monthVal);

    try {
      const res = await apiFetch('/api/turnos', {
        method: 'POST',
        body: JSON.stringify({ ...payload, fromDate: from, toDate: to }),
      });
      await loadAllData();
      announce(`Turno del ${res.shift.shiftDate} guardado correctamente.`, 'success');
    } catch (err) {
      if (err.code === 'SYNC_CONFLICT' && err.details) {
        openConflictDialog(err.details.serverRecord, payload);
        return;
      }
      if (!navigator.onLine || err.message.includes('Failed to fetch')) {
        enqueueOfflineOperation('UPSERT_SHIFT', payload);
        // Actualización optimista local sin perder datos del formulario
        const idx = state.shifts.findIndex((s) => s.shiftDate === payload.shiftDate);
        const optimistic = {
          id: `local-${Date.now()}`,
          shiftDate: payload.shiftDate,
          shiftType: payload.shiftType,
          startTime: payload.startTime || '06:00',
          endTime: payload.endTime || '18:00',
          hoursWorked: Number(payload.hoursWorked ?? 12),
          postId: payload.postId || null,
          postName: 'Guardado en teléfono (pendiente sync)',
          reliefGuardName: payload.reliefGuardName || '',
          isHolidayOrSunday: false,
          generatesCompensatory: Boolean(payload.generatesCompensatory),
          notes: payload.notes || '',
          version: 1,
        };
        if (idx >= 0) {
          state.shifts[idx] = optimistic;
        } else {
          state.shifts.push(optimistic);
          state.shifts.sort((a, b) => a.shiftDate.localeCompare(b.shiftDate));
        }
        renderShiftsAndSummary();
        announce(
          `Sin conexión: el turno del ${payload.shiftDate} se guardó en el teléfono y se sincronizará al volver la red.`,
          'warning'
        );
        return;
      }
      announce(err.message, 'error');
    }
  }

  async function handleDeleteShift(shiftDate) {
    try {
      await apiFetch(`/api/turnos/${encodeURIComponent(shiftDate)}`, { method: 'DELETE' });
      await loadAllData();
      announce(`Turno del ${shiftDate} eliminado.`, 'info');
    } catch (err) {
      announce(err.message, 'error');
    }
  }

  async function handleDeleteVacation(recordId) {
    try {
      await apiFetch(`/api/vacaciones/${encodeURIComponent(recordId)}`, { method: 'DELETE' });
      await loadAllData();
      announce('Registro de vacaciones eliminado y saldo actualizado.', 'info');
    } catch (err) {
      announce(err.message, 'error');
    }
  }

  async function handleRestoreBackup(filename) {
    try {
      const res = await apiFetch('/api/backups/restore', {
        method: 'POST',
        body: JSON.stringify({ filename }),
      });
      await loadAllData();
      announce(
        `Copia restaurada con éxito (${res.counts.shifts} turnos y ${res.counts.vacations} periodos de vacaciones recuperados).`,
        'success'
      );
    } catch (err) {
      announce(err.message, 'error');
    }
  }

  // =========================================================
  // MODALES CON GESTIÓN DE FOCO ACCESIBLE (<dialog>)
  // =========================================================
  function openPatternModal(triggerElement) {
    state.lastModalTrigger = triggerElement || document.activeElement;
    const dialog = document.getElementById('dialog-pattern');
    const monthVal = document.getElementById('filter-month').value || '2026-11';
    document.getElementById('pat-start-date').value = `${monthVal}-01`;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', 'open');
    }
    document.getElementById('pat-type').focus();
  }

  function closePatternModal() {
    const dialog = document.getElementById('dialog-pattern');
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    if (state.lastModalTrigger && typeof state.lastModalTrigger.focus === 'function') {
      state.lastModalTrigger.focus();
    }
  }

  function openConflictDialog(serverRecord, clientPayload) {
    state.lastModalTrigger = document.activeElement;
    state.pendingConflict = { serverRecord, clientPayload };
    const dialog = document.getElementById('dialog-conflict');
    const comp = document.getElementById('conflict-comparison');
    comp.textContent =
      `Fecha ${clientPayload.shiftDate}: En el servidor figura "${SHIFT_LABELS[serverRecord.shiftType] || serverRecord.shiftType}" (v${serverRecord.version}, nota: "${serverRecord.notes || 'ninguna'}"), ` +
      `mientras que tu cambio intenta guardar "${SHIFT_LABELS[clientPayload.shiftType] || clientPayload.shiftType}" (nota: "${clientPayload.notes || 'ninguna'}").`;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', 'open');
    }
    document.getElementById('btn-conflict-keep-server').focus();
  }

  function closeConflictDialog() {
    const dialog = document.getElementById('dialog-conflict');
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    if (state.lastModalTrigger && typeof state.lastModalTrigger.focus === 'function') {
      state.lastModalTrigger.focus();
    }
  }

  // =========================================================
  // SINCRONIZACIÓN DE COLA OFFLINE
  // =========================================================
  async function syncPendingOfflineQueue() {
    const queue = getOfflineQueue();
    if (queue.length === 0 || !navigator.onLine) return;

    try {
      const res = await apiFetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify({ operations: queue }),
      });
      saveOfflineQueue([]);
      await loadAllData();

      if (res.conflictCount > 0 && res.conflicts[0] && res.conflicts[0].details) {
        openConflictDialog(
          res.conflicts[0].details.serverRecord,
          res.conflicts[0].details.clientPayload
        );
      } else {
        announce(
          `Sincronización completada: ${res.appliedCount} operación(es) aplicadas correctamente.`,
          'success'
        );
      }
    } catch (err) {
      announce(`No se pudo sincronizar aún: ${err.message}`, 'warning');
    }
  }

  // =========================================================
  // INICIALIZACIÓN Y EVENTOS DE INTERFAZ
  // =========================================================
  async function init() {
    const todayISO = '2026-11-09';
    document.getElementById('shift-date').value = todayISO;
    document.getElementById('quick-date-label').textContent = todayISO;

    window.addEventListener('online', () => {
      updateConnectionUI();
      syncPendingOfflineQueue();
    });
    window.addEventListener('offline', () => {
      updateConnectionUI();
    });
    updateConnectionUI();

    // Navegación entre pestañas
    for (const btn of document.querySelectorAll('.nav-btn')) {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        switchTab(target);
      });
    }

    // Cambio de mes en filtro de turnos
    document.getElementById('filter-month').addEventListener('change', () => {
      loadAllData();
    });

    // Cambio de fecha o tipo de turno actualiza horas sugeridas y aviso de festivo
    document.getElementById('shift-date').addEventListener('change', () => {
      setFieldError('shift-date', 'err-shift-date', '');
      updateHolidayHintForSelectedDate();
    });

    document.getElementById('shift-type').addEventListener('change', (e) => {
      const val = e.target.value;
      const startInput = document.getElementById('shift-start');
      const endInput = document.getElementById('shift-end');
      const hoursInput = document.getElementById('shift-hours');
      if (val === 'diurno' || val === 'relevo') {
        startInput.value = '06:00';
        endInput.value = '18:00';
        hoursInput.value = '12';
      } else if (val === 'nocturno') {
        startInput.value = '18:00';
        endInput.value = '06:00';
        hoursInput.value = '12';
      } else {
        startInput.value = '00:00';
        endInput.value = '00:00';
        hoursInput.value = '0';
      }
      updateHolidayHintForSelectedDate();
    });

    // Botones de marcación rápida de 1 toque
    for (const qBtn of document.querySelectorAll('.quick-shift-btn')) {
      qBtn.addEventListener('click', () => {
        const quickType = qBtn.getAttribute('data-quick-type');
        const dateVal = document.getElementById('shift-date').value || todayISO;
        document.getElementById('shift-type').value = quickType;
        document.getElementById('shift-type').dispatchEvent(new Event('change'));

        const payload = {
          shiftDate: dateVal,
          shiftType: quickType,
          startTime: document.getElementById('shift-start').value,
          endTime: document.getElementById('shift-end').value,
          hoursWorked: Number(document.getElementById('shift-hours').value),
          postId: document.getElementById('shift-post').value || null,
          reliefGuardName: document.getElementById('shift-relief').value,
          notes: document.getElementById('shift-notes').value,
        };
        saveShiftPayload(payload);
      });
    }

    // Envío del formulario de turno diario
    document.getElementById('form-shift').addEventListener('submit', (e) => {
      e.preventDefault();
      const shiftDate = document.getElementById('shift-date').value.trim();
      const hoursWorked = Number(document.getElementById('shift-hours').value);

      if (!shiftDate) {
        setFieldError('shift-date', 'err-shift-date', 'Seleccione la fecha del turno.');
        document.getElementById('shift-date').focus();
        return;
      }
      if (Number.isNaN(hoursWorked) || hoursWorked < 0 || hoursWorked > 24) {
        setFieldError(
          'shift-hours',
          'err-shift-hours',
          'Ingrese un número de horas válido entre 0 y 24.'
        );
        document.getElementById('shift-hours').focus();
        return;
      }

      const expectedVer = document.getElementById('shift-expected-version').value;
      const payload = {
        shiftDate,
        shiftType: document.getElementById('shift-type').value,
        startTime: document.getElementById('shift-start').value,
        endTime: document.getElementById('shift-end').value,
        hoursWorked,
        postId: document.getElementById('shift-post').value || null,
        reliefGuardName: document.getElementById('shift-relief').value.trim(),
        notes: document.getElementById('shift-notes').value.trim(),
        generatesCompensatory: document.getElementById('shift-generates-comp').checked,
        expectedVersion: expectedVer ? Number(expectedVer) : undefined,
      };
      saveShiftPayload(payload);
    });

    document.getElementById('btn-reset-shift-form').addEventListener('click', () => {
      document.getElementById('shift-relief').value = '';
      document.getElementById('shift-notes').value = '';
      document.getElementById('shift-expected-version').value = '';
      setFieldError('shift-date', 'err-shift-date', '');
      setFieldError('shift-hours', 'err-shift-hours', '');
    });

    // Modal generador de ciclo 2x2x2 / 6x1
    document.getElementById('btn-open-pattern-modal').addEventListener('click', (e) => {
      openPatternModal(e.currentTarget);
    });
    document.getElementById('btn-empty-generate-pattern').addEventListener('click', (e) => {
      openPatternModal(e.currentTarget);
    });
    document.getElementById('btn-close-pattern-modal').addEventListener('click', () => {
      closePatternModal();
    });

    document.getElementById('form-pattern-generator').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        startDate: document.getElementById('pat-start-date').value,
        days: Number(document.getElementById('pat-days').value || 18),
        pattern: document.getElementById('pat-type').value,
        offsetDiaCiclo: Number(document.getElementById('pat-offset').value || 0),
        postId: document.getElementById('pat-post').value || null,
        reliefGuardName: document.getElementById('pat-relief').value.trim(),
        overwriteExisting: true,
      };

      try {
        const res = await apiFetch('/api/turnos/patron', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        closePatternModal();
        await loadAllData();
        announce(`Se generaron ${res.count} días de programación con el patrón ${payload.pattern}.`, 'success');
      } catch (err) {
        announce(err.message, 'error');
      }
    });

    // Resolución de conflictos de edición concurrente
    document.getElementById('btn-conflict-keep-server').addEventListener('click', async () => {
      closeConflictDialog();
      await loadAllData();
      announce('Se conservó la versión guardada en el servidor.', 'info');
    });

    document.getElementById('btn-conflict-force-client').addEventListener('click', async () => {
      if (!state.pendingConflict) return;
      const { clientPayload } = state.pendingConflict;
      delete clientPayload.expectedVersion;
      closeConflictDialog();
      await saveShiftPayload(clientPayload);
    });

    // Formulario de vacaciones
    document.getElementById('form-vacation').addEventListener('submit', async (e) => {
      e.preventDefault();
      const periodLabel = document.getElementById('vac-period').value.trim();
      const startDate = document.getElementById('vac-start').value.trim();
      const endDate = document.getElementById('vac-end').value.trim();
      const businessDaysRaw = document.getElementById('vac-days').value.trim();

      setFieldError('vac-period', 'err-vac-period', '');
      setFieldError('vac-start', 'err-vac-start', '');
      setFieldError('vac-end', 'err-vac-end', '');

      if (periodLabel.length < 4) {
        setFieldError('vac-period', 'err-vac-period', 'Indique el periodo anual (ej. 2024-2025).');
        document.getElementById('vac-period').focus();
        return;
      }
      if (!startDate) {
        setFieldError('vac-start', 'err-vac-start', 'Seleccione la fecha de inicio de vacaciones.');
        document.getElementById('vac-start').focus();
        return;
      }
      if (!endDate || endDate < startDate) {
        setFieldError(
          'vac-end',
          'err-vac-end',
          'La fecha final debe ser igual o posterior a la fecha de inicio.'
        );
        document.getElementById('vac-end').focus();
        return;
      }

      const payload = {
        periodLabel,
        startDate,
        endDate,
        businessDays: businessDaysRaw ? Number(businessDaysRaw) : undefined,
        status: document.getElementById('vac-status').value,
        notes: document.getElementById('vac-notes').value.trim(),
        markOnCalendar: document.getElementById('vac-mark-calendar').checked,
      };

      try {
        await apiFetch('/api/vacaciones', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        document.getElementById('vac-notes').value = '';
        await loadAllData();
        announce('Periodo de vacaciones registrado y saldo actualizado.', 'success');
      } catch (err) {
        if (!navigator.onLine) {
          enqueueOfflineOperation('CREATE_VACATION', payload);
          announce('Vacaciones guardadas en la cola sin conexión.', 'warning');
          return;
        }
        announce(err.message, 'error');
      }
    });

    document.getElementById('btn-focus-vacation-form').addEventListener('click', () => {
      document.getElementById('vac-start').focus();
    });

    // Formulario de perfil laboral
    document.getElementById('form-profile').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        fullName: document.getElementById('prof-name').value.trim(),
        hireDate: document.getElementById('prof-hire-date').value.trim(),
        vacationDaysPerYear: Number(document.getElementById('prof-vac-days').value || 15),
        preferredPattern: document.getElementById('prof-pattern').value,
        notificationsEnabled: document.getElementById('prof-notifications').checked,
      };

      try {
        await apiFetch('/api/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        await loadAllData();
        announce('Configuración laboral y cálculo de vacaciones actualizados.', 'success');
      } catch (err) {
        announce(err.message, 'error');
      }
    });

    // Permiso contextual de notificaciones
    document.getElementById('btn-request-browser-notif').addEventListener('click', async () => {
      if (!('Notification' in window)) {
        announce('Este navegador no soporta notificaciones del sistema.', 'warning');
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        announce('Notificaciones activadas para recordatorios de turno y descansos.', 'success');
      } else {
        announce('Permiso de notificaciones no concedido; puedes cambiarlo cuando quieras.', 'info');
      }
    });

    // Crear nuevo puesto
    document.getElementById('form-new-post').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-post-name').value.trim();
      const location = document.getElementById('new-post-location').value.trim();
      if (!name) return;

      try {
        await apiFetch('/api/puestos', {
          method: 'POST',
          body: JSON.stringify({ name, location }),
        });
        document.getElementById('new-post-name').value = '';
        document.getElementById('new-post-location').value = '';
        await loadAllData();
        announce(`Puesto "${name}" agregado a tu lista.`, 'success');
      } catch (err) {
        announce(err.message, 'error');
      }
    });

    // Crear y descargar copia de seguridad cifrada
    const triggerBackup = async () => {
      try {
        const res = await apiFetch('/api/backups/export', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        const blob = new Blob([JSON.stringify(res.envelope, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        await loadAllData();
        announce(`Copia de seguridad cifrada (${res.filename}) creada y descargada.`, 'success');
      } catch (err) {
        announce(err.message, 'error');
      }
    };
    document.getElementById('btn-create-backup').addEventListener('click', triggerBackup);
    document.getElementById('btn-empty-backup').addEventListener('click', triggerBackup);

    // Enviar solicitud de soporte
    document.getElementById('form-ticket').addEventListener('submit', async (e) => {
      e.preventDefault();
      const category = document.getElementById('ticket-category').value;
      const subject = document.getElementById('ticket-subject').value.trim();
      const description = document.getElementById('ticket-desc').value.trim();
      const consentDiagnostico = document.getElementById('ticket-consent').checked;

      setFieldError('ticket-subject', 'err-ticket-subject', '');
      setFieldError('ticket-desc', 'err-ticket-desc', '');

      if (subject.length < 3) {
        setFieldError('ticket-subject', 'err-ticket-subject', 'Escriba un asunto de al menos 3 caracteres.');
        document.getElementById('ticket-subject').focus();
        return;
      }
      if (description.length < 5) {
        setFieldError('ticket-desc', 'err-ticket-desc', 'Describa la novedad con al menos 5 caracteres.');
        document.getElementById('ticket-desc').focus();
        return;
      }

      try {
        await apiFetch('/api/soporte/tickets', {
          method: 'POST',
          body: JSON.stringify({ category, subject, description, consentDiagnostico }),
        });
        document.getElementById('ticket-subject').value = '';
        document.getElementById('ticket-desc').value = '';
        await loadAllData();
        announce('Solicitud registrada con responsable asignado.', 'success');
      } catch (err) {
        announce(err.message, 'error');
      }
    });

    // Sincronizar manualmente
    document.getElementById('btn-sync-now').addEventListener('click', () => {
      syncPendingOfflineQueue();
    });

    // Login y Logout
    async function performLogin(username, pin) {
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, pin }),
        });
        state.token = res.token;
        state.user = res.user;
        localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
        showAuthenticatedApp();
        await loadAllData();
        announce(`Bienvenido, ${res.user.fullName}.`, 'success');
      } catch (err) {
        setFieldError('login-pin', 'err-login-pin', err.message);
        document.getElementById('login-pin').focus();
      }
    }

    document.getElementById('form-login').addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-pin').value.trim();
      performLogin(u, p);
    });

    document.getElementById('btn-quick-login-papa').addEventListener('click', () => {
      performLogin('papa', '1234');
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignorar si ya expiró
      }
      showLoginView();
    });

    // Si aún no hay sesión activa, iniciar automáticamente con la cuenta predeterminada de Papá
    // para que el guarda tenga acceso inmediato sin barreras técnicas al abrir la app
    if (!state.token) {
      await performLogin('papa', '1234');
    } else {
      showAuthenticatedApp();
      await loadAllData();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
