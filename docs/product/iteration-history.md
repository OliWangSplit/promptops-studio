# Phase 1–4 迭代记录

## Phase 1：产品骨架与 Prompt Library

- 用户问题：Prompt 无统一入口，产品仍像单页优化器。
- 产品目标：建立 PromptOps 信息架构与可浏览资产库。
- 核心功能：SaaS Layout、Dashboard、Workspace、Prompt Library/Detail、Repository、Dexie、幂等种子数据和 Legacy 入口。
- 关键决策：新增领域与数据库，不破坏原 Prompt Optimizer 能力；仅空库播种，避免覆盖用户数据。
- 验收方式：路由、查询、Repository、locale 与浏览器流程。
- 遗留问题：仍是单用户本地存储。

## Phase 2：Editor 与不可变版本

- 用户问题：Prompt 修改缺少可追溯依据，历史配置容易被覆盖。
- 产品目标：形成 Draft → Save → Version 的基本治理路径。
- 核心功能：System/User 编辑、变量同步与校验、V1.0、另存 V1.1、历史详情、恢复为新版本、未保存保护、复制/归档。
- 关键决策：工作副本可更新，但历史 PromptVersion 不可变；Restore 同样创建新版本。
- 验收方式：Phase 2 E2E 创建 Prompt、保存 V1.0/V1.1、切换路由并验证刷新持久化。
- 遗留问题：尚无审批与正式发布门禁。

## Phase 3：Playground 与 Invocation Observability

- 用户问题：单次调试与 Prompt 版本、输入、输出和成本证据脱节。
- 产品目标：让每次模型尝试都可解释、可追踪。
- 核心功能：六类变量输入、渲染与校验、流式 UI、调用状态、Latency/TTFT、Token、Cost、输出校验、History/Detail/Retry 和错误脱敏。
- 关键决策：原始输出始终保留；缺失指标显示 unavailable；不持久化 Secret 或内部堆栈。
- 验收方式：核心单测与 Mock Invocation E2E，不调用付费 API。
- 遗留问题：部分 Provider/IPC 无法真正取消运行中请求。

## Phase 4：Dataset 与 Batch Evaluation

- 用户问题：单次 Playground 无法支撑上线前回归、失败归因和批次比较。
- 产品目标：用固定 Dataset 对不可变 PromptVersion 做可复现批量验收。
- 核心功能：Dataset/Test Case CRUD、导入导出、确定性 Evaluator、JSON Schema 子集、有限并发、Run/Result 快照、指标聚合、Cancel、Retry、刷新恢复和 Evaluation UI。
- 关键决策：输入失败为 skipped 且不创建 Invocation；Provider failure 与规则失败分离；单 Case 失败不阻塞批次；Retry 永远创建新 Run；unavailable 不按 0 聚合。
- 验收方式：Dataset E2E、Batch E2E 和 6-Case Acceptance E2E，覆盖 succeeded/failed/skipped、诊断、unavailable、Retry 与恢复。
- 遗留问题：无 LLM Judge、多模型比较、后台任务和服务端协作。

