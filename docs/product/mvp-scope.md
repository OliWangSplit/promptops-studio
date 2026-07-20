# MVP 范围

## 范围判断

MVP 的完成标准不是功能数量，而是能否闭合一次 Prompt 质量决策：创建资产、冻结版本、执行模型、用固定 Case 验证、解释失败并保留重试历史。Phase 1–4 已覆盖这一闭环。

| 优先级 | 范围 |
| --- | --- |
| Must Have | Prompt CRUD；动态变量；不可变 PromptVersion；Playground；ModelInvocation；Dataset/Test Case；批量评测；确定性规则；成功/失败/skipped 分离；指标聚合；Retry 新 Run；历史追踪 |
| Should Have | 搜索筛选、归档恢复、JSON 导入导出、有限并发、Cancel pending、刷新中断恢复、错误脱敏、多语言、Mock E2E |
| Could Have | 高级组合筛选、可编辑 Duplicate Configuration、更丰富 JSON Schema、可视化版本对比、导出评测报告 |
| Not in MVP | A/B Experiment、LLM-as-a-Judge、多模型横向比较、Approval Workflow、正式 Release Gate、多人 Workspace、RBAC、服务端审计和生产 Secret 管理 |

## Phase 1–4 为什么构成完整 MVP

1. Phase 1 建立产品壳、Workspace 和 Prompt 资产入口。
2. Phase 2 让 Prompt 的每次关键变化变成不可变、可回溯版本。
3. Phase 3 连接实际模型调用，并沉淀输出、错误和性能证据。
4. Phase 4 用 Dataset 与 Evaluation 把单次调试升级为可复现的批量验收。

这四层共同回答了“测什么版本、用什么输入、发生了什么、是否达标、失败后如何继续”。协作发布能力很重要，但不是验证单用户质量闭环所必需，因而延后。

