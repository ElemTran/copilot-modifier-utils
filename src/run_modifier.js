const fs = require('fs');
const path = require('path');
const os = require('os');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

const TARGET_KEY = 'x-onbehalf-extension-id';

/**
 * Finds potential paths for VS Code extensions directories.
 * @returns {string[]} An array of potential extensions directory paths.
 */
function getExtensionsPaths() {
    const homeDir = os.homedir();
    const paths = [];
    if (os.platform() === 'win32') {
        paths.push(path.join(homeDir, '.vscode', 'extensions'));
        paths.push(path.join(homeDir, '.vscode-insiders', 'extensions'));
        // Add potential AppData paths if needed, though %USERPROFILE% is usually correct
        // paths.push(path.join(process.env.APPDATA, 'Code', 'User', 'extensions'));
        // paths.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'Microsoft VS Code Insiders', 'resources', 'app', 'extensions'));
    } else { // macOS and Linux
        paths.push(path.join(homeDir, '.vscode', 'extensions'));
        paths.push(path.join(homeDir, '.vscode-insiders', 'extensions'));
        // Add other common paths if necessary (e.g., Flatpak, Snap)
        // paths.push(path.join(homeDir, '.var/app/com.visualstudio.code/config/Code/User/extensions')); // Example for Flatpak
    }
    return paths.filter(p => fs.existsSync(p)); // Return only existing paths
}

/**
 * Finds the extension.js file for GitHub Copilot Chat.
 * @returns {string[]} An array of found extension.js file paths.
 */
function findExtensionFiles() {
    const extensionsPaths = getExtensionsPaths();
    const foundFiles = [];
    const pattern = /^github\.copilot-chat-[\d\.]+$/; // Regex for directory name

    for (const extPath of extensionsPaths) {
        try {
            const entries = fs.readdirSync(extPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && pattern.test(entry.name)) {
                    const extensionJsPath = path.join(extPath, entry.name, 'dist', 'extension.js');
                    if (fs.existsSync(extensionJsPath) && fs.statSync(extensionJsPath).isFile()) {
                        console.log(`找到文件: ${extensionJsPath}`);
                        foundFiles.push(extensionJsPath);
                    }
                }
            }
        } catch (err) {
            console.warn(`访问目录时出错 ${extPath}: ${err.message}`);
        }
    }

    if (foundFiles.length === 0) {
        console.warn("警告：未在任何预期位置找到 github.copilot-chat-*/dist/extension.js 文件。");
    }
    return foundFiles;
}

/**
 * Modifies the extension.js file using AST.
 * @param {string} filePath The path to the extension.js file.
 * @returns {boolean} True if modification was successful or not needed, False otherwise.
 */
function modifyExtensionFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`错误：文件不存在: ${filePath}`);
        return false;
    }

    const backupPath = `${filePath}.bak.${process.pid}`;
    console.log(`创建备份文件: ${backupPath}`);
    try {
        fs.copyFileSync(filePath, backupPath);
    } catch (err) {
        console.error(`错误：创建备份文件失败: ${err.message}`);
        return false;
    }

    let originalContent = '';
    try {
        console.log(`读取文件: ${filePath}`);
        originalContent = fs.readFileSync(backupPath, 'utf8'); // Read from backup for safety

        // --- AST Modification Logic (to be fully integrated) ---
        console.log(`使用 AST 处理文件: ${filePath}`);
        const ast = parser.parse(originalContent, {
            sourceType: 'unambiguous',
            plugins: ['optionalChaining', 'nullishCoalescingOperator'],
            errorRecovery: true
        });

        let modified = false; // Flag to track if changes were made

        traverse(ast, {
            AssignmentExpression(path) {
                const node = path.node;
                if (node.left.type === 'MemberExpression' &&
                    node.left.computed &&
                    node.left.property.type === 'StringLiteral' &&
                    node.left.property.value === TARGET_KEY)
                {
                    if (path.parentPath.isExpressionStatement()) {
                        console.log(`  移除赋值语句在行 ${node.loc?.start.line}`);
                        path.parentPath.remove();
                        modified = true;
                    } else {
                         try {
                            console.log(`  移除赋值表达式在行 ${node.loc?.start.line}`);
                            path.remove();
                            modified = true;
                         } catch (e) {
                             console.warn(`警告: 无法安全移除 AssignmentExpression 在行 ${node.loc?.start.line}. 父节点类型: ${path.parentPath.type}`);
                         }
                    }
                }
            },
            ObjectProperty(path) {
                const node = path.node;
                let keyMatch = false;
                if (node.key.type === 'Identifier' && node.key.name === TARGET_KEY) {
                    keyMatch = true;
                } else if (node.key.type === 'StringLiteral' && node.key.value === TARGET_KEY) {
                    keyMatch = true;
                }

                if (keyMatch) {
                     try {
                        console.log(`  移除对象属性在行 ${node.loc?.start.line}`);
                        path.remove();
                        modified = true;
                     } catch (e) {
                         console.warn(`警告: 无法安全移除 ObjectProperty 在行 ${node.loc?.start.line}.`);
                     }
                }
            }
        });

        if (!modified) {
            console.log(`文件未发生修改: ${filePath}`);
            // Clean up backup if no changes were made
            try {
                fs.unlinkSync(backupPath);
                console.log(`删除未使用的备份文件: ${backupPath}`);
            } catch (unlinkErr) {
                console.warn(`警告：无法删除未使用的备份文件 ${backupPath}: ${unlinkErr.message}`);
            }
            return true; // Success, no changes needed
        }

        // Generate modified code
        const output = generator(ast, { retainLines: false, compact: false, concise: false }, originalContent);
        const modifiedContent = output.code;

        // Write the modified content back to the original file
        console.log(`写入修改后的内容到: ${filePath}`);
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
        console.log(`成功修改文件: ${filePath}`);

        // Modification successful, remove backup
        try {
            fs.unlinkSync(backupPath);
            console.log(`删除备份文件: ${backupPath}`);
        } catch (unlinkErr) {
            console.warn(`警告：无法删除备份文件 ${backupPath}: ${unlinkErr.message}`);
        }
        return true;

    } catch (err) {
        console.error(`修改文件时出错: ${err.message}`);
        console.error(err.stack); // Print stack trace for debugging AST errors
        try {
            if (fs.existsSync(backupPath)) {
                console.log(`从备份恢复: ${backupPath} -> ${filePath}`);
                fs.copyFileSync(backupPath, filePath); // Restore original content
                console.log("文件已从备份恢复");
                fs.unlinkSync(backupPath); // Clean up backup after successful restore
            }
        } catch (backupError) {
            console.error(`!!! 从备份恢复失败: ${backupError.message}`);
            console.error(`!!! 原始文件可能已损坏: ${filePath}`);
            console.error(`!!! 备份文件位于: ${backupPath}`);
        }
        return false;
    }
}

/**
 * Main function to run the modifier.
 * If a file path is provided as a command line argument, it processes only that file.
 * Otherwise, it searches for and processes all found extension files.
 */
function main() {
    const args = process.argv.slice(2); // Get command line arguments, excluding node and script name
    let filesToProcess = [];
    let exitCode = 0; // 0 for success, 1 for failure

    if (args.length > 0) {
        // Process the file provided as an argument
        const targetFile = path.resolve(args[0]); // Ensure absolute path
        if (fs.existsSync(targetFile)) {
            filesToProcess.push(targetFile);
            console.log(`将处理指定的单个文件: ${targetFile}`);
        } else {
            console.error(`错误：指定的测试文件不存在: ${targetFile}`);
            process.exit(1); // Exit with error for testing script
        }
    } else {
        // Search for extension files if no argument is provided
        console.log("开始查找 Copilot Chat extension.js 文件...");
        filesToProcess = findExtensionFiles();
        if (filesToProcess.length === 0) {
            console.log("未找到任何 Copilot Chat extension.js 文件。");
            return; // Exit normally if no files found during search
        }
        console.log(`\n找到 ${filesToProcess.length} 个文件，开始处理...`);
    }


    let successCount = 0;
    let failCount = 0;

    for (const filePath of filesToProcess) {
        console.log(`\n--- 处理文件: ${filePath} ---`);
        if (modifyExtensionFile(filePath)) {
            successCount++;
        } else {
            failCount++;
            console.log(`处理文件失败: ${filePath}`);
        }
        console.log(`--- 完成处理: ${filePath} ---`);
    }

    console.log("\n处理完成。");
    console.log(`成功处理/未修改文件数: ${successCount}`);
    console.log(`处理失败文件数: ${failCount}`);

    // Set exit code based on failures for scripting purposes
    if (failCount > 0) {
        exitCode = 1;
    }
    process.exit(exitCode);
}
// Execute the main function only if the script is run directly
if (require.main === module) {
    main();
}

// Export functions for testing or external use
module.exports = {
    findExtensionFiles,
    modifyExtensionFile,
    getExtensionsPaths // Exporting this might be useful too
};