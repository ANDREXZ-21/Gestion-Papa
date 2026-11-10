# 1. Definición del Problema, Propuesta de Valor y Alcance del MVP

## 1.1 Problema (en una frase verificable, sin nombrar la solución)

Los guardas de seguridad privada que trabajan en esquemas rotativos de 12 horas (`2x2x2`, `4x2`, `6x1`) pierden el control exacto de sus domingos/festivos laborados, descansos compensatorios acumulados y saldo de días de vacaciones pendientes por disfrutar debido al registro disperso en libretas de papel o mensajes sueltos, lo que ocasiona reclamos tardíos, errores en el disfrute de descansos y fatiga laboral no detectada.

## 1.2 Usuarios y Contexto de Uso

| Tipo de Usuario | Perfil | Contexto de Uso |
| :--- | :--- | :--- |
| **Usuario Primario** | Guarda de seguridad privada (**Papá**) | Consulta y registra su turno desde el teléfono móvil en la portería o al llegar a casa tras jornadas de 12 horas diurnas o nocturnas, a menudo en sótanos o garitas con baja señal de datos móviles. Necesita botones grandes, alto contraste y cero tecnicismos. |
| **Usuario Secundario** | Familiar de apoyo / Coordinador o Supervisor de puesto | Ayuda a verificar el histórico de periodos de vacaciones causados desde la fecha de ingreso, respaldar la información o revisar solicitudes sobre diferencias en festivos y compensatorios. |

## 1.3 Alternativas Actuales y Coste de No Resolverlo

- **Alternativas actuales:** Anotaciones manuales en agendas de bolsillo de fin de año, fotos a las planillas pegadas en la caseta de vigilancia o cálculo mental al cierre de mes.
- **Coste de no resolverlo:**
  1. Olvido de descansos compensatorios generados por trabajar domingos o festivos nacionales.
  2. Incertidumbre sobre cuántos días hábiles de vacaciones quedan pendientes de periodos anuales anteriores.
  3. Pérdida total del historial cuando se extravía o deteriora la libreta física.

## 1.4 Propuesta de Valor, Hipótesis Falsable y Métrica Asociada

- **Propuesta de valor:** Permitir que un guarda de seguridad registre su turno del día en menos de 10 segundos (o genere su ciclo completo `2x2x2` de un mes con 3 toques) y conozca al instante cuántos días trabajó, cuántos descansos compensatorios tiene a favor y cuántos días de vacaciones le deben desde su fecha de ingreso, incluso sin conexión a internet.
- **Hipótesis falsable:**
  > *"Si ofrecemos botones de marcación rápida de 1 toque y un generador automático de ciclos de vigilancia (`2x2x2` / `6x1`) con detección automática de festivos de Colombia, entonces el guarda registrará al menos el 90 % de los turnos del mes en menos de 15 segundos por registro sin necesitar ayuda técnica."*
- **Métrica principal de éxito:**
  - **Tiempo medio de registro de turno diario:** `< 15 segundos`.
  - **Exactitud del saldo de compensatorios y vacaciones frente a planilla:** `100 %` libre de discrepancias aritméticas.

---

## 1.5 Alcance del MVP y Priorización (RICE)

### Flujo Crítico de Extremo a Extremo (Demostrable en el MVP)

1. **Acceso inmediato y seguro:** Inicio de sesión con usuario/PIN o acceso rápido de 1 toque para el guarda principal.
2. **Programación y registro de turnos:** Marcación rápida diaria (Diurno 12h, Nocturno 12h, Relevo, Descanso Reglamentario, Descanso Compensatorio) o generación automática por patrón (`2x2x2`, `4x2`, `6x1`).
3. **Cálculo automático de indicadores:** Días trabajados, horas diurnas/nocturnas/festivas, alerta de fatiga (> 6 días continuos) y saldo de descansos compensatorios (`generados - disfrutados`).
4. **Control de vacaciones:** Cálculo automático de periodos anuales causados desde la fecha de ingreso, registro de vacaciones disfrutadas/programadas y reflejo automático en el calendario.
5. **Protección local y offline-first:** Funcionamiento sin red con cola de sincronización, detección explícita de conflictos y copias de seguridad cifradas (`AES-256-GCM`).

### Matriz de Priorización

| Capacidad | Impacto (1-10) | Confianza | Esfuerzo | Riesgo | Prioridad |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Registro de turnos diarios + cálculo de compensatorios y festivos | 10 | 100 % | Bajo | Bajo | **P0 (MVP)** |
| Generador automático de ciclos (`2x2x2`, `6x1`, `4x2`) | 9 | 95 % | Bajo | Bajo | **P0 (MVP)** |
| Histórico y saldo de vacaciones por periodos anuales causados | 10 | 100 % | Medio | Bajo | **P0 (MVP)** |
| Modo PWA Offline-First + Backups cifrados y restauración | 8 | 90 % | Medio | Medio | **P1 (Incluido)** |
| Mesa de ayuda / seguimiento de novedades de nómina | 7 | 90 % | Bajo | Bajo | **P1 (Incluido)** |

### Lista de Exclusiones Conscientes (Qué NO entra)

- **NO incluye** liquidación contable de nómina, cálculo de aportes parafiscales, cesantías, intereses de cesantías ni retención en la fuente.
- **NO incluye** facturación comercial ni contabilidad para empresas de vigilancia privada.
- **NO incluye** control biométrico de huella/rostro en tiempo real ni rastreo GPS en vivo de rondas perimetrales.

### Criterios de Salida del MVP y Siguientes Incrementos

- **Criterio de salida del MVP:** Flujo completo operativo en móvil (`320 px`) y escritorio (`1024 px`), navegación 100 % accesible por teclado (WCAG 2.2 AA), base de datos relacional SQLite transaccional y suite de pruebas automatizadas en verde.
- **Siguientes incrementos (Post-MVP):** Exportación de reporte mensual en PDF para adjuntar a desprendibles de pago y recordatorios programados de cambio de turno.
