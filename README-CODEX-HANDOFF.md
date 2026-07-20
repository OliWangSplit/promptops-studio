# PromptOps Studio — Codex Handoff

本文档用于在新的 Codex 对话中继续开发。项目基于开源 Prompt Optimizer 二次开发，当前已完成 Phase 1–4 的 MVP 主体功能与自动化验收。

## 本地环境

- 项目路径：`D:\VCproject\prompt-optimizer`
- 操作系统：Windows
- Node.js：`v22.23.1`
- pnpm：`10.6.1`
- Node 版本管理：nvm-windows
- NVM_HOME：`C:\Users\asus\AppData\Local\nvm`
- NVM_SYMLINK：`C:\nvm4w\nodejs`
- 本地地址：`http://localhost:18181/#/dashboard`

项目要求 Node `^22.0.0`，不要修改 `package.json` 的 Node 约束，也不要长期使用 `--config.engine-strict=false`。

### Windows PATH 注意事项

VS Code 新终端有时会错误优先使用：

```text
C:\Program Files\nodejs\pnpm
```

这会导致找不到旧 Corepack 文件。正确命令应来自：

```text
C:\nvm4w\nodejs\node.exe
C:\nvm4w\nodejs\pnpm.CMD
```

临时修复当前 PowerShell：

```powershell
$env:NVM_HOME = 'C:\Users\asus\AppData\Local\nvm'
$env:NVM_SYMLINK = 'C:\nvm4w\nodejs'
$env:Path = (
  @($env:NVM_HOME, $env:NVM_SYMLINK) +
  @($env:Path -split ';' | Where-Object {
    $_ -and $_.TrimEnd('\') -ine 'C:\Program Files\nodejs' -and
    $_.TrimEnd('\') -ine $env:NVM_HOME.TrimEnd('\') -and
    $_.TrimEnd('\') -ine $env:NVM_SYMLINK.TrimEnd('\')
  })
) -join ';'

node -v
pnpm -v
where.exe node
where.exe pnpm
```

预期 Node 为 `v22.23.1`，项目 pnpm 为 `10.6.1`。

## 启动项目

```powershell
cd D:\VCproject\prompt-optimizer
C:\nvm4w\nodejs\corepack.cmd pnpm dev
```

如果此前的开发或 E2E 服务残留并导致端口、`dist` 目录冲突，先执行：

```powershell
C:\nvm4w\nodejs\corepack.cmd pnpm kill:dev
```

主要路由：

- Dashboard：`http://localhost:18181/#/dashboard`
- Prompt Library：`http://localhost:18181/#/prompts`
- Playground：`http://localhost:18181/#/playground`
- Invocation History：`http://localhost:18181/#/invocations`
- Datasets：`http://localhost:18181/#/datasets`
- Evaluations：`http://localhost:18181/#/evaluations`

后台启动日志可能位于：

```text
D:\VCproject\prompt-optimizer\promptops-dev.log
```

## Phase 1 已完成

- PromptOps Studio 品牌与 SaaS Layout
- Dashboard
- Prompt Library 与 Prompt Detail
- PromptOps 路由、Workspace 和 Prompt 领域模型
- PromptOpsStudioDB
- Workspace、Prompt Repository 和 Dexie 实现
- PromptQueryService
- 幂等种子数据
- Legacy Optimizer 入口
- 英文、简体中文和繁体中文 locale

## Phase 2 已完成

- 完整 Prompt Editor
- System Prompt 和 User Prompt 编辑
- 基础信息、模型配置和输出配置
- `{{variable_name}}` 变量识别、同步和校验
- 创建 Prompt 自动生成 V1.0
- Save Changes
- Save as New Version
- 不可变 PromptVersion 快照
- Version History 和 Version Detail
- Restore as New Version
- Duplicate、Archive 和 Restore
- 未保存修改保护
- Playground Bridge
- Prompt 路由切换重载
- IndexedDB 持久化
- 修复 Vue Proxy 导致的 DataCloneError
- 修复保存后不跳转和按钮不可交互
- Phase 2 浏览器 E2E

## Phase 3 已完成

