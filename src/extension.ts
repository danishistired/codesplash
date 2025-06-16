import * as vscode from 'vscode';

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
      vscode.window.showInformationMessage('Send Code button clicked!');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeShare.receiveCode', async () => {
      const input = await vscode.window.showInputBox({
        prompt: 'Enter the code share link'
      });

      if (input) {
        vscode.window.showInformationMessage(`Received link: ${input}`);
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
          background-color:rgb(127, 137, 145);
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
