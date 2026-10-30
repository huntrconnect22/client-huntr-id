# MUI theme

Material UI 9 and Emotion now own the application theme. The root provider covers buyer,
vendor, WMS, CRM, budgeting, administration and public/authentication routes.

- `app/shared/theme/createAppTheme.ts`: palette, typography, spacing and component defaults.
- `app/shared/theme/AppThemeProvider.tsx`: MUI providers, baseline, CSS layer order.
- `app/shared/theme/legacyTokens.ts`: aliases for existing `--ui-*` styles, derived from MUI.
- `app/context/ThemeContext.tsx`: saved light/dark/system preference and OS changes.
- `app/shared/ui/`: thin shared controls and surfaces. No business rules belong here.

Use MUI components and `sx` for new UI. MUI 9 system properties belong in `sx`, not
direct DOM props. Import components from their individual package paths.
Buttons use solid fills, a 6px radius and no elevation; cards use an 8px radius.

Existing form fields use MUI `styled` on native inputs/selects/textareas to preserve
refs, file inputs, browser validation, labels, native change events and FormData.
The shared Button preserves the previous native default submit semantics; explicitly
set `type="button"` for actions inside a form. Table adapters render MUI tables and
preserve native `td`/`th` semantics.

Shared dialogs use MUI Dialog (focus trap, Escape, focus restoration and scroll lock).
Toast uses Snackbar/Alert; loading placeholders use Skeleton. The full-page app menu,
topbar and contextual bottom navigation use MUI components.

Tailwind utility classes remain for existing layouts. They are not a second theme:
the old CSS palette has been removed. The layer order is `theme, base, mui, components,
utilities`; keep its declaration before Emotion's insertion point in the document.
SweetAlert confirmation workflows remain in place and share the MUI palette through
the token bridge. Module-specific inline layouts and custom picker dialogs have not
been rewritten into new business flows.

## Validation

```sh
npm run typecheck
npm run build
npm run preview:ui
```

The last command serves `http://127.0.0.1:5175/tests/ui/index.html`, a separate local
component review harness. It uses sample data with no API requests and is not included
in the application's production routes. It exercises form submission, disabled controls,
refs, native selects, dialogs, notifications, tables, theme switching and navigation.
The preview does not watch files; restart it after editing source files.

The one-time JSX migration scripts in `scripts/migrate-mui-*.mjs` change JSX tags only;
they do not rewrite HTML print templates or API/business logic.

References: [MUI installation](https://mui.com/material-ui/getting-started/installation/),
[MUI + Tailwind v4](https://mui.com/material-ui/integrations/tailwindcss/tailwindcss-v4/).
