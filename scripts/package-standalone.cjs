const fs = require("fs");
const path = require("path");

const root = process.cwd();
const deployDir = path.join(root, ".deploy");
const standaloneDir = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: true });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

if (!fs.existsSync(standaloneDir)) {
  console.error("No se encontro .next/standalone. Ejecuta primero: npm run build:standalone");
  process.exit(1);
}

fs.rmSync(deployDir, { recursive: true, force: true });
ensureDir(deployDir);

copyIfExists(standaloneDir, deployDir);
copyIfExists(staticDir, path.join(deployDir, ".next", "static"));
copyIfExists(publicDir, path.join(deployDir, "public"));

ensureDir(path.join(deployDir, "uploads", "receipts"));
ensureDir(path.join(deployDir, "uploads", "tours"));

const readme = [
  "Despliegue rapido (artefacto standalone)",
  "",
  "1) Configura variables de entorno en el VPS (.env)",
  "2) Desde esta carpeta ejecuta: node server.js",
  "3) Opcional: define PORT=3003 para usar ese puerto",
  "",
  "Notas:",
  "- Este artefacto incluye runtime de Next en modo standalone.",
  "- Si usas Prisma, ejecuta migraciones aparte antes de arrancar.",
].join("\n");

fs.writeFileSync(path.join(deployDir, "README-DEPLOY.txt"), readme, "utf8");

console.log("Artefacto listo en .deploy/");
console.log("Comprime .deploy y subelo al VPS.");
