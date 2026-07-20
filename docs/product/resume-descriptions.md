# PromptOps Studio 中英文简历描述

> 数字来自 2026-07-21 本地实际命令结果：45/45 Repository、21/21 Core Gate，以及 5/5 PromptOps Mock E2E。UI 全量套件未在验证窗口内自然退出，因此不沿用交接文档中的旧 UI 数字。

## 中文｜一句话项目介绍

设计并开发 PromptOps Studio，覆盖 Prompt 模板、动态变量、不可变版本、模型调用、测试数据集和批量评测全流程，并建立质量、成本与性能的可追踪指标体系。

## 中文｜AI 产品经理版本

- 从 Prompt 分散、变更不可追踪、上线前缺少回归评测等用户痛点出发，规划 Phase 1–4 MVP，形成“设计—版本—调用—Dataset—评测—诊断—重试”的生命周期闭环。
- 定义 PromptVersion、EvaluationRun 和 EvaluationResult 的不可变快照语义，确保测试输入、配置、规则和结果可复现；将协作审批、A/B 和 LLM Judge 明确延后，控制 MVP 范围。
- 建立 Invocation Success Rate、Validation Pass Rate、规则通过率、Latency、TTFT、Token、Cost、Skipped 与 Failed 指标体系，明确调用成功不等于规则通过，unavailable 不按 0 聚合。
- 设计有限并发、Case 级失败隔离、Cancel、Retry 新 Run、刷新中断恢复和历史追踪，并用成功、规则失败、Provider 失败、skipped 和 unavailable 场景验收。
- 建立覆盖 Phase 1–4 的自动化质量门禁，完成 45/45 Repository、21/21 Core Gate 与 5/5 PromptOps Mock E2E，在不消耗真实模型 API 的情况下验证关键产品状态。

技术关键词：PromptOps、AI Product Management、Prompt Lifecycle、Dataset、LLM Evaluation、Product Metrics、Vue、TypeScript、IndexedDB、Playwright。

## 中文｜软件开发版本

- 基于 Vue、TypeScript、Dexie/IndexedDB 构建本地优先 PromptOps 应用，按 Domain Model、Repository Pattern 和 Application Service 分层实现 Workspace、Prompt、Version、Invocation、Dataset 与 Evaluation 聚合。
- 通过 `ILLMService` 与 Provider Adapter 复用真实模型调用链路，支持请求级参数隔离、流式输出、错误脱敏、Token 标准化、本地 Pricing 和输出校验。
- 实现有限并发 Batch Evaluation、确定性规则与 JSON Schema 子集；区分 skipped、provider failure 和 validation failure，保证单 Case 失败不阻塞批次。
- 使用不可变快照和追加式 Retry 设计保护历史证据；处理 Vue Proxy/DataClone、Electron IPC 可序列化参数和页面刷新中断恢复。
- 构建单元、Repository、类型检查、构建及 Mock Playwright E2E 验收链路；本轮 45/45 Repository、21/21 Core Gate 与 5/5 PromptOps E2E 通过。

技术关键词：Vue 3、TypeScript、Dexie、IndexedDB、Repository Pattern、Domain Model、Electron IPC、Playwright、Vitest、LLM Provider Adapter。

## English | One-line summary

Designed and built PromptOps Studio, a local-first platform covering prompt templates, dynamic variables, immutable versions, model invocations, datasets, batch evaluation, failure diagnosis, and traceable retries.

## English | AI Product Manager version

- Translated fragmented prompt ownership, weak version evidence, and manual regression testing into a four-phase MVP spanning design, versioning, invocation, datasets, evaluation, diagnosis, and retry.
- Defined immutable snapshots for PromptVersion, EvaluationRun, and EvaluationResult so inputs, configuration, rules, and decisions remain reproducible; deliberately deferred approval, A/B testing, and LLM judges.
- Established a metric framework for invocation success, validation pass rate, rule-level pass rate, latency, TTFT, token usage, cost, skipped cases, and provider failures, with explicit unavailable-data semantics.
- Designed bounded concurrency, case-level failure isolation, cancel, append-only retry runs, interruption recovery, and historical traceability; accepted the product against success and multiple failure modes.
- Built a Phase 1–4 quality gate; 45/45 repository checks, 21/21 core-gate tests, and 5/5 PromptOps mock E2E flows passed without consuming paid model APIs.

Keywords: PromptOps, AI Product Management, Prompt Lifecycle, LLM Evaluation, Dataset, Product Metrics, Experimentation, Playwright.

## English | Software Engineer version

- Built a Vue/TypeScript local-first PromptOps application using domain models, repository abstractions, application services, and Dexie/IndexedDB persistence.
- Integrated model execution through `ILLMService` and provider adapters with request-level configuration isolation, streaming output, error redaction, token normalization, local pricing, and output validation.
- Implemented bounded-concurrency batch evaluation with deterministic evaluators and a JSON Schema subset, separating skipped input, provider failure, and rule failure semantics.
- Preserved auditability through immutable snapshots and append-only retry runs while addressing Vue proxy serialization, Electron IPC boundaries, and reload interruption recovery.
- Created unit, repository, type-check, build, and mock Playwright E2E paths spanning versioning, invocations, datasets, batch evaluation, and retry recovery; the latest run passed 45/45 repository checks, 21/21 core-gate tests, and 5/5 PromptOps E2E flows.

Keywords: Vue 3, TypeScript, Dexie, IndexedDB, Domain-Driven Design, Repository Pattern, Electron IPC, Playwright, Vitest, LLM adapters.
