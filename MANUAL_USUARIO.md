# 📖 MANUAL DE USUARIO
## Aplicación: Gestión Trabajo Papá

**Versión:** 1.0.0  
**Dirigido a:** Guardas de Seguridad Privada, Relevos y Supervisores  
**Plataforma:** Windows 10 / 11 (Versión Portable Ejecutable y Navegador Web / Móvil)  

---

## 1. Bienvenida y Propósito de la Aplicación

¡Bienvenido a **Gestión Trabajo Papá**!  
Esta herramienta ha sido creada especialmente para ayudarte a llevar un control claro, rápido y seguro de tu trabajo como guarda de seguridad, sin complicaciones técnicas ni cálculos manuales en cuadernos.

Con esta aplicación podrás:
- **Anotar tu turno del día en un solo clic** (Diurno, Nocturno, Relevo, Descanso o Compensatorio).
- **Saber cuántos días compensatorios te deben** cada vez que trabajas un domingo o un día festivo de Colombia.
- **Programar todo tu mes automáticamente** según tu ciclo de trabajo (`2x2x2`, `4x2`, `6x1` o turno fijo).
- **Consultar cuántos días de vacaciones tienes acumulados**, cuántos ya disfrutaste y cuántos están pendientes por disfrutar.
- **Guardar copias de seguridad en tu equipo** para que tu información nunca se pierda.

---

## 2. Primeros Pasos: Cómo Abrir la Aplicación en Windows

La aplicación se entrega en una **versión portable para Windows**, lo que significa que **no necesitas instalar programas complicados ni bases de datos** para usarla.

### 2.1. Cómo iniciar el programa
1. Ubica la carpeta **Gestion-Papa** en tu computador (por ejemplo, en el Escritorio o en tu memoria USB).
2. Haz doble clic sobre el archivo ejecutable **`GestionPapa-Portable.exe`** (o el lanzador **`Iniciar-GestionPapa.bat`** incluido en la carpeta).
3. Se abrirá automáticamente la ventana de la aplicación lista para usar.

> `[INSERTAR CAPTURA DE PANTALLA AQUÍ: Carpeta del proyecto mostrando el archivo ejecutable portable en Windows]`

### 2.2. ¿Qué hacer si aparece el aviso de "Windows protegió su PC" (SmartScreen)?
Cuando ejecutas por primera vez una aplicación portable descargada de internet en Windows 10 o Windows 11, es normal que aparezca una ventana azul de **Microsoft Defender SmartScreen**. No te preocupes, la aplicación es completamente segura. Sigue estos dos pasos:

1. Haz clic en el texto subrayado que dice **"Más información"** (*More info*).
2. Se mostrará un botón en la parte inferior derecha llamado **"Ejecutar de todas formas"** (*Run anyway*). Haz clic en él y la aplicación se abrirá normalmente.

> `[INSERTAR CAPTURA DE PANTALLA AQUÍ: Ventana de Windows SmartScreen indicando clic en "Más información" y "Ejecutar de todas formas"]`

### 2.3. Credenciales de Acceso Iniciales (Cambio de Perfil)
En la esquina superior derecha de la pantalla puedes elegir con qué perfil trabajar o ingresar tu PIN cuando el sistema lo solicite:
- **Perfil Guarda de Seguridad (Por defecto):** Usuario `papa` · PIN de acceso: `1234`
- **Perfil Supervisor:** Usuario `supervisor` · PIN de acceso: `9999`

---

## 3. Descripción de la Interfaz Principal

La pantalla está diseñada con **letras grandes, colores claros y botones fáciles de tocar**. Se divide en tres zonas principales:

1. **Barra Superior Oscura (Encabezado):**
   - Muestra el nombre de la aplicación (**Gestión Trabajo Papá**).
   - **Indicador de Estado:** Te avisa si estás *"En línea · Guardado local activo"* o *"Sin internet · Guardado en dispositivo"*.
   - **Selector de Perfil:** Permite ver el nombre del guarda activo.
2. **Menú de Navegación por Pestañas (4 Botones Principales):**
   - 📅 **1. Mis Turnos:** Calendario mensual, marcación rápida y resumen de días trabajados y compensatorios.
   - 🏖️ **2. Mis Vacaciones:** Saldo de días de vacaciones que te debe la empresa e historial por año.
   - 💾 **3. Respaldo y Ajustes:** Descarga y restauración de copias de seguridad locales.
   - 🛟 **4. Soporte / Novedades:** Envío de reportes o dudas sobre turnos y vacaciones.
3. **Tarjetas de Resumen Superior:**
   - Cuadros informativos grandes que se actualizan solos cada vez que registras o cambias un turno.

> `[INSERTAR CAPTURA DE PANTALLA AQUÍ: Vista general de la pantalla principal señalando la Barra Superior, las 4 Pestañas y las Tarjetas de Resumen]`

---

## 4. Guía Paso a Paso de Funcionalidades

