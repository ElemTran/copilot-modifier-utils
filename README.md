# Copilot Chat Modifier

这是一个 Node.js 脚本，用于查找并修改 VS Code (和 VS Code Insiders) 中的 GitHub Copilot Chat 扩展文件 (`extension.js`)。它使用 AST (抽象语法树) 解析来安全地移除与 `x-onbehalf-extension-id` 相关的代码段，这可能用于某些自定义或绕过特定限制的场景。

**注意:** 修改扩展文件可能违反服务条款，并可能导致扩展行为异常或无法更新。请自行承担风险。

## 功能

*   自动在 Windows, macOS, Linux 的标准 VS Code / VS Code Insiders 扩展目录下查找 `github.copilot-chat-*/dist/extension.js` 文件。
*   使用 `@babel/parser`, `@babel/traverse`, `@babel/generator` 安全地修改 AST，移除以下模式：
    *   `headers["x-onbehalf-extension-id"] = ...;` 形式的赋值语句。
    *   对象属性 `"x-onbehalf-extension-id": ...` (包括各种写法的 key 和 value)。
*   在修改前自动创建备份文件 (`.bak.<pid>`)。
*   如果修改过程中发生错误，尝试从备份恢复原始文件。
*   如果修改成功，自动删除备份文件。

## 安装

1.  确保你已安装 [Node.js](https://nodejs.org/) (建议使用 LTS 版本)。
2.  克隆或下载此仓库。
3.  在项目根目录下打开终端，运行以下命令安装依赖：

    ```bash
    npm install
    ```

## 使用

### 自动查找并修改

直接运行脚本，它会自动查找并处理所有找到的 Copilot Chat `extension.js` 文件：

```bash
node src/run_modifier.js
```

脚本会输出它找到的文件以及处理过程。

### 修改指定文件

如果你知道 `extension.js` 的确切路径，可以将其作为命令行参数传递给脚本：

```bash
node src/run_modifier.js /path/to/your/extension.js
```

## 测试

项目包含使用 Jest 编写的测试套件，以验证核心修改逻辑。

运行测试：

```bash
npm test
```

测试会创建一个临时副本 (`tests/test_extension_for_jest.js`)，对其进行修改，然后使用 AST 分析来验证结果。

## (可选) 打包为可执行文件

如果你想创建一个不需要 Node.js 环境就能运行的独立可执行文件 (例如 `.exe` for Windows)，可以使用 `pkg`。

**推荐步骤:**

1.  **安装 `pkg` :**
    ```bash
    npm install --save-dev pkg
    ```
2.  **配置 `package.json` :**
    我们已经在 `package.json` 中添加了 `pkg` 字段来指定打包目标 (Windows, macOS, Linux) 和输出目录 (`dist/`)，并添加了 `scripts.build` 作为运行打包命令的快捷方式。这是推荐的做法，因为它使打包过程更简单、可重复。
3.  **运行打包:**
    ```bash
    npm run build
    ```
    这会使用 `package.json` 中的配置，在项目根目录下创建一个 `dist/` 文件夹，其中包含为不同操作系统生成的可执行文件 (例如 `copilot-modifier-utils-win.exe`, `copilot-modifier-utils-macos`, `copilot-modifier-utils-linux`)。

**替代方法 (不推荐，但可行):**

你可以跳过在 `package.json` 中配置 `pkg` 和 `scripts.build` 字段，直接在命令行调用 `pkg` 并指定所有参数：

```bash
# 示例：直接调用 pkg，需要手动指定入口、目标和输出路径
npx pkg src/run_modifier.js --targets node18-win-x64,node18-macos-x64,node18-linux-x64 --out-path dist/
```

### 使用可执行文件

将对应你操作系统的可执行文件复制到任意位置。在终端中运行它：

*   **自动查找并修改:**
    ```bash
    ./copilot-modifier-utils-linux  # Linux/macOS 示例
    .\copilot-modifier-utils-win.exe # Windows 示例
    ```
*   **修改指定文件:**
    ```bash
    ./copilot-modifier-utils-linux /path/to/your/extension.js # Linux/macOS 示例
    .\copilot-modifier-utils-win.exe C:\path\to\your\extension.js # Windows 示例
    ```

## 注意事项

*   每次 Copilot Chat 扩展更新后，`extension.js` 文件会被覆盖，你需要重新运行此脚本。
*   脚本依赖于 `@babel` 工具链来解析和生成 JavaScript。如果 `extension.js` 的代码结构发生重大变化，脚本可能需要更新。
*   始终建议在运行脚本前手动备份重要的扩展文件。