import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const source = new URL('../assets/src/inspection-proof.png', import.meta.url);
await sharp(fileURLToPath(source)).resize({ width: 1200, withoutEnlargement: true }).avif({ quality: 48, effort: 5 }).toFile(fileURLToPath(new URL('../site/public/assets/inspection-proof.avif', import.meta.url)));
await sharp(fileURLToPath(source)).resize({ width: 720, withoutEnlargement: true }).avif({ quality: 45, effort: 5 }).toFile(fileURLToPath(new URL('../site/public/assets/inspection-proof-720.avif', import.meta.url)));
await sharp(fileURLToPath(source)).resize({ width: 420, withoutEnlargement: true }).avif({ quality: 44, effort: 5 }).toFile(fileURLToPath(new URL('../site/public/assets/inspection-proof-420.avif', import.meta.url)));
const icon = fileURLToPath(new URL('../public/icon/source.svg', import.meta.url));
await Promise.all([16, 32, 48, 128].map((size) => sharp(icon).resize(size, size).png().toFile(fileURLToPath(new URL(`../public/icon/${size}.png`, import.meta.url)))));
console.log('Wrote optimized hero and extension icons.');
