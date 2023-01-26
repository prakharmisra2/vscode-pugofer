import * as path from 'path';
import * as fs from 'fs';
import * as process from 'process';

// The code here is based on the code from the calva extension
const versionFileName = 'pug-version.txt';

const artifacts = {
  darwin: {
    x64: 'pug_macos.zip',
  },
  linux: {
    x64: 'pug_linux.zip',
  },
  win32: {
    x64: 'pug_windows.zip',
  },
};

const preludes = {
  simple: 'pusimple.pre',
  standard: 'pustd.pre',
};

function getArtifactDownloadName(
  platform: string = process.platform,
  arch: string = process.arch
): string {
  return artifacts[platform]?.[arch] ?? 'pug_wasm.zip';
}

function getPugPath(
  extensionPath: string,
  platform: string = process.platform
): string {
  const name = platform === 'win32' ? 'pug.exe' : 'pug';
 
  return path.join(extensionPath, name);
}

function getPreludePath(
  extensionPath: string,
  prelude: string = 'simple'
) :string {
  
  return path.join(extensionPath, preludes[prelude]);
}

function getVersionFilePath(extensionPath: string): string {
  return path.join(extensionPath, versionFileName);
}

function readVersionFile(extensionPath: string): string {
  const filePath = getVersionFilePath(extensionPath);
  try {
    const version = fs.readFileSync(filePath, 'utf8');
    return version;
  } catch (e) {
    console.log('Could not read pug version file.', e.message);
    return '';
  }
}

export { getArtifactDownloadName, getPugPath, getPreludePath, getVersionFilePath, readVersionFile };
