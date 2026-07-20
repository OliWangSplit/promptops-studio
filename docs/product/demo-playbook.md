# PromptOps Studio Demo 操作手册

## 演示前检查

1. 使用 Node 22，执行 `pnpm dev`，打开 `http://localhost:18181/#/dashboard`。
2. 使用独立浏览器 Profile，确保不显示真实 API Key、个人数据或历史客户内容。
3. 自动化验收使用 Mock Model；现场演示若 UI 没有公开 Mock 开关，则使用验收录屏，不要输入真实 Key。
4. 确认内置 `Customer Complaint Response` 存在。种子逻辑仅在 Workspace 和 Prompt 均为空时运行，不覆盖已有数据。
5. 录制前运行 `pnpm test:e2e:promptops-phase4-acceptance`。

## 稳定数据

Prompt：`Customer Complaint Response Demo`。

- System V1.0：`You are a customer support assistant. Be concise.`
- User：`Reply to {{customer_name}} about: {{complaint_content}}`
- V1.1 改动：System 增加 `Acknowledge the issue and do not promise unsupported remedies.`

Dataset：`Customer Complaint Demo Dataset`。

| Case | Variables | Rule / 预期 |
| --- | --- | --- |
| Normal success | `customer_name=Ada`, `complaint_content=normal request` | Contains `mock`；成功且规则通过 |
| Rule validation failure | `Ada`, `MOCK_CONTAINS_FAIL` | Contains `required-never-returned`；调用成功、规则失败 |
| Missing required variable | 仅 `customer_name=Ada` | skipped；不创建 Invocation |
| Token unavailable | `Ada`, `MOCK_TOKEN_UNAVAILABLE` | Contains `mock`；Token/Cost 显示 `—` |

若演示刷新恢复，再加 `MOCK_DELAY` Case；若演示 Provider failure，再加 `MOCK_PROVIDER_FAILURE`。这些控制词只在 E2E Mock 模式生效。

## 阻塞风险与规避

- 真实 API 可能遇到额度、CORS 或网络问题：核心 Demo 使用已通过的 Mock E2E 录制。
- 用旧种子 Prompt 直接改名可能污染个人演示库：创建带 `Demo` 后缀的新 Prompt。
- Dataset 变量名必须与 V1.1 一致，否则 Case 会 skipped。
- 规则失败不是红色 Invocation failure：讲解时明确区分两种状态。
- Token unavailable 会使聚合 Cost 为 `—`，这是正确语义，不是页面故障。
- Retry 后立即确认 URL/Run ID 改变，并回 History 展示来源 Run 仍存在。
- 页面刷新会中断运行中请求，不会后台继续；只在“恢复语义”环节主动展示。

## 自动化映射

- `test:e2e:promptops`：Prompt 创建、V1.0/V1.1、历史与持久化。
- `test:e2e:promptops-invocation`：Playground、Invocation 状态与详情。
- `test:e2e:promptops-datasets`：Dataset CRUD、筛选与导入导出。
- `test:e2e:promptops-phase4-acceptance`：6 个 Case、指标、诊断、Retry 新 Run、刷新恢复和 History。

