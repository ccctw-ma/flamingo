# Flamingo Privacy Policy

Last updated: 2026-06-10

Flamingo is a Chrome extension for creating and applying user-defined Chrome Declarative Net Request rules. These rules can redirect requests, block requests, and modify request or response headers.

Flamingo does not sell user data, does not use analytics or advertising SDKs, and does not send rules, browsing activity, or preferences to the developer's servers.

## Data Flamingo Handles

Flamingo handles only data that you create or configure inside the extension:

- Rule names.
- Declarative Net Request rule conditions, such as URL filters, regex filters, domains, resource types, and HTTP methods.
- Rule actions, such as redirects, block actions, mock responses, and request or response header modifications.
- Extension preferences, such as language, popup size, rule engine enabled state, and storage mode.
- Optional AI assistant settings, such as provider, selected model, enabled state, and provider-specific API keys.

Because rules are user-defined, they may contain URLs, domains, header names, header values, or mock response content that you enter.

## Website Content and Request Processing

Flamingo requests host access for `http://*/*` and `https://*/*` so user-created rules can match normal web requests. Chrome applies enabled Declarative Net Request rules locally in the browser.

For user-created mock rules, Flamingo may evaluate request URLs in the page locally in order to return the configured mock response. Flamingo does not create a browsing history, does not analyze page content for profiling, and does not transmit this information to the developer.

## How Data Is Used

Flamingo uses this data only to provide its single purpose: managing and applying your local Chrome Declarative Net Request rules.

The extension uses Chrome's `declarativeNetRequest` API to apply enabled rules in the browser. Flamingo does not use your rules for advertising, analytics, tracking, profiling, creditworthiness, or any unrelated purpose.

If you explicitly enable the optional AI assistant and click "AI Generate Rule", Flamingo sends your natural-language prompt and the current rule context to the AI provider that you configured. The AI response is used only to create a disabled rule draft for your review.

## Storage

By default, Flamingo stores rules and preferences in `chrome.storage.local` on your current browser profile.

If you choose the Chrome Sync storage mode in Settings, Flamingo copies your rules and key preferences to `chrome.storage.sync` so Chrome can synchronize them across browsers where you are signed in with the same Chrome account.

AI assistant settings, including API keys, are always stored in `chrome.storage.local` and are not copied to Chrome Sync by Flamingo.

## Sharing and Third Parties

Flamingo does not send your rules, browsing activity, or preferences to the developer's servers.

Flamingo does not sell, rent, or share your data with advertisers, analytics providers, data brokers, or other third parties.

If you enable Chrome Sync storage mode, synchronization is handled by Google Chrome through Chrome's built-in sync infrastructure. Flamingo does not control Google's Chrome Sync service.

If you enable the optional AI assistant, requests are sent directly from the extension to the selected AI provider's built-in official endpoint, using the provider-specific API key that you provide. Flamingo does not proxy those requests through the developer's servers.

## Network Requests

Flamingo does not make external network requests to collect, transmit, or analyze user data by default.

The optional AI assistant makes external network requests only after you enable it and click "AI Generate Rule". Those requests go to the selected AI provider and may include your prompt, current rule context, and the API key needed to authorize the provider request.

The network changes performed by Flamingo are the user-defined Declarative Net Request rules that you create and enable.

## Permissions

Flamingo requests these permissions:

- `storage`: Saves your rules and preferences locally or through Chrome Sync, depending on your selected storage mode.
- `declarativeNetRequest`: Applies enabled request rules in Chrome.
- `declarativeNetRequestWithHostAccess`: Allows user-defined rules to run on the sites covered by host permissions.
- Host permissions for `http://*/*` and `https://*/*`: Allows user-created rules to match regular web requests. Rules are applied only when you create and enable them.

Flamingo does not request the `tabs` permission and does not read your tab list or tab URLs.

## Data Retention and Deletion

Your data remains in Chrome storage until you delete it.

You can delete rules from the extension UI. You can also remove all stored extension data by uninstalling Flamingo or clearing the extension's storage from Chrome.

## Contact

For privacy questions, contact: mashichen1999@gmail.com
