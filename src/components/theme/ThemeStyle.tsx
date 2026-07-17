// src/components/theme/ThemeStyle.tsx
//
// CUSTOM-009: renders the OWNER's saved palette as CSS custom properties on
// :root. This is genuinely new infrastructure — it did not exist before,
// and it's what makes "colors stored in the DB" actually reach the browser
// at all instead of just sitting unused in a table.
//
// HONEST SCOPE NOTE (see audit): existing components across the app were
// built with hardcoded hex values in inline `style` props, not with these
// variables. This component makes the variables available platform-wide
// starting now; migrating each existing component to read
// var(--color-primary) etc. instead of its hardcoded hex is a separate,
// larger follow-up pass (Phase 2) — touching dozens of files individually
// is out of scope to do safely in one shot. New components, and the
// customize dashboard itself, should use these variables going forward.
import { getSiteSettings } from "@/lib/site-settings";

export async function ThemeStyle() {
  const s = await getSiteSettings();

  // Inline <style> (not a stylesheet link) so this reflects the current DB
  // values on every server render with zero extra request and no caching
  // to invalidate — the trade-off is a small amount of duplicated markup
  // per page load, which is negligible for ~11 custom properties.
  const css = `:root{
  --color-primary: ${s.primaryColor};
  --color-secondary: ${s.secondaryColor};
  --color-accent: ${s.accentColor};
  --color-background: ${s.backgroundColor};
  --color-surface: ${s.surfaceColor};
  --color-text: ${s.textColor};
  --color-button: ${s.buttonColor};
  --color-hover: ${s.hoverColor};
  --color-success: ${s.successColor};
  --color-warning: ${s.warningColor};
  --color-error: ${s.errorColor};
}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
