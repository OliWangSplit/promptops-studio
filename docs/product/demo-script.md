# 3–5 分钟 Demo 视频脚本

| 时间 | 页面 / 屏幕操作 | 旁白与关键讲解点 |
| --- | --- | --- |
| 0:00–0:25 | Dashboard → Prompt Library | “AI 团队的 Prompt 常散落在文档、聊天和代码中。修改后很难回答版本是否更好、失败发生在哪、成本是否上升。PromptOps Studio 把 Prompt 变成可管理、可评测的产品资产。” |
| 0:25–0:55 | New Prompt；输入客服 System/User Prompt | 创建 `Customer Complaint Response Demo`，展示 `{{customer_name}}` 与 `{{complaint_content}}` 自动识别。强调变量不是演示输入，而是 Prompt 的正式 Schema。 |
| 0:55–1:20 | Save Draft → Detail → Edit | 保存自动形成 V1.0；把 System Prompt 增加“先确认问题，不承诺未支持补偿”，选择 Save as New Version，形成 V1.1。 |
| 1:20–1:35 | Version History | 同屏展示 V1.0/V1.1。“历史版本是不可变快照，恢复也会创建新版本，不覆盖证据。” |
| 1:35–2:05 | Dataset Library → Dataset Detail | 创建客服 Dataset，展示正常、规则失败、缺变量、Token unavailable 四个 Case；说明 Dataset 固定输入，规则固定验收口径。 |
| 2:05–2:30 | Run Evaluation 配置 | 选择 V1.1、Mock Model、All Cases、并发 2，启动批量评测。“Demo 不调用真实 API，但复用同一业务服务路径。” |
| 2:30–3:00 | Evaluation Run Detail | 展示 Invocation Success Rate、Validation Pass Rate、Latency、Token、Cost 和 Score。指出 unavailable 显示 `—`，不会按 0 污染聚合。 |
| 3:00–3:25 | 打开 Rule validation failure Drawer | “这条模型调用成功，但业务规则没通过；调用失败不等于质量失败。”展开逐规则原因，再打开 Invocation Detail 查看渲染 Prompt 与原始输出。 |
| 3:25–3:45 | 返回 Run，点击 Retry Failed 或 Retry Case | 展示跳转到新的 Run ID。“Retry 创建新 Run，旧批次和结果仍保留，因此每次决策都可追踪。” |
| 3:45–4:05 | Evaluation History | 展示来源 Run 与新 Run。“最终价值是 Prompt 可管理、版本可追踪、质量可评估、失败可诊断、成本可观测、结果可复现。” |
| 4:05–4:20 | Roadmap 页面或 README | “下一步是 A/B Experiment、LLM-as-a-Judge、Approval Workflow，以及服务端协作、权限和 Secret 管理。”明确这些尚未实现。 |

## 录制备注

- 使用 1440p 或 1080p，浏览器缩放保持 100%，提前关闭通知。
- 不展示真实 API Key、Authorization Header、个人邮箱或客户数据。
- 如果现场创建数据超时，使用已通过 Acceptance E2E 生成的同结构录屏；不要切换到真实 OpenAI 调用。
- 规则失败 Case 应保持 Invocation 为 succeeded；skipped Case 不应出现伪 Invocation。

