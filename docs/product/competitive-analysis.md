# 竞品分析

> 核验日期：2026-07-21。下表依据产品官方公开文档，只比较文档明确描述的能力；套餐、部署方式和功能可能变化，采购前应重新核验。

## 对比范围

选择 Langfuse 与 Humanloop，是因为它们都覆盖 Prompt、运行证据、Dataset 或 Evaluation，且代表两类参照：开源 LLM 工程/可观测平台，以及偏团队化的 Prompt/Evaluation 产品。

| 维度 | PromptOps Studio（当前 MVP） | Langfuse | Humanloop |
| --- | --- | --- | --- |
| Prompt 管理 | 本地 UI，模板、变量、模型与输出配置 | 官方文档描述集中式 Prompt、动态变量、配置与 SDK 获取 | 官方文档描述 Prompt 模板、模型、参数、工具和调用 API |
| 版本管理 | 不可变 PromptVersion；恢复产生新版本 | 版本、label 与环境部署；Prompt 可关联 trace | Prompt 属性变化形成新 Version |
| Dataset | 本地 CRUD、安全 JSON 导入导出 | Dataset 支持离线实验与评测 | Dataset/Datapoint，且 Dataset Version 不可变 |
| Batch Evaluation | 单版本、多 Case、确定性规则、有限并发 | UI/SDK Experiment，支持 deterministic、LLM judge、人工评价等 | Evaluation 可组合 Dataset、Prompt 版本和 Code/AI/Human Evaluator |
| Trace / Invocation | 本地 ModelInvocation 详情与错误脱敏 | Prompt 可关联 traces，并按版本分析指标 | Prompt 调用产生 Logs，并可用于 Dataset/Evaluation |
| Cost / Latency | 本地 Pricing、Token、Latency、TTFT；缺失显示 unavailable | 可观测与 score analytics 是平台核心范围 | Evaluator 与日志体系可用于 Cost/Latency 评估 |
| Collaboration / Approval | 未实现 | 官方资料显示协作式管理；本表不据此断言完整审批流 | 支持 SME 人工评价；具体审批能力需按版本/套餐核验 |
| Deployment | 浏览器/Electron，本地 IndexedDB | 官方定位为 open-source LLM engineering platform，并提供自托管路径 | 云端产品；官方评测文档也描述 generation/evaluation 的 self-hosted 组合 |
| 目标用户 | 求证单用户 PromptOps 闭环、演示与二次开发 | 需要 tracing、prompt management、evaluation 的 AI engineering 团队 | 需要跨角色 Prompt、Dataset、自动/人工评测的团队 |

## 官方依据

- [Langfuse Prompt Management](https://langfuse.com/docs/prompt-management/overview)：集中管理、版本、部署 label，以及 Prompt 与代码发布解耦。
- [Langfuse Prompt data model](https://langfuse.com/docs/prompt-management/data-model)：Prompt 类型、配置和动态变量。
- [Langfuse linking prompts to traces](https://langfuse.com/docs/prompt-management/features/link-to-traces)：Prompt 版本与 trace、metrics 的关联。
- [Langfuse Evaluation overview](https://langfuse.com/docs/evaluation/overview)：Dataset、Experiment、deterministic evaluator、LLM-as-a-Judge、人工标注和 CI/CD evaluation。
- [Humanloop Prompts](https://humanloop.com/docs/v5/explanation/prompts)：Prompt 字段、变量、调用与版本定义。
- [Humanloop Datasets](https://humanloop.com/docs/v5/explanation/datasets)：Datapoint、不可变 Dataset Version 与 Evaluation 追踪关系。
- [Humanloop Run Evaluation](https://humanloop.com/docs/v5/guides/evals/run-evaluation-ui)：Dataset、Prompt 版本与 Evaluator 组合评测。
- [Humanloop Human Evaluation](https://humanloop.com/docs/guides/evals/run-human-evaluation)：SME 判断、Review 和统计流程。

## 产品机会

成熟平台的差异化在生产 Trace、在线评估、团队协作和多种 Judge；PromptOps Studio 当前不应宣称同等覆盖。其求职 Demo 价值在于把核心模型做得透明：不可变快照、失败语义分离、unavailable 聚合、Retry 新 Run 和本地优先的数据边界。下一阶段若追求真实团队使用，应优先补服务端 Workspace、权限与发布门禁，而非简单堆叠更多规则。

