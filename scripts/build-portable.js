'use strict';

/**
 * Empaquetador Portable para Windows (Node.js Single Executable Application - SEA)
 * Genera un ejecutable .exe 100% autocontenido en dist/GestionPapa-Portable.exe
 * con todos los módulos backend y recursos estáticos PWA embebidos, configurado
 * bajo subsistema Windows GUI (sin ventana de consola en segundo plano).
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const BUILD_DIR = path.join(ROOT_DIR, 'build');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OUTPUT_EXE = path.join(DIST_DIR, 'GestionPapa-Portable.exe');

function collectJsFiles(dir, baseDir = dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath, baseDir, result);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      result.push({ id: rel, fullPath });
    }
  }
  return result;
}

function collectPublicAssets(dir, baseDir = dir, assets = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectPublicAssets(fullPath, baseDir, assets);
    } else if (entry.isFile()) {
      const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      assets[`public/${rel}`] = fullPath;
    }
  }
  return assets;
}

function createSingleFileBundle(modulesList) {
  const moduleEntries = modulesList.map(({ id, fullPath }) => {
    const code = fs.readFileSync(fullPath, 'utf8');
    return `  ${JSON.stringify(id)}: function(module, exports, require, __filename, __dirname) {\n${code}\n  }`;
  });

  return `'use strict';
const path = require('node:path');
const nativeRequire = require;

const __MODULES__ = {
${moduleEntries.join(',\n')}
};

const __CACHE__ = {};

function normalizeModuleId(fromDir, request) {
  if (!request.startsWith('.')) {
    return null;
  }
  const joined = path.posix.normalize(
    fromDir ? path.posix.join(fromDir, request) : request
  );
  const candidates = [
    joined,
    joined + '.js',
    path.posix.join(joined, 'index.js'),
  ];
  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(__MODULES__, candidate)) {
      return candidate;
    }
  }
  throw new Error('Modulo interno no encontrado en bundle portable: ' + request + ' (desde ' + fromDir + ')');
}

function loadBundledModule(moduleId) {
  if (__CACHE__[moduleId]) {
    return __CACHE__[moduleId].exports;
  }
  const factory = __MODULES__[moduleId];
  if (!factory) {
    throw new Error('Modulo no registrado: ' + moduleId);
  }
  const moduleDir = path.posix.dirname(moduleId) === '.' ? '' : path.posix.dirname(moduleId);
  const moduleObj = { exports: {} };
  __CACHE__[moduleId] = moduleObj;

  function customRequire(request) {
    const resolvedId = normalizeModuleId(moduleDir, request);
    if (resolvedId) {
      return loadBundledModule(resolvedId);
    }
    return nativeRequire(request);
  }

  const execDir = path.dirname(process.execPath);
  const virtualFilename = path.join(execDir, 'src', moduleId);
  const virtualDirname = path.dirname(virtualFilename);

  factory(moduleObj, moduleObj.exports, customRequire, virtualFilename, virtualDirname);
  return moduleObj.exports;
}

const serverEntry = loadBundledModule('server.js');
if (serverEntry && typeof serverEntry.startServer === 'function') {
  serverEntry.startServer();
}
`;
}

function patchWindowsGuiSubsystem(exePath) {
  const fd = fs.openSync(exePath, 'r+');
  try {
    const headerBuf = Buffer.alloc(1024);
    fs.readSync(fd, headerBuf, 0, headerBuf.length, 0);

    const mzSignature = headerBuf.readUInt16LE(0);
    if (mzSignature !== 0x5a4d) {
      throw new Error('El archivo generado no tiene una cabecera MZ válida.');
    }

    const peOffset = headerBuf.readUInt32LE(0x3c);
    const peSignature = headerBuf.toString('ascii', peOffset, peOffset + 4);
    if (peSignature !== 'PE\0\0') {
      throw new Error('El archivo generado no tiene una firma PE válida.');
    }

    const optionalHeaderOffset = peOffset + 24;
    const magic = headerBuf.readUInt16LE(optionalHeaderOffset);
    // 0x20b = PE32+ (64-bit), 0x10b = PE32 (32-bit)
    if (magic !== 0x020b && magic !== 0x010b) {
      throw new Error(`Formato PE Optional Header no reconocido: 0x${magic.toString(16)}`);
    }

    const subsystemOffset = optionalHeaderOffset + 68;
    const currentSubsystem = headerBuf.readUInt16LE(subsystemOffset);

    // Si se ejecuta desde consola con variable KEEP_CONSOLE=1 se mantiene CUI(3),
    // de lo contrario se establece IMAGE_SUBSYSTEM_WINDOWS_GUI (2) para evitar consola en segundo plano.
    const targetSubsystem = process.env.KEEP_CONSOLE === '1' ? 3 : 2;
    const subBuf = Buffer.alloc(2);
    subBuf.writeUInt16LE(targetSubsystem, 0);
    fs.writeSync(fd, subBuf, 0, 2, subsystemOffset);

    // Limpiar entrada de tabla de certificados Authenticode previa (DataDirectory[4] Security)
    // para que Windows no invalide el ejecutable tras modificar el subsistema PE.
    const securityDirOffset =
      magic === 0x020b ? optionalHeaderOffset + 144 : optionalHeaderOffset + 128;
    const zeroSecurityDir = Buffer.alloc(8, 0);
    fs.writeSync(fd, zeroSecurityDir, 0, 8, securityDirOffset);

    return { previousSubsystem: currentSubsystem, newSubsystem: targetSubsystem };
  } finally {
    fs.closeSync(fd);
  }
}

function buildPortableExe() {
  console.log('=== [1/4] Preparando directorios de compilación ===');
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  console.log('=== [2/4] Empaquetando módulos backend y activos estáticos PWA ===');
  const modulesList = collectJsFiles(SRC_DIR);
  const bundleCode = createSingleFileBundle(modulesList);
  const bundlePath = path.join(BUILD_DIR, 'portable-bundle.js');
  fs.writeFileSync(bundlePath, bundleCode, 'utf8');

  const assets = collectPublicAssets(PUBLIC_DIR);
  const seaConfigPath = path.join(BUILD_DIR, 'sea-config.json');
  const seaConfig = {
    main: bundlePath,
    output: OUTPUT_EXE,
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    useCodeCache: false,
    assets,
  };
  fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2), 'utf8');
  console.log(`   - Módulos JS empaquetados: ${modulesList.length}`);
  console.log(`   - Activos PWA embebidos:   ${Object.keys(assets).length}`);

  if (fs.existsSync(OUTPUT_EXE)) {
    try {
      execFileSync('taskkill', ['/F', '/IM', 'GestionPapa-Portable.exe'], { stdio: 'ignore' });
    } catch {
      // Ignorar si no estaba en ejecución
    }
    try {
      fs.unlinkSync(OUTPUT_EXE);
    } catch {
      // Continuar y permitir que --build-sea sobrescriba el archivo de salida
    }
  }

  console.log('=== [3/4] Compilando ejecutable portable con Node.js SEA (--build-sea) ===');
  execFileSync(process.execPath, [`--build-sea=${seaConfigPath}`], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });

  console.log('=== [4/4] Configurando subsistema gráfico Windows GUI (sin consola en segundo plano) ===');
  const patchInfo = patchWindowsGuiSubsystem(OUTPUT_EXE);
  const stat = fs.statSync(OUTPUT_EXE);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);

  console.log(`   - Subsistema PE: ${patchInfo.previousSubsystem} -> ${patchInfo.newSubsystem} (IMAGE_SUBSYSTEM_WINDOWS_GUI)`);
  console.log(`   - Ejecutable generado exitosamente: ${OUTPUT_EXE} (${sizeMb} MB)`);
}

if (require.main === module) {
  buildPortableExe();
}

module.exports = { buildPortableExe };
