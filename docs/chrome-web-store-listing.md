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

Flamingo stores the rules and preferences you create in Chrome storage. Your rules may contain URLs, domains, header names, or header values that you enter.

By default, data is stored locally in `chrome.storage.local`. If you choose Chrome Sync storage mode in Settings, Flamingo stores rules and key preferences in `chrome.storage.sync` so Chrome can synchronize them through your Chrome account.

Flamingo does not send your rules, browsing activity, or preferences to the developer's servers. Flamingo does not sell or share data with advertisers, analytics providers, data brokers, or other third parties.

## Privacy Policy URL

Set the Chrome Web Store privacy policy field to:

https://github.com/ccctw-ma/flamingo/blob/main/docs/privacy-policy.md

Do not put the privacy policy only in the description. It must be configured in the dedicated privacy policy field in the Chrome Web Store Developer Dashboard.

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