- 独立 PromptOps Playground
- Prompt 和 PromptVersion 选择
- 六种变量输入：text、textarea、number、boolean、date、select
- Prompt Renderer 与必填/类型/选项校验
- 阻止 `__proto__`、`constructor`、`prototype`
- 渲染 System Prompt 和 User Prompt
- 复用现有 ILLMService、ModelManager 和 Provider Adapter
- 真实模型调用入口与流式 UI 输出
- Invocation 状态：running、succeeded、failed、cancelled
- Latency 和 Time to First Token
- Provider Token usage 标准化
- Token 缺失时明确标记 unavailable
- 本地 Pricing 和 Cost Calculation
- Text、Markdown 和 JSON 输出校验
- 原始输出保留
- 成功和失败 Invocation 持久化
- Invocation History、筛选、分页、Detail 和 Retry
- Clear Invocation History 二次确认
- API Key/错误信息脱敏
- PromptOpsStudioDB version 3 与 modelInvocations 表
- Phase 3 Mock 浏览器 E2E，不调用真实付费 API

## Phase 4 已完成

### Dataset 与持久化

- Dataset Library、Dataset Detail 与 Test Case CRUD
- Search、Tag Filter、Sort、Pagination、Duplicate、Batch Delete
- Archive、Restore 与只读状态
- 安全 JSON Import Preview、Atomic Import 与 JSON Export
- 阻止危险键和非 plain serializable object
- `Dataset`、`DatasetTestCase`、`EvaluationRun`、`EvaluationResult` 领域模型
- 四个 Repository 接口与 Dexie 实现
- `DatasetService`、`DatasetQueryService`、`EvaluationQueryService`
- PromptOpsStudioDB version 4，保留 version 1–3 Schema 和历史数据

### Batch Evaluation Core

- ModelManager config key、provider ID、model ID 三层模型身份
- 已启用模型 DTO 与精确身份校验，不使用模糊回退作为 Evaluation 选择基础
- ILLMService request-level Temperature、Max Tokens 和 JSON Mode 覆盖
- 请求参数不写回持久化模型配置，并发请求相互隔离
- Electron IPC 传递可序列化 options，不序列化 AbortSignal
- Deterministic Evaluator：Contains、Not Contains、Exact Match、JSON、Expected JSON、JSON Field Exists
- JSON Schema Subset：`type`、`required`、`properties`、`items`、`enum`
- 安全 JSON 路径，不使用 `eval`，阻止危险路径
- 有限并发队列，范围 1–10；单 Case 失败不阻止其他 Case
- `BatchEvaluationService` 复用 `PromptInvocationService → ILLMService → Provider Adapter`
- 输入校验失败标记 `skipped`，且不伪造 ModelInvocation
- Provider 调用失败标记 `failed`；调用成功和规则校验通过分别统计
- 持久化 Run 进度、结果、Token、Latency、Cost 和聚合指标
- Token、Cost、Latency unavailable 不按 0 聚合
- Cancel pending、Retry Entire、Retry Failed、Retry Case
- Retry 始终创建新 Run，不覆盖原 Run/Result
- 页面刷新中断恢复，保留已完成结果和 Invocation

### Evaluation UI

- Dataset Detail 的 Run Evaluation 入口
- Prompt、不可变 PromptVersion、enabled model、Case selection 配置
- All Cases、Selected Cases、Tag Filter
- Temperature、Max Tokens、Concurrency 与 Pricing 状态摘要
- `/evaluations` Evaluation History
- `/evaluations/:evaluationRunId` Run Detail 与进度轮询
- Invocation Success Rate、Validation Pass Rate、Latency、Token、Cost、Score 指标
- Result Detail Drawer、逐规则诊断与 Invocation Detail 跳转
- Retry Entire、Retry Failed、Retry Case、Cancel 和 Delete
- Sidebar、Router、英文、简体中文、繁体中文 locale
- Mock Batch E2E 与完整 Phase 4 Acceptance E2E，不调用真实 API

## 数据库

当前数据库：`PromptOpsStudioDB version 4`。

表：

- `workspaces`
- `prompts`
- `promptVersions`
- `modelInvocations`
- `datasets`
- `datasetTestCases`
- `evaluationRuns`
- `evaluationResults`

