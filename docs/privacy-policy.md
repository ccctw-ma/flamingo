# Flamingo Privacy Policy

Last updated: 2026-06-05

Flamingo is a Chrome extension for creating and applying user-defined Chrome Declarative Net Request rules. These rules can redirect requests, block requests, and modify request or response headers.

## Data Flamingo Handles

Flamingo handles only data that you create or configure inside the extension:

- Rule names.
- Declarative Net Request rule conditions, such as URL filters, regex filters, domains, resource types, and HTTP methods.
- Rule actions, such as redirects, block actions, and request or response header modifications.
- Extension preferences, such as language, popup size, rule engine enabled state, and storage mode.

Because rules are user-defined, they may contain URLs, domains, header names, or header values that you enter.

## How Data Is Used

Flamingo uses this data only to provide its single purpose: managing and applying your local Chrome Declarative Net Request rules.

The extension uses Chrome's `declarativeNetRequest` API to apply enabled rules in the browser. Flamingo does not use your rules for advertising, analytics, tracking, profiling, or any unrelated purpose.

## Storage

By default, Flamingo stores rules and preferences in `chrome.storage.local` on your current browser profile.

If you choose the Chrome Sync storage mode in Settings, Flamingo copies your rules and key preferences to `chrome.storage.sync` so Chrome can synchronize them across browsers where you are signed in with the same Chrome account.

## Sharing and Third Parties

Flamingo does not send your rules, browsing activity, or preferences to the developer's servers.

Flamingo does not sell, rent, or share your data with advertisers, analytics providers, data brokers, or other third parties.

If you enable Chrome Sync storage mode, synchronization is handled by Google Chrome through Chrome's built-in sync infrastructure. Flamingo does not control Google's Chrome Sync service.

## Network Requests

Flamingo does not make external network requests to collect, transmit, or analyze user data.

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
