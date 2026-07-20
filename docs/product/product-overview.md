# PromptOps Studio 产品介绍

## 一句话定位

PromptOps Studio 是面向 AI 应用团队的 Prompt 生命周期管理与批量评测平台。

## 目标用户与问题

目标用户是 AI 产品经理、Prompt Engineer / AI 应用开发者、AI 测试与运营人员。他们通常用文档、聊天记录和代码维护 Prompt，缺少版本证据、固定测试集、失败诊断和成本观测，难以在上线前形成一致的质量判断。

## 解决方案

产品把 Prompt 从“文本”提升为包含模板、变量、模型配置、不可变版本和运行证据的资产，并用 Dataset 与确定性规则批量验收指定版本。每次 Invocation 和 Evaluation 都可追踪；失败可以诊断和 Retry，Retry 会形成新的 Run，保留原始证据。

```mermaid
flowchart LR
  A[设计 Prompt] --> B[保存版本]
  B --> C[Playground 调试]
  C --> D[Dataset 批量评测]
  D --> E[指标与失败诊断]
  E --> F[Retry / 决策]
```

## 产品价值

- 管理价值：统一 Prompt、变量、配置和版本。
- 质量价值：固定 Case 和规则，让回归结果可复现。
- 效率价值：有限并发批量执行，单 Case 失败不阻塞整体。
- 决策价值：区分调用成功、规则通过、skipped 和 provider failure。
- 成本价值：在供应商返回数据时展示 Token、延迟和成本；不可用值不伪装为 0。

## 当前阶段

Phase 1–4 已构成单用户 IndexedDB MVP：Prompt 管理 → 版本管理 → 模型调用 → Dataset → Batch Evaluation → 诊断与重试。Mock E2E 可在不消耗真实 API 的情况下验收关键状态。

## 下一步

A/B Prompt Experiment、LLM-as-a-Judge、多模型比较、Approval Workflow，以及服务端 Workspace、RBAC、Shared Dataset 和生产 Secret 管理。

