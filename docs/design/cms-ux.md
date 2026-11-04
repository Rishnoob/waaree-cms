# CMS experience: design and reasons (2026-11-02)

The CMS was rebuilt because people did not understand it on first look. The bar is Google Keep or Google Pay: open it and you already know what to do.

## What research says
- **Editors fear "Save".** They want to see the real page, not a form. Clear status, with the action buttons next to it, builds confidence. Autosave is the most asked-for feature. (Drupal Admin UX Study, which compared Contentful, Craft, Squarespace and WordPress; evolvingweb.com)
- **Jargon stops people.** Words like "Slug", "Body" and "Description" confused editors in Contentful. A markdown or field-only preview "seemed like a big hurdle".
- **Editing in context wins.** Gutenberg's "instant preview" feel and Craft's live preview were praised. Framer and Webflow moved to on-page editing for the same reason.
- **Make the add button visible.** Squarespace's bare "+" went unnoticed, so ours always carries a label.
- **Simplicity, consistency, clear feedback.** These are the recurring reasons given for Google Keep and Google Pay.

## Our principles
1. **One noun per idea.** The CMS has Pages, Files and People. Pages hold sections. Nothing else needs learning.
2. **One list, filtered.** Pages are one tidy list, like an inbox. Status filters show counts (All, Live, Drafts, Waiting for approval…), with a "Menu item" dropdown and search. The menu itself is a second view, "Website menu": an outline in navbar order where you drag a page to move it. (A card grid was tried first and felt scattered.)
3. **Edit the page itself.** Click any text on the page and type. Click a section to change its picture, button or numbers in the side panel. What you see is what goes live.
4. **Never press Save.** Changes save themselves, and the top bar says "Saved".
5. **One obvious next step.** The editor's top bar has one main button, and its label follows the page's state: *Send for approval*, *Approve and publish*, *Publish*. A sentence beside it says what is happening ("Waiting for approval", "Live on the website").
6. **Plain words.** Live, Draft, Waiting for approval, Needs changes, Goes live 5 Nov. Instead of "URL" we say "web address", shown as `waaree.com/careers`.
7. **Labels, not icon puzzles.** The CMS sections are labelled tabs, not an icon rail.
8. **Bring what you already have.** Drop an Excel sheet, a Word document, pictures or PDFs onto the page and they become sections. Cells copied from Excel paste straight into a table.
9. **Nothing is final.** Undo and redo cover everything, and the phone preview shows the real phone layout before anything goes live.
10. **Data that changes lives in Data, not in pages.** Quarterly results, blog posts and openings are collections; a page shows them with a Data view and stays current by itself. And nothing in Data can be lost by mistake: Trash, archive, hidden fields and full row history.

## The flows
- **Make a page:** "New page" (or "Add a page" on a menu item in "Website menu"). Type a name, pick a look from pictures, and pick where it shows in the menu. The page opens in the editor.
- **Build it:** click text to type. "Add a section" between sections opens a picture gallery of section types. Each section's small toolbar moves, hides or removes it.
- **Get it live:**
  1. The author clicks "Send for approval".
  2. An approver opens it from "Needs your approval" on the home screen and clicks "Approve and publish" (or chooses "Publish later").
  3. If it needs work, the approver uses "Ask for changes" and writes a note, which the author sees at the top of the page.
- **Change a live page:** just edit it. A banner says the live page stays as it is until the changes are approved.
- **Menu:** "Add a menu item" creates a new dropdown in the website menu. Pages go inside by drag-and-drop or the page's settings.
