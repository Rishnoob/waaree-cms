# components/ui/: the design system

Every screen and block is built **only** from these components plus the tokens in `src/styles/tokens.css`. The rules come from [docs/design/design-rules.md](../../../../docs/design/design-rules.md).

Built on **Radix UI** primitives (accessibility: focus, keyboard, ARIA) + **CVA** variants + `cn()` (`@/lib/utils/cn`). Same approach as shadcn/ui; the code is ours.

| File | Component | Key props / notes |
|---|---|---|
| `button.tsx` | `Button` | `variant`: primary · secondary · ghost · danger. `size`: sm · md · lg. **`arrow`** adds Waaree's circle-arrow icon. `loading`. `asChild` to wrap a `<Link>` |
| `icon-button.tsx` | `IconButton` | Round, icon only. **`label` is required** (screen readers + AI testers) |
| `field.tsx` | `Field` | Label + control + hint/error, wires `id`, `aria-describedby` and `aria-invalid` automatically. Wrap every form control in it |
| `input.tsx` | `Input`, `SearchInput`, `Textarea` | Green-bordered controls. `Input icon={…}`. `SearchInput` has a green magnifier and a clear button |
| `select.tsx` | `Select` | `options`, `value`, `onValueChange`, `placeholder` ("All Year"). Green chevron |
| `switch.tsx` | `Switch` | On/off toggle (e.g. "Show this block") |
| `checkbox.tsx` | `Checkbox` | Checkbox + clickable label + optional description. `checked` can be `"indeterminate"` (group "some selected") |
| `table.tsx` | `Table`, `THead`, `TBody`, `Tr`, `Th`, `Td` | Hairline data table with a quiet header and row hover. Scrolls sideways on small screens |
| `tabs.tsx` | `Tabs` | Segmented pill tabs ("Upcoming / Past Events"). `label` required |
| `card.tsx` | `Card`, `CardMedia`, `CardTitle`, `CardDescription`, `CardMeta` | `variant`: default · tint (document cards) · outline. `interactive` for hover lift |
| `badge.tsx` | `Badge` | `tone`: neutral · success · info · warning · danger · brand (gradient "New") |
| `dialog.tsx` | `Dialog` | `open`, `onOpenChange`, `title`, `description`, `footer`. Traps focus; Escape closes |
| `toast.tsx` | `Toaster`, `toast` | `toast.success("…")` / `toast.error("…")`. Toaster is already mounted in `app/providers.tsx` |
| `empty-state.tsx` | `EmptyState` | `icon`, `title`, `description`, `action`: empty screens that teach the next step |
| `skeleton.tsx` | `Skeleton` | Loading placeholder |

## Rules
1. **No hard-coded colors, fonts, radius or shadows** outside `tokens.css`. Use the token utilities (`bg-primary`, `text-body`, `rounded-lg`, `shadow-soft`, …).
2. Missing something? Add it **here first**, then use it.
3. Every interactive element has an accessible name (visible label, `label` prop, or `Field`).
4. Import per file: `import { Button } from "@/components/ui/button"`.
5. Changing a component changes it everywhere. Check the CMS screens that use it before and after.
