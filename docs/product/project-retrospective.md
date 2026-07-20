# 项目复盘

## 为什么选择 PromptOps

生成式 AI 产品的核心风险逐渐从“能否调用模型”转向“变更后质量是否可解释”。Prompt 是连接业务要求与模型行为的可变资产，因此版本、测试和运行证据比再做一个聊天 UI 更能体现 AI 产品设计能力。

## 如何确定 MVP

用一次发布判断所需的最短证据链反推范围：明确 Prompt 版本 → 固定输入 → 执行模型 → 判断业务规则 → 解释失败 → 重试且保留历史。不能闭环的协作、审批和高级 Judge 延后；影响证据真实性的数据快照、状态语义和 unavailable 处理则列为 Must Have。

## 优先级与延后需求

先做资产与版本，再做单次 Invocation，最后做 Dataset/Evaluation，因为后者依赖前两者的稳定身份。A/B Experiment、LLM-as-a-Judge、多模型比较、Approval、RBAC 和后端任务虽有价值，但会显著扩大成本、权限和异步架构范围，未进入 MVP。

## 关键风险

- 最大技术风险：在 IndexedDB、Vue 响应式对象、Electron IPC 和异步模型调用之间保持快照可序列化、状态一致和请求隔离。
- 最大产品风险：指标看起来完整，却混淆调用成功与业务质量，形成错误上线判断。
- 安全风险：纯浏览器形态可能诱导用户在公开环境存放 API Key，因此 README 明确限制，并将服务端 Secret 管理列入 Roadmap。

## 数据与指标决策

PromptVersion、EvaluationRun 和 EvaluationResult 保存不同层级的不可变证据。聚合时将 skipped、provider failure、rule failure 分开；Token/Cost/Latency 缺失不视为 0。这样牺牲了“所有卡片都有数字”的视觉完整性，但避免了伪精确。

## 如何保证可测试性

Mock Model 通过与真实 Provider 相同的 `ILLMService` 路径返回确定性内容，并能触发延迟、Provider 错误、非法 JSON、规则失败和 Token unavailable。浏览器 E2E 因而可以验证完整页面与持久化链路，而不消耗 API 额度或依赖外部网络。

## 做得好的部分

- 按用户决策链拆分 Phase，而不是按页面堆功能。
- 对不可变快照、Retry 新 Run 和失败语义设置了明确不变量。
- 从一开始保留 Legacy 入口和历史 Schema，降低二次开发破坏面。
- 把 Mock E2E 当成交付能力，而非只验证 happy path。

## 下一次会如何改进

更早定义事件与指标字典；在 UI 开发前先冻结 Run 状态机；为 Demo 数据提供显式、一键且幂等的初始化入口；加入可访问性 selector 规范；Phase 5 开始前先完成服务端/本地边界 ADR，并用真实用户访谈验证团队协作和审批优先级。

