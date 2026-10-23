# Google Analytics

The GA4 property and private reports are configured for **EvanMHenry.com**. Stream ID: `G-PDJXZKXXJM`. GitHub Actions variable `GA_MEASUREMENT_ID` stores this public identifier. No GA API key, service account, or analytics database is needed.

Production builds receive `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Collection also requires the exact host `evanmhenry.com` or `www.evanmhenry.com` and an explicit visitor consent grant. Localhost, PR exports and Azure previews do not track. Decline loads no Google tag. Analytics settings can reopen the choice; withdrawal disables Google tracking immediately, cancels project tracking and clears matching GA cookies. Consent is saved in local storage, or in memory when storage is blocked. Advertising storage, user-data consent, personalization and Google Signals stay disabled.

| Event | Meaning |
| --- | --- |
| `page_view` | Google's automatic page-load/history measurement; don't add a manual tag |
| `project_view` | 50% visible for one continuous second in a visible tab; once per route/activation |
| `project_click` | Project image, title, or inline Spade link |
| `social_click` | A social destination link |

Event-scoped custom dimensions: `project_name`, `link_name`, `placement`, `destination_host`. `project_click` is a key event. Automatic outbound events can coexist; don't add them to named click counts. Events use authored labels and hosts, not free text or destination query strings.

After a production change, use a fresh browser profile, decline first and confirm the tag is absent, reopen settings and allow, then inspect GA Realtime/Tag Assistant while viewing and clicking a project. Withdraw consent and confirm events stop. Never remove the host guard to collect test traffic. Run `npm test` for automated consent checks. Reports measure consenting, unblocked visits rather than all HTTP traffic.

The private overview includes users, sessions, views, traffic source/medium, top pages, devices, countries, project engagement and social clicks. Account access stays with Evan; don't grant third-party access or change email preferences as part of a release.
