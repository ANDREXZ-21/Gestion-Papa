# 2. Historias de Usuario y Criterios de Aceptación

Todas las historias siguen el formato **"Como [rol] quiero [capacidad] para [beneficio]"** e incluyen criterios de aceptación ejecutables en formato **Dado / Cuando / Entonces**, contemplando casos límite, errores y permisos.

---

## HU-01: Registro de turno diario y detección de festivos/compensatorios

- **Historia:** Como **guarda de seguridad (`guarda`)**, quiero **registrar mi turno del día (Diurno 12h, Nocturno 12h, Relevo o Descanso) indicando el puesto y compañero de relevo**, para **llevar la cuenta exacta de mis días trabajados y saber si generé un descanso compensatorio por trabajar en domingo o festivo**.

### Criterios de Aceptación

1. **Camino feliz — Turno en domingo o festivo nacional:**
   - **Dado** que el guarda ha iniciado sesión y selecciona la fecha `2026-11-02` (Lunes festivo — Todos los Santos),
   - **Cuando** registra un turno `diurno` de `06:00` a `18:00` (`12` horas) en el puesto `Portería Principal`,
   - **Entonces** el sistema guarda el turno, lo marca automáticamente como festivo (`isHolidayOrSunday = true`), activa `generatesCompensatory = true` e incrementa en `+1` tanto los días trabajados del mes como el saldo de descansos compensatorios pendientes.
2. **Caso límite — Registro de día de descanso:**
   - **Dado** que el guarda selecciona una fecha de domingo o festivo pero elige el tipo `descanso_reglamentario` o `descanso_compensatorio`,
   - **Cuando** envía el formulario,
   - **Entonces** el sistema fuerza `hoursWorked = 0` y `generatesCompensatory = false`, y si es `descanso_compensatorio` descuenta `1` del saldo de compensatorios acumulados.
3. **Caso de error — Datos fuera de rango o fecha inválida:**
   - **Dado** que el guarda ingresa un número de horas mayor a `24` (ej. `30`) o una fecha con formato inválido,
   - **Cuando** intenta guardar el turno,
   - **Entonces** el servidor rechaza la petición con código `400` (`SHIFT_INVALID_HOURS` o `SHIFT_INVALID_DATE`), el formulario conserva los datos escritos y anuncia el mensaje de corrección en la región viva accesible.
4. **Caso de concurrencia — Edición simultánea:**
   - **Dado** que el turno de una fecha ya está en la versión `2` en el servidor,
   - **Cuando** un cliente intenta actualizarlo enviando `expectedVersion: 1`,
   - **Entonces** el servidor responde `409 Conflict` (`SYNC_CONFLICT`) devolviendo el registro actual del servidor para que el usuario elija cuál versión conservar sin perder cambios en silencio.

---

## HU-02: Generación rápida de programación por ciclo (`2x2x2`, `6x1`, `4x2`)

- **Historia:** Como **guarda de seguridad (`guarda`)**, quiero **generar automáticamente varios días de programación según mi ciclo rotativo (`2x2x2`, `4x2` o `6x1`)**, para **no tener que digitar día por día todo el mes**.

### Criterios de Aceptación

1. **Camino feliz — Aplicación de ciclo 2x2x2:**
   - **Dado** que el guarda abre el generador de ciclos y elige fecha inicial `2026-11-01`, `18` días y patrón `2x2x2`,
   - **Cuando** confirma la operación,
   - **Entonces** el sistema crea de forma transaccional `18` registros alternando `2` turnos diurnos (`06:00-18:00`), `2` nocturnos (`18:00-06:00`) y `2` descansos reglamentarios (`0h`), marcando automáticamente los domingos y festivos que caigan en días laborados.
2. **Caso límite — Rango de días fuera de límite:**
   - **Dado** que se solicita generar menos de `1` día o más de `90` días en una sola operación,
   - **Cuando** se envía la petición a `POST /api/turnos/patron`,
   - **Entonces** el servidor rechaza la solicitud con `400 SHIFT_INVALID_DAYS_RANGE` sin modificar ningún turno existente.

---

## HU-03: Monitoreo de periodos causados y saldo de vacaciones

- **Historia:** Como **guarda de seguridad (`guarda`)**, quiero **consultar cuántos periodos anuales de vacaciones he causado desde mi fecha de ingreso y registrar las vacaciones disfrutadas o programadas**, para **conocer con exactitud cuántos días hábiles me quedan pendientes por disfrutar**.

### Criterios de Aceptación

1. **Camino feliz — Cálculo por fecha de ingreso y descuento de días disfrutados:**
   - **Dado** un guarda con fecha de ingreso `2022-03-01`, `15` días hábiles por año y fecha de consulta `2026-11-09` (`4` periodos anuales cumplidos = `60` días causados),
   - **Cuando** tiene registrados `38` días disfrutados (`15` en `2022-2023`, `15` en `2023-2024` y `8` en `2024-2025`),
   - **Entonces** el panel muestra `22` días hábiles pendientes de periodos cumplidos (`7` días del periodo `2024-2025` en estado `parcial` y `15` días del periodo `2025-2026` en estado `pendiente`), más los días proporcionales acumulados del año en curso.
2. **Reflejo en calendario de turnos:**
   - **Dado** que el guarda registra un nuevo periodo de vacaciones del `2026-11-26` al `2026-11-28` con la casilla *"Marcar automáticamente estos días como Vacaciones en el calendario de turnos"* activa,
   - **Cuando** se guarda el registro,
   - **Entonces** se inserta el historial de vacaciones y, en la misma transacción SQLite, los días `2026-11-26`, `2026-11-27` y `2026-11-28` quedan marcados con `shiftType = 'vacaciones'` y `0` horas laboradas.
3. **Caso de error — Fecha final anterior a la inicial:**
   - **Dado** un formulario de vacaciones donde `endDate < startDate`,
   - **Cuando** se envía a `POST /api/vacaciones`,
   - **Entonces** se rechaza con código `400 VACATION_END_BEFORE_START` y la restricción `CHECK(end_date >= start_date)` en base de datos impide cualquier estado inválido.

---

## HU-04: Respaldo cifrado, restauración y control de acceso por rol

- **Historia:** Como **guarda o supervisor**, quiero **exportar y restaurar copias de seguridad cifradas (`AES-256-GCM`) y asegurar que cada operación valide permisos en el servidor**, para **proteger el historial laboral ante pérdida del dispositivo o accesos no autorizados**.

### Criterios de Aceptación

1. **Exportación y restauración verificada:**
   - **Dado** un usuario autenticado con turnos y vacaciones registrados,
   - **Cuando** ejecuta `POST /api/backups/export` y posteriormente `POST /api/backups/restore`,
   - **Entonces** el archivo `.enc.json` se cifra con `AES-256-GCM` (`PBKDF2` + `salt` + `iv` + `authTag`) y al restaurarse recupera exactamente los puestos, turnos y vacaciones dentro de una transacción atómica.
2. **Permisos y autorización RBAC:**
   - **Dado** un usuario con rol `guarda`,
   - **Cuando** intenta consultar `GET /api/admin/users` o cambiar el estado de un ticket con `PATCH /api/soporte/tickets/:id/status`,
   - **Entonces** el servidor rechaza la petición con `403 Forbidden` (`AUTH_FORBIDDEN`).
