# Chrome Web Store Listing Metadata

Use this content in the Chrome Web Store Developer Dashboard. The metadata must match the extension's actual functionality and screenshots.

## Extension Name

Flamingo

## Short Description

Create local Chrome Declarative Net Request rules to redirect, block, or modify request and response headers.

## Detailed Description

Flamingo is a focused rule editor for Chrome Declarative Net Request.

It lets you create, edit, enable, disable, duplicate, and reorder browser request rules from a compact popup interface. Rules can redirect requests, block requests, or modify request and response headers. Advanced users can switch to the JSON editor to edit the underlying Declarative Net Request rule directly.

Main features:

- Manage standalone Declarative Net Request rules.
- Redirect matching requests.
- Block matching requests.
- Modify request and response headers.
- Enable or disable the rule engine from the popup.
- Store rules locally by default.
- Optionally sync rules through Chrome Sync after selecting Chrome Sync storage mode in Settings.
- Switch the popup language between Chinese and English.

Flamingo does not provide a proxy server, VPN, traffic tunneling, analytics, ad injection, or remote rule service. It only applies rules that you create and enable inside the extension.

## Prominent Privacy Disclosure

Flamingo stores the rules and preferences you create in Chrome storage. Your rules may contain URLs, domains, header names, header values, or mock response content that you enter.

By default, data is stored locally in `chrome.storage.local`. If you choose Chrome Sync storage mode in Settings, Flamingo stores rules and key preferences in `chrome.storage.sync` so Chrome can synchronize them through your Chrome account.

Flamingo requests host access for HTTP and HTTPS sites so user-created rules can match normal web requests. Rule matching and mock response handling happen locally in the browser. Flamingo does not create a browsing history, does not analyze page content for profiling, and does not send your rules, browsing activity, preferences, or mock response data to the developer's servers.

Flamingo does not sell or share data with advertisers, analytics providers, data brokers, or other third parties.

## Privacy Policy URL

Set the Chrome Web Store privacy policy field to:

https://ccctw-ma.github.io/flamingo/privacy-policy.html

Do not use the GitHub repository homepage, a GitHub `blob` page, a private document, or a redirecting landing page. The Chrome Web Store privacy policy field must point directly to the public privacy policy page above.

GitHub Pages must be enabled with **Source: GitHub Actions** before resubmitting. After the Pages workflow runs, open the URL in a normal browser session and confirm that it loads without login.

## Screenshot Checklist

Screenshots should show only actual product functionality:

- Compact rule editor.
- JSON detail editor.
- Settings panel showing language, storage mode, and popup size.

Avoid screenshots or text implying proxy service, VPN service, traffic capture, matched-rule history, group management, or any feature that is no longer present.

Generated assets are stored in `images/`:

- `store_screenshot_compact_1280x800.jpg`
- `store_screenshot_detail_1280x800.jpg`
- `store_screenshot_settings_1280x800.jpg`
- `store_promo_small_440x280.jpg`
- `store_promo_marquee_1400x560.jpg`

Regenerate them with:

```bash
bun run store:assets
```
