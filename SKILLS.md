# Especificación técnica: Gestion Trabajo Papa

> Gestionar y registrar la programación de turnos de vigilancia (día, noche, relevos), contabilizar días trabajados vs. descansos compensatorios acumulados, y monitorear el histórico y saldo de días de vacaciones disfrutadas o pendientes.

**Alcance**

QUÉ SÍ INCLUYE:
- Registro de turnos diarios (horarios, turnos 12h diurno/nocturno, puestos de guardia o minutas básicas).
- Cálculo automático de días trabajados, descansos legales/compensatorios y días festivos laborados.
- Historial de fechas de vacaciones anteriores, cálculo de periodos causados y pendientes por disfrutar.
- Interfaz clara, intuitiva y accesible desde móvil/tablet.

QUÉ NO INCLUYE:
- Liquidación contable compleja de nómina, cesantías o retenciones fiscales.
- Facturación comercial de la empresa de seguridad.
- Sistema de control biométrico en tiempo real o rastreo por GPS de rondas.

**Contexto general**

- Audiencia: Guarda de seguridad privada (usuario final) que requiere registrar o consultar turnos de manera rápida y sin complicaciones técnicas.
- Idioma de salida: Español (tono claro, formal, directo y fácil de entender).
- Reglas de negocio: Considerar patrones típicos de seguridad (ej. 2x2x2, 6x1, turnos de 12 horas día/noche), distinción entre descanso reglamentario y festivo.
- Restricciones: Respuestas y vistas concisas, botones grandes/claros, persistencia de datos local y confiable.

_Generado con SkillNeitor 1.2.0 · 2026-11-09 · 31 ítems · 14 categorías_

## Índice

