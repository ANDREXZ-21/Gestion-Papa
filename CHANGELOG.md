# Changelog

Todos los cambios notables de **Gestión Trabajo Papá** se documentan en este archivo.
El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2026-11-09

### Añadido (Added)

- **Gestión de Turnos de Vigilancia (`src/modules/turnos`):**
  - Registro diario de turnos de 12h/8h (`diurno`, `nocturno`, `relevo`), descansos reglamentarios, descansos compensatorios, permisos/incapacidades y vacaciones.
  - Generador automático de programación por patrones típicos de seguridad privada (`2x2x2`, `4x2`, `6x1`, `diurno_fijo`, `nocturno_fijo`).
  - Detección automática de domingos y días festivos nacionales de Colombia (Ley 51 de 1983 / Ley Emiliani) con contabilización automática de descansos compensatorios generados vs. disfrutados.
  - Alerta preventiva de fatiga laboral cuando se superan 6 jornadas continuas sin descanso.
- **Control e Histórico de Vacaciones (`src/modules/vacaciones`):**
  - Cálculo automático de periodos anuales causados desde la fecha de ingreso del guarda, días proporcionales del año en curso, días disfrutados, días programados y saldo pendiente por disfrutar.
  - Registro de periodos de vacaciones con cálculo automático de días hábiles y reflejo opcional directo en el calendario de turnos.
- **Interfaz Web Accesible (WCAG 2.2 AA) y PWA Offline-First (`public/`):**
  - Diseño adaptativo para móvil (`320 px`), tablet (`768 px`) y escritorio (`1024 px`) con transformación de tablas en tarjetas en pantallas pequeñas y objetivos táctiles grandes (`>= 48 px`).
  - Navegación completa por teclado, enlace para saltar al contenido, regiones vivas (`aria-live`), modales nativos `<dialog>` con gestión de foco y soporte para `prefers-reduced-motion`.
  - Service Worker (`sw.js`) con caché versionada, cola local de operaciones offline (`localStorage`), sincronización idempotente (`POST /api/sync`) y resolución interactiva de conflictos de versión (`409 SYNC_CONFLICT`).
- **Seguridad, Persistencia Transaccional y Copias Cifradas (`src/shared`, `src/modules/backups`):**
  - Base de datos relacional SQLite (`node:sqlite`) con claves foráneas, restricciones `CHECK`/`UNIQUE`, índices compuestos y transacciones atómicas (`withTransaction`).
  - Exportación y restauración probada de copias de seguridad cifradas con `AES-256-GCM` (`PBKDF2-HMAC-SHA256`).
  - Autenticación por sesión con expiración, control de acceso basado en roles (`guarda`, `supervisor`), cabeceras de seguridad (`CSP`, `HSTS`, `X-Frame-Options`), sanitización XSS, confinamiento de rutas contra Path Traversal y logs estructurados con `Correlation ID` y redacción de secretos.
- **Mesa de Ayuda y Soporte (`src/modules/soporte`):**
  - Canal único de novedades y reclamos de nómina/turnos con asignación automática de responsable y seguimiento de estado.

### Notas de Migración

- Versión inicial `1.0.0`. Al iniciar por primera vez (`npm start` o `npm run seed`), se aplica automáticamente la migración `v1` en `schema_migrations` y se cargan datos sintéticos de demostración si la base está vacía.
