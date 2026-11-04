# <Module name> module

> Doc template for a **backend module** (`app/modules/<name>/`). Copy it as `<name>.md` inside the module folder and delete these quote lines.

**Folder:** `app/modules/<name>/`
**Route prefix:** `/<name>`
**DB tables:** `<schema>.<table>`, ...

## Purpose
One or two sentences: what this module owns.

## Endpoints
| Method | Path | Permission | Does |
|---|---|---|---|
| GET | `/<name>` | `<name>.view` | Lists ... |

## Permissions defined
| Key | Meaning |
|---|---|
| `<name>.view` | ... |

## Tables
| Table | Purpose | Key columns |
|---|---|---|
| `<schema>.<table>` | ... | ... |

## Business rules
- Rules the service enforces, e.g. "cannot approve own request".

## Depends on / used by
- **Depends on:** `core/...`, other modules' `service.py`.
- **Used by:** frontend features, other modules.

## Audit & workflow
- Which actions write to `audit.logs`, and which go through `workflow.change_requests`.

## Gotchas
- Anything non-obvious.

## Changelog
- YYYY-MM-DD: Created.
