# 3. Arquitectura, Modelo de Datos, Seguridad y Runbook Operativo

## 3.1 Estilo Arquitectónico: Monolito Modular

El sistema está diseñado como una **única unidad desplegable (Monolito Modular)** sobre Node.js y SQLite nativo (`node:sqlite`), dividida por dominios de negocio con fronteras explícitas:

```text
src/
├── app.js                     # Composición HTTP, CSP, correlación y enrutamiento
├── server.js                  # Punto de entrada y apagado elegante (graceful shutdown)
├── shared/                    # Infraestructura transversal compartida
│   ├── config.js              # Configuración explícita por variables de entorno
│   ├── database.js            # Esquema relacional, migraciones y withTransaction()
│   ├── holidays.js            # Calendario de festivos de Colombia (Ley 51/1983)
│   ├── logger.js              # Logs estructurados JSON con redacción de secretos y Correlation ID
│   ├── security.js            # Sanitización XSS, confinamiento de rutas y cifrado AES-256-GCM
│   ├── seed.js                # Semilla reproducible con datos sintéticos (sin PII real)
│   └── cli-backup.js          # Utilidad CLI para generar respaldos cifrados
└── modules/                   # Módulos de dominio desacoplados
    ├── auth/index.js          # Identidad, sesiones con expiración y autorización RBAC
    ├── turnos/index.js        # Programación de turnos, ciclos 2x2x2/6x1 y compensatorios
    ├── vacaciones/index.js    # Periodos anuales causados, días hábiles y saldos
    ├── backups/index.js       # Exportación/restauración cifrada y cola de sincronización offline
    └── soporte/index.js       # Tickets de novedades, asignación de dueño y estados
```

### Reglas de Frontera entre Módulos

1. Ningún módulo dentro de `src/modules/<dominio>` puede hacer `require()` directo de otro módulo de `src/modules/*`.
2. Cuando un caso de uso coordina varios dominios (por ejemplo, `backups` al aplicar la cola de sincronización offline sobre `turnos` y `vacaciones`), recibe únicamente los **contratos públicos inyectados** desde `src/app.js`.
3. La prueba automatizada en `tests/integration-and-contracts.test.js` verifica estáticamente que no existan imports cruzados prohibidos.

---

## 3.2 Modelo Relacional, Normalización e Invariantes (SQLite)

La base de datos utiliza **modo WAL (`PRAGMA journal_mode = WAL`)** y **claves foráneas activas (`PRAGMA foreign_keys = ON`)**.

### Tablas y Restricciones de Integridad

| Tabla | Clave Primaria | Claves Foráneas | Invariantes (`CHECK` / `UNIQUE`) |
| :--- | :--- | :--- | :--- |
| `users` | `id` (`TEXT`) | — | `username UNIQUE`, `role IN ('guarda', 'supervisor')`, `vacation_days_per_year BETWEEN 1 AND 60`, `hire_date` formato ISO `YYYY-MM-DD` |
| `sessions` | `token` (`TEXT`) | `user_id -> users(id) ON DELETE CASCADE` | Expiración controlada por `expires_at` con índice `idx_sessions_expires` |
| `guard_posts` | `id` (`TEXT`) | — | `name UNIQUE`, `active IN (0, 1)` |
| `shifts` | `id` (`TEXT`) | `user_id -> users(id)`, `post_id -> guard_posts(id)` | `UNIQUE(user_id, shift_date)`, `hours_worked BETWEEN 0 AND 24`, `version >= 1`, `shift_type` restringido al catálogo válido |
| `vacation_records` | `id` (`TEXT`) | `user_id -> users(id) ON DELETE CASCADE` | `business_days BETWEEN 1 AND 90`, `CHECK(end_date >= start_date)`, `status` validado |
| `feedback_tickets` | `id` (`TEXT`) | `user_id -> users(id) ON DELETE CASCADE` | `category` y `status` restringidos, asignación automática de `owner` |
| `sync_outbox` | `id` (`TEXT`) | — | Registro transaccional de eventos de cambio (`INSERT` / `UPDATE`) |

### Índices y Prevención de N+1

- `idx_shifts_user_date ON shifts(user_id, shift_date)`: resuelve los listados mensuales y rangos de fechas mediante `SEARCH s USING INDEX` sin escaneo completo de tabla.
- `idx_vacations_user_start ON vacation_records(user_id, start_date DESC)`: acelera la consulta de historial de vacaciones.
- La consulta de turnos realiza un único `LEFT JOIN guard_posts p ON p.id = s.post_id`, evitando el antipatrón `N+1` al hidratar el nombre y ubicación del puesto.

---

## 3.3 Estrategia de Backup, RPO / RTO y Cifrado

- **RPO (Recovery Point Objective):** `24 horas` (o `0` tras cada cambio relevante descargando copia desde la pestaña *Respaldo y Ajustes* o mediante `npm run backup`).
- **RTO (Recovery Time Objective):** `< 5 minutos` restaurando desde la interfaz web o mediante el endpoint `POST /api/backups/restore`.
- **Cifrado en reposo de copias de seguridad:** Cada copia se exporta en formato `.enc.json` cifrada con **`AES-256-GCM`**, derivando una clave de 256 bits mediante `PBKDF2-HMAC-SHA256` (`100.000` iteraciones, `salt` aleatorio de 16 bytes, `IV` de 12 bytes y `authTag` de integridad).
- **Rotación de claves:** La clave maestra se configura fuera del código mediante la variable de entorno `APP_SECRET`. Para rotarla:
  1. Restaurar o mantener la base de datos activa.
  2. Actualizar `APP_SECRET` en el entorno de ejecución.
  3. Ejecutar `npm run backup` para emitir una nueva línea base cifrada con la nueva clave y almacenar copia externa (regla 3-2-1).

---

## 3.4 Runbook de Despliegue, Migración y Rollback

### Paridad de Entornos (`development`, `staging`, `production`)

- Todos los entornos ejecutan el mismo artefacto de código o imagen `Dockerfile`, diferenciándose únicamente por variables de entorno (`.env.example`).
- En `development` y `staging` se utiliza exclusivamente la semilla sintética (`npm run seed`) que no contiene PII real.

### Procedimiento de Despliegue y Rollback en Minutos

1. **Antes de desplegar una nueva versión:**
   ```bash
   npm run backup
   ```
2. **Verificación de salud tras el despliegue:**
   ```bash
   curl -f http://127.0.0.1:3000/api/health
   ```
3. **Rollback inmediato en caso de incidente (< 3 minutos):**
   - Volver a la imagen/tag anterior del contenedor o commit estable (`git checkout <tag-estable>`).
   - Si hubo cambios de datos no deseados, restaurar el último archivo `.enc.json` desde la pestaña **Respaldo y Ajustes** o invocando `POST /api/backups/restore`.