Invocation 保存变量值、渲染 Prompt、输出、状态、延迟、Token、成本和校验结果；EvaluationRun 保存不可变配置快照，EvaluationResult 保存 Test Case 与规则运行时快照。数据库不保存 API Key、Authorization Header、Provider Secret、内部堆栈、Vue Proxy 或 AbortController。

## 测试状态

已通过：

- `pnpm typecheck:core`
- `pnpm typecheck:ui`
- `pnpm typecheck:web`
- Repository tests：45/45
- Core Gate：21/21
- UI tests：928 passed，1 todo
- Locale parity
- No-Chinese runtime check
- `git diff --check`
- UI Bundle build
- `pnpm build:web`
- Phase 2 E2E
- Phase 3 Mock Invocation E2E
- Dataset E2E
- Phase 4 Mock Batch E2E
- Phase 4 完整 Acceptance E2E

运行浏览器测试：

```powershell
pnpm test:e2e:promptops
pnpm test:e2e:promptops-invocation
pnpm test:e2e:promptops-datasets
pnpm test:e2e:promptops-phase4
pnpm test:e2e:promptops-phase4-acceptance
```

Phase 3 和 Phase 4 E2E 使用 Mock 模型，不消耗真实 API。Phase 4 Acceptance 会创建 6 个 Case，验证 succeeded/failed/skipped、规则失败不等于调用失败、Token/Cost unavailable、Result/Invocation Detail、Retry、中断恢复和 History 持久化。

## 当前真实 OpenAI 调用状态

OpenAI 模型配置页面默认显示 `GPT-5 Mini`，模型 ID 是：

```text
gpt-5-mini
```

旧种子 Prompt 使用：

```text
openai / gpt-4.1-mini
```

目前用户已经填写 OpenAI API Key 并测试连接，OpenAI 返回：

```text
429 You exceeded your current quota
```

这表示 API Key 和网络请求基本有效，但 API Key 所属 OpenAI API Project 没有可用额度或 Billing/Usage Limit 不可用。ChatGPT Plus/Pro 不包含 API 额度。需要在 OpenAI API Platform 配置 Billing/credits，等待几分钟后重新测试。

不要让用户在对话、截图、代码或 Git 中公开 API Key。

## 已知限制和建议后续修复

- 当前仍是单用户 IndexedDB MVP。
- 浏览器端 API Key 不适合公开生产部署。
- Electron IPC 和部分 Provider 没有统一 AbortSignal，因此运行中请求可能无法真正中止。
- Provider 统一接口通常只返回 total tokens；缺少 input/output 时显示 unavailable。
- Pricing 为本地静态配置，不自动更新。
- 浏览器刷新会中断正在运行的 Evaluation；当前通过恢复规则标记中断，不会在后台继续。
- JSON Schema 仅支持明确子集，不是完整 JSON Schema 标准实现。
- Evaluation History 的高级组合筛选和可编辑 Duplicate Configuration 流程仍可增强。
- 旧种子 Prompt 名称不做静默 migration；Evaluation 必须显式选择实际 enabled model config。
- 尚未实现 A/B Experiment、LLM-as-a-Judge、多模型比较、Approval Workflow 和服务端权限审计。

## 工作区状态

Phase 1–4 的改动目前位于工作区中，包含较多未提交文件。不要 reset、checkout 或覆盖现有修改；不要删除用户数据、PromptVersion、ModelInvocation 或 Phase 1–4 功能。执行修改前先运行：

```powershell
git status --short
git diff --check
```

## 新对话建议提示词

在新的 Codex 对话中发送：

```text
请先完整阅读 D:\VCproject\prompt-optimizer\README-CODEX-HANDOFF.md，检查当前仓库实际代码与 git status，然后继续 PromptOps Studio 开发。不要覆盖 Phase 1–4 已完成内容，不要修改历史 PromptVersion、ModelInvocation、EvaluationRun 或 EvaluationResult，不要清空 IndexedDB。下一步先核对未提交改动和实际测试状态，再规划 Phase 4 收尾增强或 Phase 5；不要提前把未实现能力写成完成。修改后运行相关 typecheck、定向测试、locale/runtime、build 和 Mock E2E。
```
