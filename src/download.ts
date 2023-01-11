import * as path from 'path';
import * as util from './utilities';
import * as fs from 'fs';
import * as url from 'url';
import { https } from 'follow-redirects';
import * as extractZip from 'extract-zip';


// The code here is based on the code from the calva extension

async function fetchFromUrl(fullUrl: string): Promise<string> {
    const q = url.parse(fullUrl);
    return new Promise((resolve, reject) => {
      https
        .get(
          {
            host: q.hostname,
            path: q.pathname,
            port: q.port,
            headers: { 'user-agent': 'node.js' },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk: any) => {
              data += chunk;
            });
            res.on('end', () => {
              resolve(data);
            });
          }
        )
        .on('error', (err: any) => {
          console.error(`Error downloading file from ${url}: ${err.message}`);
          reject(err);
        });
    });
  }
async function getLatestVersion(): Promise<string> {
  try {
    const releasesJSON = await fetchFromUrl(
      'https://api.github.com/repos/saukap/gofer/releases'
    );
    const releases = JSON.parse(releasesJSON);
    return releases[0].tag_name;
  } catch (err) {
    return '';
  }
}

function backupExistingFile(pugPath: string): string {
  const backupDir = path.join(path.dirname(pugPath), 'backup');
  const backupPath = path.join(backupDir, path.basename(pugPath));

  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    console.log('Backing up existing pug to', backupPath);
    fs.renameSync(pugPath, backupPath);
  } catch (e) {
    console.log('Error while backing up existing pug file.', e.message);
  }

  return backupPath;
}

function downloadArtifact(url: string, filePath: string): Promise<void> {
  console.log('Downloading pug from', url);
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          const writeStream = fs.createWriteStream(filePath);
          response
            .on('end', () => {
              writeStream.close();
              console.log('pug artifact downloaded to', filePath);
              resolve();
            })
            .pipe(writeStream);
        } else {
          response.resume(); // Consume response to free up memory
          reject(new Error(response.statusMessage));
        }
      })
      .on('error', reject);
  });
}

function writeVersionFile(extensionPath: string, version: string): void {
  console.log('Writing version file');
  const filePath = util.getVersionFilePath(extensionPath);
  try {
    fs.writeFileSync(filePath, version);
  } catch (e) {
    console.log('Could not write pug version file.', e.message);
  }
}

async function unzipFile(zipFilePath: string, extensionPath: string): Promise<void> {
  console.log('Unzipping file');
  return extractZip(zipFilePath, { dir: extensionPath });
}

async function downloadPug(extensionPath: string, version: string): Promise<string> {
  const artifactName = util.getArtifactDownloadName(process.platform, process.arch);
  const url = `https://github.com/saukap/gofer/releases/download/${version}/${artifactName}`;
  const downloadPath = path.join(extensionPath, artifactName);
  const pugPath = util.getPugPath(extensionPath);
  const backupPath = fs.existsSync(pugPath)
    ? backupExistingFile(pugPath)
    : pugPath;
  try {
    await downloadArtifact(url, downloadPath);
    if (path.extname(downloadPath) === '.zip') {
      await unzipFile(downloadPath, extensionPath);
    }
    if (path.extname(pugPath) === '') {
      fs.chmodSync(pugPath, 0o775);
    }
    writeVersionFile(extensionPath, version);
  } catch (e) {
    console.log('Error downloading pug.', e);
    return backupPath;
  }
  return pugPath;
}

export { downloadPug, getLatestVersion };
