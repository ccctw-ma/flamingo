# Chrome Web Store Appeal Notes

Use this when resubmitting or appealing the previous rejection.

## What Was Fixed

The extension metadata has been updated to match the actual product functionality.

- The manifest description now describes the extension as a Chrome Declarative Net Request rule editor.
- The store listing copy should describe only actual functionality: creating, editing, enabling, disabling, duplicating, reordering, redirecting, blocking, and modifying request or response headers through user-created rules.
- Deprecated functionality such as group management and matched-rule history should not be mentioned in the listing or screenshots.
- Screenshots should show the current UI only.

The privacy disclosure has been added and should be configured in the Chrome Web Store Developer Dashboard privacy policy field.

- Privacy policy URL: `https://github.com/ccctw-ma/flamingo/blob/main/docs/privacy-policy.md`
- The privacy policy explains what user-created rule data is stored, how it is used, how Chrome Sync is optional, and that the extension does not send data to developer servers or third parties.

The extension permissions have been reduced to match current functionality.

- Removed `tabs`.
- Removed `declarativeNetRequestFeedback`.
- Removed debug matched-rule listeners from the background service worker.
- Kept only permissions needed for the product's single purpose: `storage`, `declarativeNetRequest`, `declarativeNetRequestWithHostAccess`, and host permissions for user-created request rules.

## Appeal Text

Hello Chrome Web Store Review Team,

I have updated Flamingo to address the previous policy rejection.

For the metadata issue, I updated the extension description and prepared revised store listing copy so it accurately describes the extension's actual functionality. Flamingo is a focused Chrome Declarative Net Request rule editor. It lets users create and apply their own local rules to redirect requests, block requests, or modify request and response headers. It does not provide a proxy server, VPN, traffic tunneling, analytics, ad injection, remote rule service, group management, or matched-rule history. The screenshots and listing text will be updated to show only the current product functionality.

For the privacy policy issue, I added a dedicated privacy policy and will configure it in the Chrome Web Store Developer Dashboard privacy policy field:

https://github.com/ccctw-ma/flamingo/blob/main/docs/privacy-policy.md

The privacy policy explains that Flamingo stores only user-created rules and preferences in Chrome storage. By default this data stays in `chrome.storage.local`; Chrome Sync is optional and used only when the user selects it in Settings. Flamingo does not send rules, browsing activity, or preferences to developer servers, advertisers, analytics providers, data brokers, or other third parties.

I also reduced permissions to match the current feature set. The extension no longer requests `tabs` or `declarativeNetRequestFeedback`, and the background script no longer registers debug matched-rule listeners.

Please review the updated package and listing metadata.
