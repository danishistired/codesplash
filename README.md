# codesplash README

CodeSplash is a Visual Studio Code extension that lets you instantly share your project as a runnable environment. With one click, it zips your code, uploads it to GoFile.io, and generates a shareable link. The recipient can paste the link into the extension to automatically download, unzip, open the folder in VS Code, and install all required dependencies.

No Git, no Drive uploads, no setup instructions — just splash the code and go.

## Features

-> One-click Send Code: zips & uploads your current folder

-> One-click Receive Code: downloads, unzips, opens, and sets up the project

-> Supports automatic setup for:

    - Node.js (npm install)

    - Python (pip install -r requirements.txt)

-> Coming soon: auto-run entry scripts like npm start or python app.py

## Requirements

This extension requires the following to work properly:

- **Node.js**: Ensure you have Node.js installed. You can download it from [Node.js official website](https://nodejs.org/).
- **Python**: If your project uses Python, ensure Python is installed along with `pip`.
- **VS Code**: Make sure you have Visual Studio Code installed.

## Installation

🛠️ Installation

To run this extension locally, follow these steps:

```bash
# Clone this repository
git clone https://github.com/your-username/codesplash.git
cd codesplash

# Install dependencies
npm install

# Open the project in VS Code
code .

# Launch the extension
# Press F5 to open a new Extension Development Host window
```

Open the CodeSplash side panel from the activity bar and try the "Send Code" or "Receive Code" features.

## Extension Settings

This extension contributes the following settings:

- `codesplash.enable`: Enable/disable this extension.
- `codesplash.autoRun`: Automatically run entry scripts like `npm start` or `python app.py` after setup.

## Known Issues

- Some dependency installations might fail if the required tools (e.g., `npm`, `pip`) are not installed or configured correctly.
- Large projects might take longer to zip and upload.

## Release Notes

### 1.0.0

- Initial release of CodeSplash.
- Features:
  - Send Code: Zips and uploads your current folder.
  - Receive Code: Downloads, unzips, opens, and sets up the project.

### 1.1.0

- Added support for auto-running entry scripts like `npm start` or `python app.py`.
- Improved error handling and user feedback.

---

## Following extension guidelines

Ensure that you've read through the extension guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
