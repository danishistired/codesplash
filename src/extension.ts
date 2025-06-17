import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  const provider = new CodeShareViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'codeShareView',
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeShare.sendCode', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No folder is open.');
        return;
      }

      const folderPath = workspaceFolders[0].uri.fsPath;

      const token = await vscode.window.showInputBox({
        prompt: 'Enter your GitHub personal access token (gist scope)',
        ignoreFocusOut: true,
        password: true
      });

      if (!token) {
        vscode.window.showWarningMessage('GitHub token is required.');
        return;
      }

      try {
        vscode.window.showInformationMessage('Zipping project...');
        const zipPath = path.join(os.tmpdir(), 'code-share-upload.zip');
        const zip = new AdmZip();
        zip.addLocalFolder(folderPath);
        zip.writeZip(zipPath);

        vscode.window.showInformationMessage('Uploading to GitHub Gist...');

        const gistUrl = await uploadZipAsGist(zipPath, token);

        if (gistUrl) {
          await vscode.env.clipboard.writeText(gistUrl);
          vscode.window.showInformationMessage('Link copied to clipboard: ' + gistUrl);
        } else {
          vscode.window.showErrorMessage('Failed to upload to Gist.');
        }
      } catch (err: any) {
        vscode.window.showErrorMessage('Failed to send code: ' + err.message);
        console.error(err);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeShare.receiveCode', async () => {
      const input = await vscode.window.showInputBox({
        prompt: 'Enter the Gist link'
      });

      if (input) {
        vscode.window.showInformationMessage(`Received link: ${input}`);
        // Implementation for receiving code goes here
      }
    })
  );
}

async function uploadZipAsGist(zipPath: string, token: string): Promise<string | null> {
  const fileBuffer = fs.readFileSync(zipPath);
  const contentBase64 = fileBuffer.toString('base64');

  const body = {
    description: "CodeSplash shared project",
    public: false,
    files: {
      "project.zip.base64": {
        content: contentBase64
      }
    }
  };

  const res = await axios.post('https://api.github.com/gists', body, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json'
    }
  });

  return res.data?.html_url || null;
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
