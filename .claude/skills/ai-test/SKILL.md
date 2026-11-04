---
name: ai-test
description: Test Waaree CMS flows in a real browser using the Playwright MCP, as a human user would, then save passing flows as Playwright tests. Use after building or changing any screen, block or flow, or when asked to "test it".
---

# AI browser test

## Setup
- Both apps must be running locally (start commands in `waaree-web/README.md` and `waaree-apis/README.md`).
- The browser is driven through the **playwright** MCP server in `WaareeCMS/.mcp.json`.
- Log in with the dev test accounts listed in `CLAUDE.md` ("Seeded roles & test accounts"), one per role. The password is `DEV_SEED_PASSWORD` in `waaree-apis/.env`.

## How to test
1. **Act like a first-time user.** Don't use URLs or knowledge from the code. Find things the way a person would: menu, buttons, Ctrl+K. If you can't find something without reading code, **that's a UX bug**, so report it.
2. Use accessible names and roles to find elements. If an element has no clear label, report it.
3. At each important step, take a screenshot and check the browser console and network tab for errors.
4. Check **both widths**: desktop 1440 px and mobile 360 px (public site); desktop only (CMS).
5. **Check permissions from the other side too.** Repeat key actions as a role that should *not* be allowed, and confirm they're hidden in the UI **and** rejected by the API.

## Core flows (run all after big changes)
1. Login → logout → wrong password message → lockout after repeated failures.
2. Editor: create a page from a template → add, edit, reorder, hide and nest blocks → upload media → preview → submit for approval.
3. Editor tries to approve their own request → must be impossible.
4. Approver: reject with a comment → Editor sees the comment → resubmits → Approver approves → the page is live on the public site.
5. Public site: the page renders correctly at 1440 px and 360 px, and Ctrl+K search finds the page, its PDF and a section.
6. Super Admin: create a role, tick permissions, assign it to a user → that user sees exactly those screens.
7. Menu: reorder, highlight and link to a page → submit → approve → visible on the site.
8. Audit log shows every action above, and the log cannot be edited.

## Report format
| # | Flow / step | Result | Severity (P1–P4) | Screenshot | Notes |
|---|---|---|---|---|---|

Severity: P1 = broken or blocking, P2 = feature wrong, P3 = has a workaround, P4 = cosmetic.

## Make it permanent
Turn each passing flow into a Playwright test in `waaree-web/tests/e2e/<flow>.spec.ts`, using the same role- and label-based locators, so it re-runs in CI.
