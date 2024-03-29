import fs from 'node:fs';
import path from 'node:path';

export interface Args {
  _: string[];
  t?: string;
  template?: string;
  git?: boolean;
}

export function formatArgs(args: Args) {
  [
    ['t', 'template'],
    ['g', 'git'],
  ].forEach(([short, long]) => {
    args[long] = args[long] ?? args[short];
  });

  return args;
}

export function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0;
}

export function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '');
}

export function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

export function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

export function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

export function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}

export function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-');
}

export function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

export function readJson(path: string) {
  if (!fs.existsSync(path)) {
    return;
  }
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(e);
  }
}

export function writeJson(path: string, data: any) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

export function readFile(path: string) {
  if (!fs.existsSync(path)) {
    return '';
  }
  return fs.readFileSync(path, 'utf8');
}

export function writeFile(path: string, data: any) {
  fs.writeFileSync(path, data);
}

export function rmSync(path: string) {
  if (!fs.existsSync(path)) {
    return;
  }
  fs.rmSync(path, { recursive: true, force: true });
}

export function mkdirp(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
