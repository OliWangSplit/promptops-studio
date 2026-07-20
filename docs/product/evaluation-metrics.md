# 评测指标体系

| 指标 | 定义 / 计算 | 使用场景 | 限制 |
| --- | --- | --- | --- |
| Invocation Success Rate | `succeeded invocations / attempted invocations` | 判断模型调用链路稳定性 | 不表示输出符合业务规则 |
| Validation Pass Rate | `规则全部通过的成功结果 / 有规则且调用成功的结果` | 判断业务质量门槛 | 受规则覆盖率影响 |
| Rule-level Pass Rate | `通过规则数 / 已执行规则数` | 定位哪类约束最薄弱 | 不同规则重要性当前未加权 |
| Average Latency | 可用成功调用 latency 的均值 | 性能比较与体验评估 | unavailable 不进入分母 |
| Time to First Token | 流式调用首 Token 时间 | 感知响应速度 | 并非所有 Provider 返回 |
| Token Usage | Provider 返回的 input/output/total token | 容量与成本分析 | 缺失维度显示 unavailable，不推测拆分 |
| Cost | 按本地 Pricing 与可用 Token 计算 | 预算粗估和版本比较 | 静态价格可能滞后，不等于账单 |
| Skipped Case Count | 输入或配置校验前置失败的 Case 数 | 发现 Dataset/变量质量问题 | 不计为模型调用失败 |
| Failed Case Count | Provider 调用失败或中断的 Case 数 | 发现链路和配置问题 | 与规则失败分开统计 |
| Score | 当前规则结果的汇总分 | 快速浏览批次质量 | 不能替代逐规则诊断 |

## 统计原则

1. 调用成功不等于规则通过：模型可正常返回但内容不满足业务约束。
2. `unavailable` 不按 0 聚合，否则会虚假拉低 Token、成本或延迟。
3. `skipped` 表示请求未进入 Provider，不应算作模型调用失败，也不应生成伪 Invocation。
4. Provider failure 与 deterministic rule failure 必须分开，前者是链路问题，后者是质量问题。
5. EvaluationRun 保存配置快照，EvaluationResult 保存 Case 与规则快照，确保指标可解释。

## 决策示例

- Success Rate 下降、Validation Pass Rate 稳定：优先排查 Provider、Key、限流或网络。
- Success Rate 稳定、Validation Pass Rate 下降：优先检查 Prompt 版本和规则失败分布。
- Skipped 上升：优先修复变量映射或 Dataset 质量，而不是更换模型。
- 质量相近但 Token/Latency 上升：评估 Prompt 冗余和模型选择；成本仅作本地估算。