### 4.1. Módulo 1: Registrar el Turno de Hoy en 1 Toque
Si solo quieres dejar anotado el turno que hiciste hoy:

1. Asegúrate de estar en la pestaña **📅 1. Mis Turnos**.
2. Ubica el recuadro **"Marcación Rápida del Día Seleccionado"** en la parte superior.
3. Verifica la fecha y el **Puesto de Guardia** (por ejemplo: *Portería Principal - Conjunto Residencial*).
4. Haz clic en uno de los **5 botones de colores**:
   - **☀️ Diurno 12h (`06:00 a 18:00`):** Para tu turno de día.
   - **🌙 Nocturno 12h (`18:00 a 06:00`):** Para tu turno de noche.
   - **🔄 Relevo 12h:** Cuando cubres el puesto de otro compañero.
   - **🏠 Descanso Reglamentario:** Tu día libre normal dentro de la programación.
   - **✅ Tomar Compensatorio:** Cuando disfrutas un día libre que la empresa te debía por haber trabajado un domingo o festivo.
5. ¡Listo! Verás un mensaje verde de confirmación en la parte superior y las tarjetas de **Días Trabajados**, **Horas del Mes** y **Saldo de Compensatorios** se actualizarán al instante.

> **💡 Dato importante sobre Domingos y Festivos:** No tienes que buscar en un calendario si hoy es festivo. Si registras un turno trabajado en domingo o en un día festivo de Colombia, el programa lo detecta automáticamente y **suma +1 a tu Saldo de Compensatorios Pendientes**.

> `[INSERTAR CAPTURA DE PANTALLA AQUÍ: Recuadro de "Marcación Rápida del Día Seleccionado" con los 5 botones de turno y las tarjetas de resumen]`

---

### 4.2. Módulo 1: Generar Todo el Mes Automáticamente (`2x2x2`, `4x2` o `6x1`)
Para no tener que anotar día por día toda tu programación del mes:

1. En la pestaña **📅 1. Mis Turnos**, haz clic en el botón **"⚡ Generar Ciclo (2x2x2 / 6x1)"**.
2. Se abrirá una ventana donde debes elegir:
   - **Fecha de inicio del ciclo:** El primer día en que arranca tu rotación (ej. el día `01` del mes).
   - **Cantidad de días a generar:** Por ejemplo, `18` o `30` días.
   - **Patrón de rotación:**
     - `2x2x2` *(2 Días · 2 Noches · 2 Descansos)*
     - `4x2` *(2 Diurnos · 2 Nocturnos · 2 Descansos)*
     - `6x1` *(6 Días de 8h · 1 Descanso)*
     - `Diurno Fijo` o `Nocturno Fijo`
   - **Puesto de Guardia:** Selecciona tu puesto asignado.
3. Haz clic en **"Aplicar programación en el calendario"**. Todos los días del mes aparecerán creados automáticamente en la tabla inferior.

> `[INSERTAR CAPTURA DE PANTALLA AQUÍ: Ventana o formulario de Generación Automática de Ciclo 2x2x2]`

---

### 4.3. Módulo 1: Editar un Turno, Anotar Compañero de Relevo o Minuta
Si necesitas agregar quién te recibió el puesto o dejar una nota importante:

1. Baja hasta la tabla **"Detalle de Turnos del Mes"**.
2. Busca el día que quieres modificar y haz clic en el botón **"Editar"**.
3. En el formulario **"Registro Detallado / Edición de Turno"** podrás cambiar o completar:
   - **Tipo de turno** y **Horario de entrada/salida**.
   - **Compañero que recibe / entrega relevo** (ej. *"Carlos Ramírez"*).
   - **Minuta u Observaciones del turno** (ej. *"Se entrega puesto sin novedad, cámaras operativas"*).
4. Haz clic en **"Guardar Turno en mi Calendario"**.
5. Si te equivocaste de fecha y deseas quitar ese registro, haz clic en el botón rojo **"Eliminar"** al lado del turno.

> `[INSERTAR CAPTURA DE PANTALLA AQUÍ: Tabla mensual de turnos y formulario de edición con campo de Relevante y Minuta]`

---

### 4.4. Módulo 2: Control de Vacaciones (`2. Mis Vacaciones`)
En este módulo puedes verificar en cualquier momento cuántos días de vacaciones te corresponden por ley:

1. Haz clic en la pestaña **🏖️ 2. Mis Vacaciones**.
2. En la parte superior verás **4 tarjetas de resumen**:
   - **Fecha de Ingreso y Antigüedad:** Desde qué día trabajas en la empresa.
   - **Total Días Causados:** Cuántos días hábiles de vacaciones has ganado en total (15 días por año).
   - **Días Disfrutados:** Los días que ya saliste a vacaciones en años pasados.
   - **Saldo Pendiente por Disfrutar:** Los días hábiles que la empresa te debe hoy.
