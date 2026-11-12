# 🚀 MANUAL DE DESPLIEGUE Y PUESTA EN MARCHA
## Proyecto: Gestión Trabajo Papá (`gestion-trabajo-papa`)

**Estándar de Referencia:** ISO/IEC/IEEE 26514 / Runbook Operativo DevOps  
**Versión:** 1.0.0  
**Repositorio Oficial:** [https://github.com/ANDREXZ-21/Gestion-Papa](https://github.com/ANDREXZ-21/Gestion-Papa)  
**Tipo de Distribución:** Paquete Autocontenido / Portable para Windows (`.exe` / `.bat`) y Entorno Local Web  

---

## 1. Requisitos Previos del Entorno de Destino

### 1.1. Especificaciones del Sistema Operativo y Hardware
El sistema **Gestión Trabajo Papá** ha sido diseñado bajo una arquitectura **100% autocontenida**, pensada para ejecutarse en equipos domésticos o computadores de puestos de vigilancia sin requerir infraestructura de servidores dedicados.

| Parámetro | Especificación Requerida |
| :--- | :--- |
| **Sistema Operativo** | Microsoft Windows 10 (versión 1903 o superior) o Windows 11. |
| **Arquitectura** | `x64` (64 bits). |
| **Memoria RAM** | Mínimo `2 GB` (Recomendado `4 GB`). |
| **Espacio Libre en Disco** | Mínimo `150 MB` en disco local o unidad USB externa. |
| **Conectividad de Red** | **No requiere conexión a internet** para operar (funciona en `127.0.0.1` / *localhost*). |
| **Puerto Local por Defecto** | Puerto TCP `3000` (configurable mediante variable `PORT`). |

### 1.2. Confirmación de Cero Dependencias Externas (Sin Motor de BD Externo)
- **Sin Motor de Base de Datos Externo:** El administrador **NO** necesita instalar, configurar ni licenciar motores externos como MySQL, MariaDB, PostgreSQL, SQL Server ni MongoDB.
- **Persistencia Local Integrada:** Toda la información operativa se gestiona en memoria durante la sesión, en el almacenamiento local del cliente (`LocalStorage`), en el archivo embebido autocontenido (`data/gestion_papa.sqlite`) y en archivos locales JSON cifrados (`backups/*.enc.json`).
- **Sin Dependencias NPM de Terceros (`node_modules`):** El proyecto no descarga librerías externas en producción, eliminando fallos de red o incompatibilidades de paquetes durante el despliegue.

---

## 2. Proceso de Compilación y Empaquetado (Build / Release para Windows)

El proyecto soporta dos modalidades de distribución lista para entrega en Windows a partir del código fuente del repositorio en GitHub:

### 2.1. Modalidad A: Empaquetado de Ejecutable Portable Nativo (`.exe` con Node.js SEA)
Utilizando la capacidad nativa **Single Executable Applications (SEA)** de Node.js 22+, el proyecto se empaqueta en un binario portable para Windows (`GestionPapa-Portable.exe`):

```powershell
# 1. Generar la configuración del blob de aplicación (sea-config.json)
node --experimental-sea-config sea-config.json

# 2. Copiar el binario base de Node.js 22 (x64) como ejecutable de destino
Copy-Item (Get-Command node).Source .\GestionPapa-Portable.exe

# 3. Inyectar el blob compilado en el ejecutable portable de Windows
npx postject GestionPapa-Portable.exe NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
```

### 2.2. Modalidad B: Paquete Portable Autocontenido con Lanzador Directo (`Iniciar-GestionPapa.bat`)
Para entornos donde se distribuye la carpeta portable completa (`.zip`) desde la sección **Releases** de GitHub:

### 2.3. Archivos que Componen el Paquete Final de Distribución (`Release v1.0.0`)

```text
GestionPapa-Release-v1.0.0-win-x64/
├── GestionPapa-Portable.exe        # Ejecutable portable (o runtime Node.js 22 embebido)
├── Iniciar-GestionPapa.bat         # Lanzador automático que inicia el sistema y abre el navegador
├── public/                         # Interfaz gráfica (HTML5, CSS3, JS, PWA Manifest y Service Worker)
├── src/                            # Módulos del sistema (auth, turnos, vacaciones, backups, soporte)
├── data/                           # Carpeta de persistencia local (generada automáticamente al iniciar)
├── backups/                        # Carpeta de copias de seguridad locales (.enc.json)
├── .env.example                    # Plantilla de configuración de puerto y clave de cifrado
├── MANUAL_USUARIO.md               # Guía rápida para el usuario final
├── MANUAL_TECNICO.md               # Documentación de arquitectura
└── MANUAL_DESPLIEGUE.md            # Presente guía de instalación y verificación
```

---

## 3. Guía de Instalación y Puesta en Marcha Paso a Paso

Siga estos pasos exactos para desplegar la aplicación en cualquier computador con Windows 10 o Windows 11:

### Paso 1: Descargar la Versión desde GitHub
1. Ingrese al repositorio oficial en GitHub:  
   👉 **[https://github.com/ANDREXZ-21/Gestion-Papa](https://github.com/ANDREXZ-21/Gestion-Papa)**
2. Diríjase a la sección **Releases** (o haga clic en **Code -> Download ZIP** para descargar la rama principal `main`).
3. Descargue el archivo comprimido en su equipo.

### Paso 2: Descomprimir el Paquete en la Ubicación Recomendada
1. Haga clic derecho sobre el archivo `.zip` descargado y seleccione **"Extraer todo..."**.
2. Extraiga el contenido en una ruta de usuario con permisos de lectura y escritura (por ejemplo: `C:\Users\<SuUsuario>\Desktop\Gestion Papa` o `C:\GestionPapa`).

### Paso 3: Inicialización y Primera Ejecución
#### Opción 1 — Ejecución Directa (Versión Portable):
1. Abra la carpeta extraída.
2. Ejecute **`GestionPapa-Portable.exe`** (o haga doble clic en el lanzador).
3. Si Windows muestra el aviso de *Microsoft Defender SmartScreen*, haga clic en **"Más información"** y luego en **"Ejecutar de todas formas"**.
4. El sistema iniciará el servicio local en `http://127.0.0.1:3000` y abrirá automáticamente su navegador predeterminado.

#### Opción 2 — Ejecución desde Consola / Entorno con Node.js 22+:
Si despliega directamente desde el código fuente clonado con Git:
```powershell
# 1. Clonar el repositorio
git clone https://github.com/ANDREXZ-21/Gestion-Papa.git
cd "Gestion-Papa"

# 2. (Opcional) Cargar datos iniciales de demostración
npm run seed

# 3. Iniciar la aplicación
npm start
```
Luego abra su navegador en: **`http://127.0.0.1:3000`**

---

## 4. Configuración Inicial, Rutas y Permisos

### 4.1. Ubicación Recomendada y Permisos de Sistema de Archivos
- **Ubicación recomendada:** Instale o descomprima la carpeta en el directorio del usuario (`C:\Users\<Usuario>\Desktop\Gestion Papa` o `C:\Apps\GestionPapa`).
- **Evitar carpetas restringidas de solo lectura:** **No** ubique la carpeta portable dentro de `C:\Program Files\` sin permisos de escritura, ya que la aplicación necesita crear y actualizar dinámicamente sus archivos locales dentro de las subcarpetas `data/` y `backups/`.
- **No requiere permisos de Administrador:** La aplicación escucha en el puerto de usuario `3000` sobre la interfaz local (`127.0.0.1`), por lo que cualquier cuenta estándar de Windows puede ejecutarla sin privilegios elevados (`UAC`).

### 4.2.Variables de Configuración Opcionales (`.env`)
El sistema funciona inmediatamente sin configuración adicional. Si el administrador desea personalizar el puerto o las rutas locales, puede duplicar el archivo `.env.example` como `.env`:

```ini
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
DB_PATH=./data/gestion_papa.sqlite
BACKUP_DIR=./backups
APP_SECRET=clave-secreta-produccion-personalizada-2026
```

### 4.3. Comportamiento de los Archivos Locales Generados
Durante su funcionamiento normal, la aplicación gestiona automáticamente dos directorios dentro de su propia carpeta:
1. **`./data/`:** Contiene el archivo local autocontenido `gestion_papa.sqlite` (y sus archivos temporales de transacción `-wal` y `-shm` mientras la app está abierta). Se crea automáticamente en el primer arranque si no existe.
2. **`./backups/`:** Almacena las copias de seguridad locales con nombre fechado `backup-papa-YYYY-MM-DDTHH-mm-ss.enc.json` cada vez que el usuario pulsa *"Generar copia de seguridad"* en la interfaz o ejecuta `npm run backup`.

---

## 5. Pruebas de Verificación Post-Despliegue (Checklist de Aceptación)

Una vez desplegada la aplicación en el equipo de destino, ejecute la siguiente lista de comprobación (toma menos de 3 minutos) para certificar que la instalación fue exitosa:

| # | Prueba de Verificación | Acción a Realizar | Resultado Esperado | Estado |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **Verificación de Salud del Servicio (`/api/health`)** | Abrir `http://127.0.0.1:3000/api/health` en el navegador o ejecutar `curl http://127.0.0.1:3000/api/health`. | Respuesta HTTP `200 OK` con JSON `"status": "ok"` y estado de almacenamiento `"connected"`. | [ ] |
| **2** | **Carga de Interfaz Gráfica y Estilos** | Abrir `http://127.0.0.1:3000`. | Se visualiza el encabezado oscuro **Gestión Trabajo Papá**, el indicador *"En línea"* en verde y las 4 pestañas principales sin errores visuales. | [ ] |
| **3** | **Prueba de Marcación Rápida de Turno** | En **1. Mis Turnos**, hacer clic en el botón **☀️ Diurno 12h**. | Aparece notificación verde confirmando el guardado y el turno se refleja en la tabla mensual inferior. | [ ] |
| **4** | **Prueba de Cálculo de Festivos / Compensatorios** | Registrar un turno **Diurno** o **Nocturno** en una fecha que sea domingo o festivo en Colombia. | El registro muestra la etiqueta de festivo/dominical y la tarjeta **Saldo de Compensatorios** incrementa en `+1`. | [ ] |
| **5** | **Prueba de Cálculo de Vacaciones** | Abrir la pestaña **2. Mis Vacaciones**. | Se muestran las 4 tarjetas superiores con la fecha de ingreso, días causados, días disfrutados y saldo pendiente sin errores de cálculo. | [ ] |
| **6** | **Prueba de Generación de Respaldo Local** | Abrir la pestaña **3. Respaldo y Ajustes** y pulsar **"Generar y descargar copia de seguridad cifrada"**. | Se crea un archivo `.enc.json` en la carpeta `backups/` del equipo y aparece listado en pantalla listo para restaurar. | [ ] |
| **7** | **Prueba de Persistencia tras Cierre** | Cerrar completamente la ventana/aplicación y volverla a abrir. | Todos los turnos y registros creados en los pasos anteriores permanecen intactos en pantalla. | [ ] |
