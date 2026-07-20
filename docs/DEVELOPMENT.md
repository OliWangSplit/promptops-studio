# PromptOps Studio 本地开发

## 环境

- Windows
- Node.js `^22.0.0`（本机验证版本 `v22.23.1`）
- pnpm `10.6.1`

不要修改根 `package.json` 的 Node 版本约束，也不要长期绕过 engine 检查。

## Windows PATH

如果终端错误优先使用 `C:\Program Files\nodejs\pnpm`，请确保下列路径优先：

```text
C:\nvm4w\nodejs\node.exe
C:\nvm4w\nodejs\pnpm.CMD
```

当前 PowerShell 可临时修复为：

```powershell
$env:NVM_HOME = 'C:\Users\asus\AppData\Local\nvm'
$env:NVM_SYMLINK = 'C:\nvm4w\nodejs'
$env:Path = (@($env:NVM_HOME, $env:NVM_SYMLINK) + @($env:Path -split ';' | Where-Object {
  $_ -and $_.TrimEnd('\') -ine 'C:\Program Files\nodejs' -and
  $_.TrimEnd('\') -ine $env:NVM_HOME.TrimEnd('\') -and
  $_.TrimEnd('\') -ine $env:NVM_SYMLINK.TrimEnd('\')
})) -join ';'
```

## 启动与清理

```powershell
cd D:\VCproject\prompt-optimizer
C:\nvm4w\nodejs\corepack.cmd pnpm dev
```

如端口或 `dist` 被残留进程占用：

```powershell
C:\nvm4w\nodejs\corepack.cmd pnpm kill:dev
```

不要通过清空 IndexedDB 解决普通开发问题；其中包含用户 Prompt、不可变版本、Invocation 和 Evaluation 历史。

## 验证

README 列出了交付验收命令。Mock E2E 使用 `sessionStorage` 中的测试开关，仅用于自动化环境，不需要真实 API Key。

