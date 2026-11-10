# 🛡️ Gestión Trabajo Papá

> Sistema web y PWA *offline-first* para gestionar y registrar la programación de turnos de vigilancia privada (día, noche, relevos, ciclos `2x2x2` y `6x1`), contabilizar días trabajados frente a descansos compensatorios acumulados y monitorear el histórico y saldo de días de vacaciones disfrutadas o pendientes.

---

## 1. ¿Qué es, para quién es y qué problema resuelve?

- **¿Para quién es?** Diseñado especialmente para guardas de seguridad privada (**Papá**) y su familia o coordinador de apoyo, con una interfaz en español claro, botones grandes, alto contraste y sin complicaciones técnicas.
- **¿Qué problema resuelve?** Elimina las cuentas manuales en libretas de papel donde suelen perderse domingos o festivos laborados, descansos compensatorios pendientes por disfrutar y el saldo exacto de vacaciones causadas por cada año de servicio.

### Qué incluye y qué no incluye

| Qué SÍ incluye | Qué NO incluye |
| :--- | :--- |
| Registro de turnos diarios de 12h/8h (diurno, nocturno, relevo, descansos) y puestos de guardia con minuta básica | Liquidación contable compleja de nómina, cesantías o retenciones fiscales |
| Generador automático de ciclos de vigilancia (`2x2x2`, `4x2`, `6x1`, diurno/nocturno fijo) | Facturación comercial de empresas de vigilancia |
| Detección automática de domingos y festivos de Colombia (Ley Emiliani) y saldo de compensatorios | Control biométrico en tiempo real o rastreo GPS de rondas |
| Histórico de vacaciones, cálculo de periodos anuales causados desde el ingreso y días pendientes | — |
| Uso sin internet (PWA Offline-First), resolución de conflictos y copias de seguridad cifradas (`AES-256-GCM`) | — |

---

## 2. Requisitos e Instalación Rápida

### Requisitos previos

- **Node.js `>= 22.0.0`** (utiliza los módulos nativos `node:sqlite`, `node:test`, `node:crypto` y `node:http`, sin dependencias externas pesadas).
- Opcional: **Docker** y **Docker Compose** para despliegue en contenedor.

### Instalación y arranque en 3 pasos

1. **Clonar o abrir la carpeta del proyecto y configurar variables de entorno (opcional):**
   ```bash
   cp .env.example .env
   ```
2. **Inicializar la base de datos con datos sintéticos de prueba (opcional, `npm start` también lo hace automáticamente si está vacía):**
   ```bash
   npm run seed
   ```
3. **Iniciar el servidor:**
   ```bash
   npm start
   ```
   Abre en tu navegador: **`http://127.0.0.1:3000`**

> **Credenciales de acceso predeterminadas (entorno local):**
> - **Guarda Principal (Papá):** Usuario `papa` · PIN `1234` (también cuenta con botón de ingreso rápido de 1 toque).
> - **Supervisor (Demo RBAC):** Usuario `supervisor` · PIN `9999`.

---

## 3. Comandos Básicos del Proyecto

| Comando | Descripción |
| :--- | :--- |
| `npm start` | Inicia el servidor en `http://127.0.0.1:3000` (crea y migra la base SQLite automáticamente). |
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga automática (`node --watch`). |
| `npm test` | Ejecuta la suite completa de pruebas unitarias, integración, contratos, seguridad y arquitectura. |
| `npm run seed` | Carga la semilla reproducible con datos sintéticos en la base de datos local. |
| `npm run backup` | Genera una copia de seguridad cifrada (`AES-256-GCM`) en la carpeta `backups/`. |

### Ejecución con Docker

```bash
docker compose up --build -d
```

---

## 4. Variables de Entorno (`.env`)

| Variable | Valor por defecto | Descripción |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Entorno de ejecución (`development`, `staging`, `production`, `test`). |
| `HOST` | `127.0.0.1` | Dirección IP donde escucha el servidor HTTP (`0.0.0.0` en Docker). |
| `PORT` | `3000` | Puerto HTTP de la aplicación. |
| `DB_PATH` | `./data/gestion_papa.sqlite` | Ruta del archivo de base de datos relacional SQLite. |
| `BACKUP_DIR` | `./backups` | Directorio donde se almacenan las copias de seguridad cifradas `.enc.json`. |
| `APP_SECRET` | *(clave de desarrollo)* | Clave maestra para derivar el cifrado `AES-256-GCM` de los respaldos. **Cambiar en producción.** |

---

## 5. Pruebas de Calidad y Solución de Problemas (Troubleshooting)

### Ejecutar pruebas

```bash
npm test
```

La suite en `tests/` verifica:
- **Pruebas unitarias (`tests/unit.test.js`):** Ciclos `2x2x2`/`6x1`, cálculo de compensatorios y alerta de fatiga, cálculo de periodos de vacaciones, festivos de Colombia, bloqueo XSS, protección contra Path Traversal (`../../`), cifrado `AES-256-GCM` y redacción de secretos en logs.
- **Pruebas de integración y contrato (`tests/integration-and-contracts.test.js`):** Restricciones `CHECK`/`FOREIGN KEY` en SQLite real, atomicidad de transacciones (`ROLLBACK`), RBAC por rol (`401`/`403`), detección de conflictos de edición (`409 SYNC_CONFLICT`), restauración completa de backups cifrados, planes de ejecución `EXPLAIN QUERY PLAN` con índices y cumplimiento de fronteras de monolito modular + accesibilidad WCAG 2.2 AA.

### Solución de problemas frecuentes

- **Error `Cannot find module 'node:sqlite'`:** Verifica que estás ejecutando **Node.js 22 o superior** (`node -v`).
- **Puerto `3000` ocupado:** Cambia la variable `PORT=3001` en tu archivo `.env` o ejecuta `PORT=3001 npm start`.
- **Error al restaurar un backup (`BACKUP_DECRYPT_FAILED`):** Asegúrate de que la variable `APP_SECRET` coincida con la clave que estaba configurada cuando se exportó el archivo `.enc.json`.

---

## 6. Documentación Profunda

- 📄 [1. Definición del Problema, Propuesta de Valor y MVP](docs/01-definicion-problema-y-mvp.md)
- 📄 [2. Historias de Usuario y Criterios de Aceptación](docs/02-historias-de-usuario.md)
- 📄 [3. Arquitectura, Modelo de Datos, Backups y Runbook Operativo](docs/03-arquitectura-datos-y-operaciones.md)
- 📘 [4. Manual de Usuario Paso a Paso](docs/04-manual-de-usuario.md)
- 📋 [Historial de Versiones (`CHANGELOG.md`)](CHANGELOG.md)
- 📐 [Especificación Técnica Completa (`SKILLS.md`)](SKILLS.md)
