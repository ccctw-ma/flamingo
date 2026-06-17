# Flamingo 隐私政策

最后更新：2026-06-17

Flamingo 是一个用于创建并应用用户自定义 Chrome Declarative Net Request 规则的 Chrome 扩展。这些规则可以重定向请求、拦截请求、修改请求头或响应头。

Flamingo 不出售用户数据，不使用分析或广告 SDK，也不会把规则、浏览活动或偏好设置发送到开发者服务器。

## Flamingo 处理的数据

Flamingo 只处理用户在扩展中创建或配置的数据：

- 规则名称。
- Declarative Net Request 规则条件，例如 URL 过滤器、正则过滤器、域名、资源类型和 HTTP 方法。
- 规则动作，例如重定向、拦截、Mock 响应以及请求头或响应头修改。
- 扩展偏好设置，例如语言、弹窗尺寸、规则引擎启用状态、存储模式、单一生效模式和上次选中的规则位置。
- 可选 AI 助手设置，例如模型提供方、所选模型、启用状态以及按提供方分别保存的 API Key。

由于规则由用户自行定义，它们可能包含用户输入的 URL、域名、Header 名称、Header 值或 Mock 响应内容。

## 网站内容和请求处理

Flamingo 请求 `http://*/*` 和 `https://*/*` 的 host 权限，是为了让用户创建的规则能够匹配普通网页请求。Chrome 会在浏览器本地应用已启用的 Declarative Net Request 规则。

对于用户创建的 Mock 规则，Flamingo 可能会在页面本地判断请求 URL，以返回用户配置的 Mock 响应。Flamingo 不会创建浏览历史，不会为了画像分析网页内容，也不会把这些信息传输给开发者。

## 数据如何使用

Flamingo 仅使用这些数据来实现其单一用途：管理并应用用户的本地 Chrome Declarative Net Request 规则。

扩展使用 Chrome 的 `declarativeNetRequest` API 在浏览器中应用已启用规则。Flamingo 不会将规则用于广告、分析、追踪、画像、信用评估或任何无关目的。

如果用户明确启用可选 AI 助手并使用 AI 规则生成或编辑功能，Flamingo 会把用户的自然语言需求以及当前规则或组上下文发送给用户选择的 AI 提供方。AI 响应仅用于创建默认禁用的规则草稿，或创建需要用户确认的编辑草稿。

## 存储

默认情况下，Flamingo 会把规则和偏好设置保存在当前浏览器配置文件的 `chrome.storage.local` 中。

如果用户在设置中选择 Chrome 同步存储模式，Flamingo 会把规则和关键偏好设置复制到 `chrome.storage.sync`，以便 Chrome 在用户登录同一 Chrome 账号的浏览器之间同步。

AI 助手设置（包括 API Key）始终保存在 `chrome.storage.local`，Flamingo 不会把它们复制到 Chrome Sync。

## 共享和第三方

Flamingo 不会把规则、浏览活动或偏好设置发送到开发者服务器。

Flamingo 不会向广告商、分析服务商、数据经纪商或其他第三方出售、出租或共享用户数据。

如果启用了 Chrome 同步存储模式，同步由 Google Chrome 通过其内置同步基础设施处理。Flamingo 无法控制 Google 的 Chrome Sync 服务。

如果启用了可选 AI 助手，请求会从扩展直接发送到所选 AI 提供方的内置官方接口地址，并使用用户提供的该提供方 API Key。Flamingo 不会通过开发者服务器代理这些请求。

## 网络请求

默认情况下，Flamingo 不会发起外部网络请求来收集、传输或分析用户数据。

可选 AI 助手只会在用户启用并明确要求 Flamingo 生成或编辑规则后发起外部网络请求。这些请求会发送到用户选择的 AI 提供方，并可能包含用户的需求描述、当前规则或组上下文以及授权该提供方请求所需的 API Key。

Flamingo 执行的网络行为仅限于用户创建并启用的自定义 Declarative Net Request 规则。

## 权限

Flamingo 请求以下权限：

- `storage`：根据用户选择的存储模式，在本地或 Chrome Sync 中保存规则和偏好设置。
- `declarativeNetRequest`：在 Chrome 中应用已启用的请求规则。
- `declarativeNetRequestWithHostAccess`：允许用户创建的规则在 host 权限覆盖的网站上运行。
- `webRequest` 和 `webRequestBlocking`：支持用户配置并启用的规则在本地执行请求头操作和 Mock 响应处理。
- `http://*/*` 和 `https://*/*` 的 host 权限：允许用户创建的规则匹配普通网页请求。只有用户创建并启用规则后，规则才会生效。

Flamingo 不请求 `tabs` 权限，也不会读取用户的标签页列表或标签页 URL。

## 数据保留和删除

用户数据会保留在 Chrome 存储中，直到用户删除。

用户可以在扩展 UI 中删除规则，也可以通过卸载 Flamingo 或清除扩展存储来移除所有已存储的扩展数据。

## 联系方式

如有隐私问题，请联系：mashichen1999@gmail.com
