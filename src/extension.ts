import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import axios from 'axios';
import FormData from 'form-data';
import * as https from 'https';
import * as unzipper from 'unzipper';
import * as child_process from 'child_process';

const GOFILE_API = 'https://upload.gofile.io/uploadFile';
const GOFILE_TOKEN = 'K1YpHcYW2Y2KV9ddChcg3n7z6m2qBPHm';

export function activate(context: vscode.ExtensionContext) {
  const provider = new CodeShareViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('codeShareView', provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeShare.sendCode', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No folder is open.');
        return;
      }

      const folderPath = workspaceFolders[0].uri.fsPath;

      try {
        vscode.window.showInformationMessage('Zipping project...');
        const zipPath = path.join(os.tmpdir(), `project-${Date.now()}.zip`);
        const zip = new AdmZip();
        zip.addLocalFolder(folderPath);
        zip.writeZip(zipPath);

        vscode.window.showInformationMessage('Uploading to GoFile.io...');

        const formData = new FormData();
        formData.append('file', fs.createReadStream(zipPath));
        formData.append('token', GOFILE_TOKEN); 

        const response = await axios.post(GOFILE_API, formData, {
          headers: formData.getHeaders()
        });

        const downloadPage = response.data?.data?.downloadPage;

        if (!downloadPage) {
          vscode.window.showErrorMessage('Upload failed: No link returned.');
          return;
        }

        await vscode.env.clipboard.writeText(downloadPage);
        vscode.window.showInformationMessage('Link copied to clipboard: ' + downloadPage);
        console.log('GoFile download page:', downloadPage);

      } catch (err: any) {
        vscode.window.showErrorMessage('Upload failed: ' + err.message);
        console.error(err);
      }
    })
  );

  context.subscriptions.push(
  vscode.commands.registerCommand('codeShare.receiveCode', async () => {
    const input = await vscode.window.showInputBox({
      prompt: 'Paste the GoFile.io share link (e.g. https://gofile.io/d/xyz)'
    });

    if (!input || !input.includes('/d/')) {
      vscode.window.showErrorMessage('Invalid GoFile link.');
      return;
    }

    try {
      vscode.window.showInformationMessage('Fetching download info...');

      // Step 1: Extract content ID from URL
      const contentId = input.split('/d/')[1];
      const apiUrl = `https://api.gofile.io/contents/${contentId}`;

      const response = await axios.get(apiUrl);
      const contents = response.data?.data?.contents;

      if (!contents || Object.keys(contents).length === 0) {
        vscode.window.showErrorMessage('No downloadable content found.');
        return;
      }

      const firstFile = Object.values(contents as Record<string, { link: string }>)[0];
const directLink = firstFile?.link;

      if (!directLink) {
        vscode.window.showErrorMessage('Could not get direct download URL.');
        return;
      }

      vscode.window.showInformationMessage('Downloading code...');

      // Step 2: Download zip
      const tmpZipPath = path.join(os.tmpdir(), `codesplash-${Date.now()}.zip`);
      const writer = fs.createWriteStream(tmpZipPath);
      const download = await axios.get(directLink, { responseType: 'stream' });

      await new Promise<void>((resolve, reject) => {
        download.data.pipe(writer);
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });

      // Step 3: Unzip to temp folder
      const extractDir = path.join(os.tmpdir(), `codesplash-${Date.now()}`);
      await fs.promises.mkdir(extractDir, { recursive: true });

      await fs.createReadStream(tmpZipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();

      // Step 4: Open folder in new VS Code window
      await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(extractDir), true);

      // Step 5: Detect and install dependencies (after delay)
      setTimeout(() => {
        const hasNode = fs.existsSync(path.join(extractDir, 'package.json'));
        const hasPython = fs.existsSync(path.join(extractDir, 'requirements.txt'));

        if (hasNode) {
          vscode.window.showInformationMessage('Installing Node.js dependencies...');
          child_process.exec('npm install', { cwd: extractDir });
        } else if (hasPython) {
          vscode.window.showInformationMessage('Installing Python dependencies...');
          child_process.exec('pip install -r requirements.txt', { cwd: extractDir });
        } else {
          vscode.window.showInformationMessage('No recognizable dependency files found.');
        }
      }, 3000);

    } catch (err: any) {
      vscode.window.showErrorMessage('Failed to receive code: ' + err.message);
      console.error(err);
    }
  })
);
}


class CodeShareViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (data.command === 'send') {
        vscode.commands.executeCommand('codeShare.sendCode');
      }
      if (data.command === 'receive') {
        vscode.commands.executeCommand('codeShare.receiveCode');
      }
    });
  }

  private _getHtml(webview: vscode.Webview): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <style>
          body {
            font-family: sans-serif;
            padding: 10px;
          }
          button {
            background-color: rgb(127, 137, 145);
            color: white;
            border: none;
            padding: 8px 13px;
            margin: 5px 0;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            font-size: 11.5px;
          }
          button:hover {
            background-color: #005a9e;
          }
          .description {
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="description">Splash your code to others to set up the environment automatically.</div>
        <button onclick="sendCommand('send')">Send Code</button>
        <button onclick="sendCommand('receive')">Receive Code</button>
        <script>
          const vscode = acquireVsCodeApi();
          function sendCommand(command) {
            vscode.postMessage({ command });
          }
        </script>
      </body>
      </html>
    `;
  }
}

export function deactivate() {}