3. En la tabla **"Desglose por Periodo Anual Causado"** verás año por año qué periodos ya están **Completos**, cuáles están **Parciales** y cuáles siguen **Pendientes**.
4. **Para registrar nuevas vacaciones:**
   - Completa el formulario **"Registrar Periodo de Vacaciones"** indicando el periodo (ej. `2025-2026`), la **Fecha de inicio**, la **Fecha de regreso/fin** y los **Días hábiles**.
   - Si dejas marcada la casilla *"Marcar automáticamente estos días como Vacaciones en el calendario de turnos"*, la aplicación anotará esos días en tu calendario de turnos por ti.
   - Haz clic en **"Guardar Periodo de Vacaciones"**.

> `[INSERTAR CAPTURA DE PANTALLA AQUÍ: Pestaña "2. Mis Vacaciones" mostrando las 4 tarjetas de saldo, el desglose anual y el formulario de registro]`

---

### 4.5. Módulo 3: Copias de Seguridad (`3. Respaldo y Ajustes`)
Para guardar tus datos en un archivo seguro dentro de tu computador o memoria USB:

1. Haz clic en la pestaña **💾 3. Respaldo y Ajustes**.
2. Haz clic en el botón **"Generar y descargar copia de seguridad cifrada"**.
3. El programa creará un archivo de respaldo local (con extensión `.enc.json`) y lo mostrará en la lista de **"Copias de Seguridad Disponibles"**, además de descargarlo a tu carpeta de Descargas.
4. **¿Cómo recuperar tus datos?** Si algún día deseas volver a un estado anterior, simplemente busca la copia en la lista y haz clic en **"Restaurar esta copia"**.

> `[INSERTAR CAPTURA DE PANTALLA AQUÍ: Pestaña "3. Respaldo y Ajustes" con el botón de generar copia y el listado de respaldos disponibles]`

---

### 4.6. Módulo 4: Mesa de Ayuda / Reporte de Novedades (`4. Soporte / Novedades`)
Si tienes una duda con tu liquidación de festivos o deseas dejar constancia de un error en la programación:

1. Entra a la pestaña **🛟 4. Soporte / Novedades**.
2. Elige la **Categoría** (*Error en turno*, *Duda de vacaciones*, *Sugerencia* o *Soporte técnico*).
3. Escribe un **Asunto** corto y la **Descripción detallada** del caso.
4. Haz clic en **"Enviar Ticket de Novedad"**. Quedará registrado con fecha, hora y estado de seguimiento.

> `[INSERTAR CAPTURA DE PANTALLA AQUÍ: Pestaña "4. Soporte / Novedades" con el formulario de creación de tickets y el historial]`

---

## 5. Preguntas Frecuentes (FAQ) y Solución de Problemas Comunes

### ❓ 1. Hice doble clic en la aplicación y no se abrió o apareció un aviso de seguridad de Windows. ¿Qué hago?
- **Solución:** Si Windows muestra la pantalla azul de *SmartScreen*, haz clic en **"Más información"** y luego en **"Ejecutar de todas formas"**. Si el navegador no se abrió solo, abre Google Chrome o Microsoft Edge y escribe en la barra de direcciones: `http://127.0.0.1:3000`.

### ❓ 2. Aparece un mensaje rojo diciendo que "La fecha de fin no puede ser anterior a la fecha de inicio" o un error de validación.
- **Solución:** La aplicación protege tus datos para evitar errores de digitación. Revisa el campo resaltado:
  - Las fechas deben ser válidas (en vacaciones, el día en que terminan debe ser igual o posterior al día en que empiezan).
  - Los campos de texto obligatorios (como el asunto de un ticket) deben tener al menos 3 letras.
  - Tus datos escritos **no se borran** cuando ocurre un aviso; solo corrige el dato señalado y vuelve a pulsar el botón de guardar.

### ❓ 3. ¿Si se cierra la ventana por accidente o se va la luz, pierdo los turnos que ya había anotado?
- **Solución:** **No se pierde nada.** Cada vez que tocas un botón de turno o guardas un formulario, la información queda grabada inmediatamente en el almacenamiento local del equipo. Al volver a abrir la aplicación, todos tus turnos y vacaciones seguirán exactamente donde los dejaste.

### ❓ 4. Anoté un turno equivocado en una fecha que ya tenía registro. ¿Se duplica el día?
- **Solución:** No. El sistema solo permite un registro por cada día del calendario. Si vuelves a marcar un turno sobre la misma fecha, la aplicación **actualiza automáticamente** ese día con el nuevo turno que elegiste sin duplicar datos.

### ❓ 5. ¿Cómo paso toda mi información si compro otro computador?
- **Solución:** En el computador antiguo, entra a **3. Respaldo y Ajustes** y genera una copia de seguridad. Copia el archivo guardado en la carpeta `backups/` a una memoria USB, llévalo al computador nuevo en la misma carpeta `backups/` y pulsa **"Restaurar esta copia"**.
