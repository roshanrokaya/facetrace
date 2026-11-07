# Face Trace — Design System & Revert Guide

## Premium CSS (applies to ALL pages)

- **File:** `frontend/app/premium.css`
- **Imported by:** `frontend/app/globals.css` (line 1: `@import './premium.css';`)

### To disable premium styling everywhere:
Remove or comment out this line in `frontend/app/globals.css`:
```css
@import './premium.css';
```
Or delete `frontend/app/premium.css` entirely.

## Sidebar redesign

- **File:** `frontend/app/(app)/layout.tsx`
- **Backup:** `frontend/app/(app)/layout.tsx.bak`

### To restore original sidebar:
```bash
cd "/Users/roshanrokaya/Desktop/FACETRACE/frontend/app/(app)"
mv layout.tsx.bak layout.tsx
```

## Dashboard redesign

- **File:** `frontend/app/(app)/dashboard/page.tsx`
- **Backup:** `frontend/app/(app)/dashboard/page.tsx.bak`

### To restore original dashboard:
```bash
cd "/Users/roshanrokaya/Desktop/FACETRACE/frontend/app/(app)/dashboard"
mv page.tsx.bak page.tsx
```

## Design tokens (premium.css)

- Navy: `#10152F` / `#0B1026`
- Electric blue: `#2563EB`
- Purple: `#9333EA`
- Cyan: `#06B6D4`
- Background: gradient mesh over `#EDF1FA → #F3F0FB → #EAF4F9`
- Green: `#10B981` | Orange: `#F59E0B` | Red: `#EF4444`