1. [Producto y descubrimiento](#producto-y-descubrimiento)
2. [UX/UI y accesibilidad](#ux-ui-y-accesibilidad)
3. [Arquitectura y patrones](#arquitectura-y-patrones)
4. [Frontend web](#frontend-web)
5. [Backend y APIs](#backend-y-apis)
6. [Datos y persistencia](#datos-y-persistencia)
7. [Seguridad y privacidad](#seguridad-y-privacidad)
8. [DevOps y observabilidad](#devops-y-observabilidad)
9. [Calidad y pruebas](#calidad-y-pruebas)
10. [Rendimiento y escalabilidad](#rendimiento-y-escalabilidad)
11. [Documentación y mantenimiento](#documentacion-y-mantenimiento)
12. [Móvil y escritorio](#movil-y-escritorio)
13. [Integraciones y tiempo real](#integraciones-y-tiempo-real)
14. [Analítica y negocio](#analitica-y-negocio)

---

# Producto y descubrimiento

_Problema, alcance, usuarios, métricas y priorización._

## Definición del problema y propuesta de valor

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Producto

### Cómo usarlo

Esta skill de producto te ayuda a antes de elegir tecnología, dejar explícito qué problema resuelve el producto, para quién y por qué merece existir. Úsala como guía: Describir el problema en una frase verificable, sin nombrar la solución. Identificar usuario primario, usuario secundario y contexto de uso. Comprueba el resultado con: Existe un documento de una página con problema, usuarios y valor.

### Propósito

Antes de elegir tecnología, dejar explícito qué problema resuelve el producto, para quién y por qué merece existir.

### Lineamientos

- Describir el problema en una frase verificable, sin nombrar la solución.
- Identificar usuario primario, usuario secundario y contexto de uso.
- Documentar alternativas actuales y el coste de no resolverlo.
- Definir una propuesta de valor que pueda contrastarse con evidencia.

### Criterios de aceptación

- [ ] Existe un documento de una página con problema, usuarios y valor.
- [ ] El equipo puede explicar el problema sin mencionar la implementación.
- [ ] Hay al menos una hipótesis falsable y una métrica asociada.

### Antipatrones

- Empezar por el stack o por una lista de pantallas.
- Confundir funcionalidades con problemas de usuario.

### Referencias

- Working Backwards (Amazon)
- Continuous Discovery Habits

## Historias de usuario y criterios de aceptación

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Producto

### Cómo usarlo

Esta skill de producto te ayuda a convertir necesidades en historias pequeñas, verificables y con criterios de aceptación claros. Úsala como guía: Formato: como [rol] quiero [capacidad] para [beneficio]. Añadir criterios de aceptación en formato dado/cuando/entonces. Comprueba el resultado con: Cada historia tiene criterios de aceptación ejecutables.

### Propósito

Convertir necesidades en historias pequeñas, verificables y con criterios de aceptación claros.

### Lineamientos

- Formato: como [rol] quiero [capacidad] para [beneficio].
- Añadir criterios de aceptación en formato dado/cuando/entonces.
- Incluir casos límite, errores y permisos, no solo el camino feliz.
- Mantener cada historia con valor observable y tamaño de iteración.

### Criterios de aceptación

- [ ] Cada historia tiene criterios de aceptación ejecutables.
- [ ] Los casos de error y permisos están cubiertos.
- [ ] Una persona ajena puede validar la historia sin preguntar al autor.

### Antipatrones

- Historias técnicas sin valor visible.
- Criterios ambiguos como "debe funcionar bien".

### Referencias

- User Stories Applied (Mike Cohn)
- Example Mapping

## MVP y priorización

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Producto

### Cómo usarlo

Esta skill de producto te ayuda a definir el mínimo producto que valida la hipótesis principal y separar lo urgente de lo importante. Úsala como guía: Identificar el flujo crítico de extremo a extremo que debe funcionar. Priorizar con impacto, confianza, esfuerzo y riesgo. Comprueba el resultado con: El MVP tiene un flujo principal demostrable.

### Propósito

Definir el mínimo producto que valida la hipótesis principal y separar lo urgente de lo importante.

### Lineamientos

- Identificar el flujo crítico de extremo a extremo que debe funcionar.
- Priorizar con impacto, confianza, esfuerzo y riesgo.
- Excluir explícitamente lo que no entra en la primera versión.
- Definir criterios de salida y siguientes incrementos.

### Criterios de aceptación

- [ ] El MVP tiene un flujo principal demostrable.
- [ ] Existe una lista de exclusiones conscientes.
- [ ] Las prioridades son trazables a objetivos de producto.

### Antipatrones

- Llamar MVP a un producto completo.
- Priorizar por quién grita más fuerte.

### Referencias

- The Lean Startup
- RICE prioritization

# UX/UI y accesibilidad

_Experiencia, sistema de diseño, responsive y WCAG._

## Accesibilidad WCAG 2.2 AA

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** UX/UI, Accesibilidad

### Cómo usarlo

Esta skill de UX/UI te ayuda a diseñar y verificar interfaces usables con teclado, lectores de pantalla, contraste y movimiento reducido. Úsala como guía: HTML semántico primero; ARIA solo cuando aporta significado. Foco visible, orden lógico y objetivos táctiles de al menos 24×24 px. Comprueba el resultado con: Toda la app se recorre solo con teclado.

### Propósito

Diseñar y verificar interfaces usables con teclado, lectores de pantalla, contraste y movimiento reducido.

### Lineamientos

- HTML semántico primero; ARIA solo cuando aporta significado.
- Foco visible, orden lógico y objetivos táctiles de al menos 24×24 px.
- Contraste AA: 4.5:1 texto normal y 3:1 texto grande.
- Respetar prefers-reduced-motion y prefers-reduced-transparency.

### Criterios de aceptación

- [ ] Toda la app se recorre solo con teclado.
- [ ] Los modales atrapan y devuelven el foco.
- [ ] Estados y errores se anuncian en regiones vivas.

### Antipatrones

- Usar divs clicables sin rol ni teclado.
- Placeholders como única etiqueta.

### Referencias

- WCAG 2.2
- ARIA Authoring Practices

## Diseño responsive y adaptativo

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** UX/UI, Accesibilidad

### Cómo usarlo

Esta skill de UX/UI te ayuda a adaptar la interfaz a tamaños y capacidades reales sin degradar jerarquía ni accesibilidad. Úsala como guía: Diseñar por contenido y tareas, no por dispositivos concretos. Definir breakpoints y comportamientos esperados. Comprueba el resultado con: La app es usable a 320 px, 768 px, 1024 px y zoom 200 %.

### Propósito

Adaptar la interfaz a tamaños y capacidades reales sin degradar jerarquía ni accesibilidad.

### Lineamientos

- Diseñar por contenido y tareas, no por dispositivos concretos.
- Definir breakpoints y comportamientos esperados.
- Evitar scroll horizontal no intencional y tablas inutilizables.
- Probar zoom, orientación y tamaños intermedios.

### Criterios de aceptación

- [ ] La app es usable a 320 px, 768 px, 1024 px y zoom 200 %.
- [ ] Las tablas ofrecen patrón alternativo en móvil.
- [ ] La navegación principal sigue disponible.

### Antipatrones

- Ocultar funciones esenciales en móvil.
- Diseñar solo para el portátil del desarrollador.

### Referencias

- Responsive Web Design
- Container queries

## Formularios y validación UX

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** UX/UI, Accesibilidad

### Cómo usarlo

Esta skill de UX/UI te ayuda a reducir errores y fricción con etiquetas claras, validación útil y conservación del trabajo. Úsala como guía: Etiqueta visible, ayuda contextual y campos agrupados por significado. Validar al salir del campo y al enviar; no interrumpir en cada tecla. Comprueba el resultado con: Los errores se anuncian y reciben foco.

### Propósito

Reducir errores y fricción con etiquetas claras, validación útil y conservación del trabajo.

### Lineamientos

- Etiqueta visible, ayuda contextual y campos agrupados por significado.
- Validar al salir del campo y al enviar; no interrumpir en cada tecla.
- Mensajes que expliquen cómo corregir, junto al campo.
- No perder datos ante errores; permitir deshacer cuando sea posible.

### Criterios de aceptación

- [ ] Los errores se anuncian y reciben foco.
- [ ] Los campos obligatorios se identifican antes de enviar.
- [ ] El formulario funciona con autocompletado y teclado.

### Antipatrones

- Validar solo con color.
- Borrar el formulario tras un fallo de red.

### Referencias

- GOV.UK Design System: Form patterns

## Microcopy y estados vacíos

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** UX/UI, Accesibilidad

### Cómo usarlo

Esta skill de UX/UI te ayuda a usar el texto y los estados vacíos para orientar la siguiente acción y reducir la incertidumbre. Úsala como guía: Cada estado vacío explica qué es la pantalla y qué hacer. Errores con causa, impacto y siguiente paso. Comprueba el resultado con: Todo listado vacío tiene acción sugerida.

### Propósito

Usar el texto y los estados vacíos para orientar la siguiente acción y reducir la incertidumbre.

### Lineamientos

- Cada estado vacío explica qué es la pantalla y qué hacer.
- Errores con causa, impacto y siguiente paso.
- Acciones nombradas por resultado, no por mecanismo.
- Tono consistente y localizable.

### Criterios de aceptación

- [ ] Todo listado vacío tiene acción sugerida.
- [ ] Los errores incluyen recuperación.
- [ ] Los textos evitan culpar al usuario.

### Antipatrones

- "No hay datos" sin contexto.
- Botones "Aceptar" para acciones distintas.

### Referencias

- Mailchimp Content Style Guide
- UX Writing

# Arquitectura y patrones

_Estilos arquitectónicos, límites, APIs y decisiones estructurales._

## Monolito modular

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Arquitectura, APIs

### Cómo usarlo

Esta skill de arquitectura te ayuda a construir una sola unidad desplegable con límites internos claros, suficiente para la mayoría de productos. Úsala como guía: Definir módulos por dominio y prohibir imports cruzados arbitrarios. Exponer contratos internos explícitos y encapsular persistencia. Comprueba el resultado con: Los módulos no acceden a tablas de otros módulos sin contrato.

### Propósito

Construir una sola unidad desplegable con límites internos claros, suficiente para la mayoría de productos.

### Lineamientos

- Definir módulos por dominio y prohibir imports cruzados arbitrarios.
- Exponer contratos internos explícitos y encapsular persistencia.
- Mantener una sola base de datos con tablas por dominio.
- Preparar extracción futura sin pagar el coste de microservicios prematuros.

### Criterios de aceptación

- [ ] Los módulos no acceden a tablas de otros módulos sin contrato.
- [ ] El despliegue sigue siendo una unidad reproducible.
- [ ] Existe una prueba que detecta dependencias prohibidas.

### Antipatrones

- Monolito con un único paquete global.
- Microservicios por moda.

### Referencias

- Modular Monolith (Kamil Grzybek)
- Shopify monolith

# Frontend web

_Rendering, estado, componentes, PWA e internacionalización._

## Componentes semánticos y accesibles

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Web, JavaScript

### Cómo usarlo

Esta skill de frontend te ayuda a encapsular ui con html semántico, teclado y atributos accesibles desde el propio componente. Úsala como guía: Preferir elementos nativos antes que roles ARIA. Gestionar foco, estados y anuncios en componentes interactivos. Comprueba el resultado con: No hay divs con onClick sin alternativa de teclado.

### Propósito

Encapsular UI con HTML semántico, teclado y atributos accesibles desde el propio componente.

### Lineamientos

- Preferir elementos nativos antes que roles ARIA.
- Gestionar foco, estados y anuncios en componentes interactivos.
- Exponer props claras y evitar efectos ocultos.
- Probar cada componente con teclado y lector.

### Criterios de aceptación

- [ ] No hay divs con onClick sin alternativa de teclado.
- [ ] Los componentes tienen estados hover, focus, disabled y error.
- [ ] Los tests cubren navegación por teclado.

### Antipatrones

- Reinventar select o modal sin accesibilidad.
- Props booleanas contradictorias.

### Referencias

- WAI-ARIA Authoring Practices
- Inclusive Components

## Formularios y validación frontend

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Web, JavaScript

### Cómo usarlo

Esta skill de frontend te ayuda a implementar formularios con validación consistente, accesible y alineada con el servidor. Úsala como guía: Esquema de validación compartido o replicado explícitamente. Errores por campo y error global. Comprueba el resultado con: El servidor vuelve a validar todo.

### Propósito

Implementar formularios con validación consistente, accesible y alineada con el servidor.

### Lineamientos

- Esquema de validación compartido o replicado explícitamente.
- Errores por campo y error global.
- Estados submitting, success y error.
- Evitar doble envío e hidratar valores iniciales.

### Criterios de aceptación

- [ ] El servidor vuelve a validar todo.
- [ ] Los errores son accesibles y enfocables.
- [ ] El formulario no pierde datos al fallar.

### Antipatrones

- Confiar solo en validación cliente.
- Deshabilitar el botón sin explicar por qué.

### Referencias

- HTML constraint validation
- Zod

## PWA offline-first

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Web, JavaScript

### Cómo usarlo

Esta skill de frontend te ayuda a permitir uso sin red con caché versionada, sincronización y conflictos explícitos. Úsala como guía: Service worker con estrategia por tipo de recurso. Cola de operaciones offline y reintento. Comprueba el resultado con: La app carga sin red tras la primera visita.

### Propósito

Permitir uso sin red con caché versionada, sincronización y conflictos explícitos.

### Lineamientos

- Service worker con estrategia por tipo de recurso.
- Cola de operaciones offline y reintento.
- Indicador de estado de conexión y pendientes.
- Actualización controlada de la app.

### Criterios de aceptación

- [ ] La app carga sin red tras la primera visita.
- [ ] Las operaciones pendientes se sincronizan o fallan visiblemente.
- [ ] Una nueva versión no rompe la sesión abierta.

### Antipatrones

- Cachear todo sin invalidación.
- Prometer offline sin resolver conflictos.

### Referencias

- MDN Service Worker
- Workbox

# Backend y APIs

_Contratos, autenticación, idempotencia, colas y errores._

## Autenticación y autorización

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Backend, APIs

### Cómo usarlo

Esta skill de backend te ayuda a separar identidad de permisos y aplicar autorización en servidor para cada recurso. Úsala como guía: Sesiones seguras, rotación y expiración. RBAC/ABAC con comprobaciones en servidor. Comprueba el resultado con: Cada endpoint valida autenticación y autorización.

### Propósito

Separar identidad de permisos y aplicar autorización en servidor para cada recurso.

### Lineamientos

- Sesiones seguras, rotación y expiración.
- RBAC/ABAC con comprobaciones en servidor.
- No confiar en roles enviados por el cliente.
- Auditar accesos sensibles y revocaciones.

### Criterios de aceptación

- [ ] Cada endpoint valida autenticación y autorización.
- [ ] Hay pruebas de acceso denegado por rol.
- [ ] Los tokens no se guardan en lugares inseguros.

### Antipatrones

- Ocultar botones como control de acceso.
- IDs predecibles sin autorización por recurso.

### Referencias

- OWASP Authentication Cheat Sheet
- OAuth 2.1

## Errores, logging y trazabilidad

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Backend, APIs

### Cómo usarlo

Esta skill de backend te ayuda a producir errores accionables y correlacionar logs, métricas y trazas sin filtrar datos sensibles. Úsala como guía: Códigos de error estables y mensajes para usuario. Correlation ID por petición y propagación entre servicios. Comprueba el resultado con: Cada error tiene traza y contexto.

### Propósito

Producir errores accionables y correlacionar logs, métricas y trazas sin filtrar datos sensibles.

### Lineamientos

- Códigos de error estables y mensajes para usuario.
- Correlation ID por petición y propagación entre servicios.
- Logs estructurados con niveles y sampling.
- No registrar secretos ni datos personales.

### Criterios de aceptación

- [ ] Cada error tiene traza y contexto.
- [ ] Los logs permiten reconstruir una petición.
- [ ] Los datos sensibles se redactan.

### Antipatrones

- Loggear objetos completos con tokens.
- Stack traces al usuario final.

### Referencias

- OpenTelemetry
- Google SRE Book

# Datos y persistencia

_Modelado, migraciones, transacciones, búsqueda y backups._

## Backup y recuperación

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** SQL, SQLite

### Cómo usarlo

Esta skill de datos te ayuda a definir rpo/rto, backups verificados y restauración ensayada, no solo copias que existen. Úsala como guía: Backups automáticos, cifrados y fuera del host. Probar restauración periódicamente. Comprueba el resultado con: Existe una restauración completa probada.

### Propósito

Definir RPO/RTO, backups verificados y restauración ensayada, no solo copias que existen.

### Lineamientos

- Backups automáticos, cifrados y fuera del host.
- Probar restauración periódicamente.
- Documentar RPO y RTO.
- Versionar backups y retención.

### Criterios de aceptación

- [ ] Existe una restauración completa probada.
- [ ] El backup no depende del mismo disco.
- [ ] La pérdida máxima aceptada está documentada.

### Antipatrones

- Backups nunca restaurados.
- Guardar backup en el mismo servidor.

### Referencias

- Google SRE: Data integrity
- 3-2-1 backup rule

## Modelo relacional y normalización

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** SQL, SQLite

### Cómo usarlo

Esta skill de datos te ayuda a modelar entidades, relaciones y restricciones que representen el dominio y protejan la integridad. Úsala como guía: Claves primarias estables y foráneas explícitas. Normalizar hasta que duela; desnormalizar con motivo. Comprueba el resultado con: La base impide estados inválidos.

### Propósito

Modelar entidades, relaciones y restricciones que representen el dominio y protejan la integridad.

### Lineamientos

- Claves primarias estables y foráneas explícitas.
- Normalizar hasta que duela; desnormalizar con motivo.
- Restricciones NOT NULL, UNIQUE y CHECK.
- Documentar el modelo y sus invariantes.

### Criterios de aceptación

- [ ] La base impide estados inválidos.
- [ ] Las consultas críticas tienen índice.
- [ ] El modelo se entiende sin preguntar al autor.

### Antipatrones

- Guardar arrays en columnas de texto sin necesidad.
- Sin claves foráneas por pereza.

### Ejemplo

```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### Referencias

- SQL Antipatterns
- Use The Index, Luke

## Transacciones y consistencia

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** SQL, SQLite

### Cómo usarlo

Esta skill de datos te ayuda a definir qué operaciones deben ser atómicas y cómo se mantiene la consistencia entre agregados. Úsala como guía: Delimitar transacciones cortas y claras. Entender niveles de aislamiento y sus anomalías. Comprueba el resultado con: No quedan escrituras parciales.

### Propósito

Definir qué operaciones deben ser atómicas y cómo se mantiene la consistencia entre agregados.

### Lineamientos

- Delimitar transacciones cortas y claras.
- Entender niveles de aislamiento y sus anomalías.
- Usar outbox para consistencia entre DB y eventos.
- Diseñar compensaciones para procesos distribuidos.

### Criterios de aceptación

- [ ] No quedan escrituras parciales.
- [ ] Los conflictos de concurrencia están probados.
- [ ] Los procesos multi-paso tienen compensación.

### Antipatrones

- Transacciones que llaman APIs externas.
- Asumir consistencia fuerte entre servicios.

### Referencias

- Designing Data-Intensive Applications
- Transaction isolation levels

# Seguridad y privacidad

_Amenazas, secretos, saneamiento, cifrado y auditoría._

## Cifrado en tránsito y reposo

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Seguridad

### Cómo usarlo

Esta skill de seguridad te ayuda a proteger datos con tls moderno, cifrado en reposo y gestión segura de claves. Úsala como guía: TLS 1.2+ y HSTS en producción. Cifrado de backups y discos. Comprueba el resultado con: Todo tráfico externo usa TLS.

### Propósito

Proteger datos con TLS moderno, cifrado en reposo y gestión segura de claves.

### Lineamientos

- TLS 1.2+ y HSTS en producción.
- Cifrado de backups y discos.
- Claves separadas de datos y rotables.
- No inventar criptografía propia.

### Criterios de aceptación

- [ ] Todo tráfico externo usa TLS.
- [ ] Los backups están cifrados.
- [ ] Las claves tienen rotación documentada.

### Antipatrones

- Certificados autofirmados en producción.
- Cifrar con clave en el mismo repo.

### Referencias

- OWASP Cryptographic Storage
- Mozilla SSL config

## Sanitización y XSS

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Seguridad

### Cómo usarlo

Esta skill de seguridad te ayuda a escapar salidas y sanear html enriquecido con listas permitidas estrictas. Úsala como guía: Escape contextual por HTML, atributo, URL y JS. Sanear markdown renderizado con DOMPurify. Comprueba el resultado con: Los payloads XSS conocidos se bloquean.

### Propósito

Escapar salidas y sanear HTML enriquecido con listas permitidas estrictas.

### Lineamientos

- Escape contextual por HTML, atributo, URL y JS.
- Sanear markdown renderizado con DOMPurify.
- CSP estricta sin inline no confiable.
- Prohibir iframes y scripts no necesarios.

### Criterios de aceptación

- [ ] Los payloads XSS conocidos se bloquean.
- [ ] La CSP no permite scripts inline arbitrarios.
- [ ] Los enlaces externos usan rel seguro.

### Antipatrones

- innerHTML con datos de usuario.
- Sanitizar solo en cliente.

### Referencias

- OWASP XSS Prevention
- DOMPurify

## Validación de entradas y rutas

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Seguridad

### Cómo usarlo

Esta skill de seguridad te ayuda a validar forma, tipo y límites de toda entrada, y confinar rutas a directorios permitidos. Úsala como guía: Validar en servidor con esquema. Resolver rutas y verificar que quedan dentro de la raíz. Comprueba el resultado con: Los payloads ../../ se rechazan.

### Propósito

Validar forma, tipo y límites de toda entrada, y confinar rutas a directorios permitidos.

### Lineamientos

- Validar en servidor con esquema.
- Resolver rutas y verificar que quedan dentro de la raíz.
- Rechazar traversal, enlaces simbólicos y nombres reservados.
- Limitar tamaño y profundidad.

### Criterios de aceptación

- [ ] Los payloads ../../ se rechazan.
- [ ] Las entradas fuera de rango fallan con error claro.
- [ ] Los archivos extraídos no escapan del destino.

### Antipatrones

- Confiar en validación del cliente.
- Concatenar rutas sin resolver.

### Referencias

- OWASP Input Validation
- Zip Slip

# DevOps y observabilidad

_CI/CD, contenedores, entornos, telemetría y rollback._

## Despliegue, rollback y migración

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Docker, CI/CD

### Cómo usarlo

Esta skill de DevOps te ayuda a desplegar sin downtime con estrategias progresivas y vuelta atrás ensayada. Úsala como guía: Canary, blue-green o rolling según riesgo. Migraciones compatibles hacia atrás. Comprueba el resultado con: Un despliegue fallido vuelve atrás en minutos.

### Propósito

Desplegar sin downtime con estrategias progresivas y vuelta atrás ensayada.

### Lineamientos

- Canary, blue-green o rolling según riesgo.
- Migraciones compatibles hacia atrás.
- Rollback automatizado por métricas.
- Comunicación y runbook de incidente.

### Criterios de aceptación

- [ ] Un despliegue fallido vuelve atrás en minutos.
- [ ] La migración no rompe la versión anterior.
- [ ] El rollback está probado.

### Antipatrones

- Big bang sin plan.
- Migraciones destructivas en el mismo paso.

### Referencias

- Blue-green deployment
- Feature flags

## Entornos y configuración

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Docker, CI/CD

### Cómo usarlo

Esta skill de DevOps te ayuda a mantener paridad entre desarrollo, staging y producción con configuración explícita. Úsala como guía: Mismos artefactos, distinta configuración. Datos sintéticos en entornos no productivos. Comprueba el resultado con: Staging reproduce producción en lo relevante.

### Propósito

Mantener paridad entre desarrollo, staging y producción con configuración explícita.

### Lineamientos

- Mismos artefactos, distinta configuración.
- Datos sintéticos en entornos no productivos.
- Acceso y secretos separados.
- Documentar diferencias inevitables.

### Criterios de aceptación

- [ ] Staging reproduce producción en lo relevante.
- [ ] No se usan datos reales en desarrollo.
- [ ] La configuración está versionada.

### Antipatrones

- "En mi máquina funciona".
- Cambios manuales en producción.

### Referencias

- The Twelve-Factor App
- Environment parity

# Calidad y pruebas

_Estrategia de pruebas, contratos, E2E, carga y accesibilidad._

## Datos de prueba y fixtures

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Testing

### Cómo usarlo

Esta skill de calidad te ayuda a crear datos representativos, aislados y sin información real, con generación reproducible. Úsala como guía: Factories y seeds versionados. Datos anonimizados o sintéticos. Comprueba el resultado con: Ninguna prueba usa PII real.

### Propósito

Crear datos representativos, aislados y sin información real, con generación reproducible.

### Lineamientos

- Factories y seeds versionados.
- Datos anonimizados o sintéticos.
- Escenarios límite incluidos.
- Limpieza y aislamiento por prueba.

### Criterios de aceptación

- [ ] Ninguna prueba usa PII real.
- [ ] Los datos cubren casos límite.
- [ ] La generación es determinista cuando importa.

### Antipatrones

- Copiar producción a staging.
- Fixtures gigantes sin propósito.

### Referencias

- Faker
- Test data management

## Pruebas de integración y contrato

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Testing

### Cómo usarlo

Esta skill de calidad te ayuda a verificar que módulos, base de datos y apis colaboran según sus contratos reales. Úsala como guía: Probar adaptadores contra infraestructura real o contenedor. Consumer-driven contracts para APIs. Comprueba el resultado con: Los contratos se verifican en CI.

### Propósito

Verificar que módulos, base de datos y APIs colaboran según sus contratos reales.

### Lineamientos

- Probar adaptadores contra infraestructura real o contenedor.
- Consumer-driven contracts para APIs.
- Semillas de datos controladas.
- Aislar y limpiar estado.

### Criterios de aceptación

- [ ] Los contratos se verifican en CI.
- [ ] Las pruebas de integración usan DB real.
- [ ] No hay dependencia entre pruebas.

### Antipatrones

- Mockear la base de datos siempre.
- Contratos solo en documentación.

### Referencias

- Pact
- Testcontainers

## Pruebas unitarias

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Testing

### Cómo usarlo

Esta skill de calidad te ayuda a probar reglas y funciones puras con casos límite, rápidos y sin infraestructura. Úsala como guía: Nombrar por comportamiento esperado. Incluir límites, errores y casos vacíos. Comprueba el resultado con: Las reglas de negocio tienen pruebas.

### Propósito

Probar reglas y funciones puras con casos límite, rápidos y sin infraestructura.

### Lineamientos

- Nombrar por comportamiento esperado.
- Incluir límites, errores y casos vacíos.
- Evitar mocks excesivos.
- Mantener ejecución por debajo de segundos.

### Criterios de aceptación

- [ ] Las reglas de negocio tienen pruebas.
- [ ] Los casos límite están cubiertos.
- [ ] Las pruebas no dependen del orden.

### Antipatrones

- Probar getters triviales.
- Mocks que replican la implementación.

### Referencias

- Test Desiderata
- xUnit patterns

# Rendimiento y escalabilidad

_Presupuestos, consultas, caché, CDN y escalado._

## Optimización de consultas y N+1

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Performance, SQL

### Cómo usarlo

Esta skill de rendimiento te ayuda a detectar consultas lentas y patrones n+1 con planes de ejecución e índices correctos. Úsala como guía: Revisar EXPLAIN de consultas críticas. Eliminar N+1 con joins o batch loading. Comprueba el resultado con: No hay N+1 en rutas críticas.

### Propósito

Detectar consultas lentas y patrones N+1 con planes de ejecución e índices correctos.

### Lineamientos

- Revisar EXPLAIN de consultas críticas.
- Eliminar N+1 con joins o batch loading.
- Índices compuestos según filtros y orden.
- Medir antes y después.

### Criterios de aceptación

- [ ] No hay N+1 en rutas críticas.
- [ ] Las consultas lentas tienen índice.
- [ ] El plan no hace full scan en tablas grandes.

### Antipatrones

- Añadir índices a todo.
- Optimizar sin medir.

### Referencias

- Use The Index, Luke
- PostgreSQL EXPLAIN

# Documentación y mantenimiento

_README, ADRs, API, runbooks y manual de usuario._

## Manual de usuario y changelog

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Markdown

### Cómo usarlo

Esta skill de documentación te ayuda a explicar el producto a usuarios finales y comunicar cambios de forma comprensible. Úsala como guía: Guía por tareas y capturas actualizadas. Changelog con impacto y migración. Comprueba el resultado con: Las tareas principales están documentadas.

### Propósito

Explicar el producto a usuarios finales y comunicar cambios de forma comprensible.

### Lineamientos

- Guía por tareas y capturas actualizadas.
- Changelog con impacto y migración.
- Búsqueda y ayuda contextual.
- Accesibilidad de la documentación.

### Criterios de aceptación

- [ ] Las tareas principales están documentadas.
- [ ] Cada release tiene changelog.
- [ ] Las capturas coinciden con la versión.

### Antipatrones

- Changelog de commits.
- Manual sin versión.

### Referencias

- Keep a Changelog
- Semantic Versioning

## README y guía de inicio

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Markdown

### Cómo usarlo

Esta skill de documentación te ayuda a permitir que una persona nueva entienda, instale y ejecute el proyecto sin ayuda informal. Úsala como guía: Qué es, para quién y qué resuelve. Requisitos, instalación y comandos básicos. Comprueba el resultado con: Un nuevo desarrollador arranca siguiendo el README.

### Propósito

Permitir que una persona nueva entienda, instale y ejecute el proyecto sin ayuda informal.

### Lineamientos

- Qué es, para quién y qué resuelve.
- Requisitos, instalación y comandos básicos.
- Configuración, tests y troubleshooting.
- Enlaces a documentación profunda.

### Criterios de aceptación

- [ ] Un nuevo desarrollador arranca siguiendo el README.
- [ ] Los comandos están probados.
- [ ] Las variables de entorno están documentadas.

### Antipatrones

- README desactualizado.
- Suposiciones de conocimiento interno.

### Referencias

- Make a README
- Diátaxis

# Móvil y escritorio

_Apps multiplataforma, shells de escritorio, updates y sync._

## Almacenamiento local y sincronización

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Mobile, SQLite

### Cómo usarlo

Esta skill de móvil y escritorio te ayuda a guardar datos localmente y sincronizar con el servidor sin perder cambios ni duplicar. Úsala como guía: Base local transaccional y migraciones. Cola de cambios y reintentos. Comprueba el resultado con: La app funciona offline.

### Propósito

Guardar datos localmente y sincronizar con el servidor sin perder cambios ni duplicar.

### Lineamientos

- Base local transaccional y migraciones.
- Cola de cambios y reintentos.
- Resolución de conflictos explícita.
- Indicadores de sincronización.

### Criterios de aceptación

- [ ] La app funciona offline.
- [ ] Los conflictos no se resuelven en silencio.
- [ ] La sincronización es idempotente.

### Antipatrones

- Sobrescribir siempre el servidor.
- Sin versión de esquema local.

### Referencias

- Local-first software
- CRDTs

## Notificaciones y permisos

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Mobile

### Cómo usarlo

Esta skill de móvil y escritorio te ayuda a pedir permisos con contexto y usar notificaciones con respeto, segmentación y preferencias. Úsala como guía: Solicitar permiso solo al necesitarlo. Explicar beneficio antes del diálogo del sistema. Comprueba el resultado con: El usuario puede desactivar canales.

### Propósito

Pedir permisos con contexto y usar notificaciones con respeto, segmentación y preferencias.

### Lineamientos

- Solicitar permiso solo al necesitarlo.
- Explicar beneficio antes del diálogo del sistema.
- Preferencias por canal y frecuencia.
- Deep links y manejo de notificación en frío.

### Criterios de aceptación

- [ ] El usuario puede desactivar canales.
- [ ] La notificación abre el destino correcto.
- [ ] No se envía spam sin consentimiento.

### Antipatrones

- Pedir todos los permisos al inicio.
- Notificaciones sin deep link.

### Referencias

- Apple HIG notifications
- Android notification channels

# Integraciones y tiempo real

_WebSockets, SSE, sincronización y terceros._

## Sincronización y conflictos

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Realtime

### Cómo usarlo

Esta skill de tiempo real te ayuda a definir cómo convergen ediciones concurrentes y cómo se informa al usuario. Úsala como guía: Elegir last-write-wins, versiones o CRDT. Guardar autor y timestamp/vector. Comprueba el resultado con: Dos ediciones simultáneas no se pierden silenciosamente.

### Propósito

Definir cómo convergen ediciones concurrentes y cómo se informa al usuario.

### Lineamientos

- Elegir last-write-wins, versiones o CRDT.
- Guardar autor y timestamp/vector.
- Mostrar conflictos y permitir resolver.
- Probar escenarios de concurrencia.

### Criterios de aceptación

- [ ] Dos ediciones simultáneas no se pierden silenciosamente.
- [ ] El usuario puede revisar el conflicto.
- [ ] La convergencia está probada.

### Antipatrones

- Last-write-wins sin aviso.
- Mezclar campos de distintos autores.

### Referencias

- CRDT primer
- Operational transformation

# Analítica y negocio

_Eventos, facturación, experimentación, soporte y legal._

## Soporte y feedback

**Prioridad:** should · **Estado:** aprobado · **Tecnologías:** Analytics

### Cómo usarlo

Esta skill de negocio te ayuda a cerrar el ciclo entre incidencias de usuario y producto con priorización visible. Úsala como guía: Canal único y categorías. Contexto técnico adjunto con consentimiento. Comprueba el resultado con: Cada ticket tiene estado y dueño.

### Propósito

Cerrar el ciclo entre incidencias de usuario y producto con priorización visible.

### Lineamientos

- Canal único y categorías.
- Contexto técnico adjunto con consentimiento.
- SLA y escalado.
- Feedback convertido en decisiones.

### Criterios de aceptación

- [ ] Cada ticket tiene estado y dueño.
- [ ] Los bugs recurrentes se agrupan.
- [ ] El usuario recibe respuesta.

### Antipatrones

- Feedback en redes sin registro.
- Cerrar tickets sin solución.

### Referencias

- ITIL basics
- Support-driven growth
