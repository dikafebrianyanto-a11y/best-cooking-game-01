// main.ts — Warung Cepat entry program (Node 22, stdlib only).
// Copies game/ and screenshots/ from beside this file into the output
// directory and writes dossier.json with buildDossier. It never deletes
// the output directory itself: the grader mounts it, so it only copies
// files into it.

import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(srcDir: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true });
  for (const name of readdirSync(srcDir)) {
    const src = join(srcDir, name);
    const dest = join(destDir, name);
    const stat = statSync(src);
    if (stat.isDirectory()) {
      copyTree(src, dest);
    } else if (stat.isFile()) {
      copyFileSync(src, dest);
    }
  }
}

function main(): void {
  const gameOut = join(OUT, 'game');
  const shotsOut = join(OUT, 'screenshots');
  mkdirSync(gameOut, { recursive: true });
  mkdirSync(shotsOut, { recursive: true });
  copyTree(join(HERE, 'game'), gameOut);
  copyTree(join(HERE, 'screenshots'), shotsOut);
  const dossier = buildDossier(OUT, CAPS);
  writeFileSync(join(OUT, 'dossier.json'), dossier);
}

main();
