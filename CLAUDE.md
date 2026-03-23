# CLAUDE.md — Effective Football Admin
# Lies diese Datei ZUERST bei jeder Session. Keine Ausnahmen.

## Projekt-Überblick
Admin-Dashboard für Effective Football.
Separates Repo von der Marketing-Website.
Geteilte Supabase-Instanz mit Website.

Repo:       effective-football-admin
Supabase:   [PROJECT_REF] — geteilte Instanz mit Website
Vercel:     effective-football-admin.vercel.app
Live-Ref:   effective.football (base44 App — immer als Referenz nutzen)

## Tech Stack (nicht ändern ohne Rücksprache)
- Next.js 15 App Router, TypeScript strict
- Tailwind CSS mit Custom Design Tokens (siehe unten)
- Supabase (Auth, DB, Realtime, Storage)
- TanStack Query v5 (Server State Management)
- TanStack Table v8 (DataTable)
- Recharts (Charts in Finanz-Modulen)
- @react-pdf/renderer (PDF-Export für Rechnungen)
- react-hook-form + zod (alle Formulare)
- Resend + React Email (Transaktions-E-Mails)
- date-fns (Datumsformatierung, immer de-DE locale)
- Vercel (Deployment, Analytics)

## Design System (VERBINDLICH — nie überschreiben)

### Farben (Light Theme — wie im Original)
```
PRIMARY GREEN:   #22C55E  (Tailwind green-500) — Buttons, aktive Nav-Items, Badges
GREEN DARK:      #16A34A  (green-600) — Hover-States
GREEN LIGHT:     #DCFCE7  (green-100) — aktiver Nav-Hintergrund, Badges bg
GREEN TEXT:      #15803D  (green-700) — Text auf grünem Hintergrund
SIDEBAR BG:      #FFFFFF  (weiß)
SIDEBAR BORDER:  #E5E7EB  (gray-200)
NAV ITEM HOVER:  #F9FAFB  (gray-50)
NAV ITEM ACTIVE: #DCFCE7  (green-100) + Text #15803D
MAIN BG:         #F9FAFB  (gray-50)
CARD BG:         #FFFFFF  (weiß)
CARD BORDER:     #E5E7EB  (gray-200)
HEADER BG:       #FFFFFF
HEADER BORDER:   #E5E7EB
TEXT PRIMARY:    #111827  (gray-900)
TEXT SECONDARY:  #6B7280  (gray-500)
TEXT MUTED:      #9CA3AF  (gray-400)
DANGER:          #EF4444  (red-500)
WARNING:         #F59E0B  (amber-500)
INFO:            #3B82F6  (blue-500)
```

### Tailwind Config Tokens
```typescript
// tailwind.config.ts — diese Keys überall verwenden
colors: {
  'ef-green':      '#22C55E',
  'ef-green-dark': '#16A34A',
  'ef-green-light':'#DCFCE7',
  'ef-green-text': '#15803D',
  'ef-sidebar':    '#FFFFFF',
  'ef-main':       '#F9FAFB',
  'ef-card':       '#FFFFFF',
  'ef-border':     '#E5E7EB',
  'ef-text':       '#111827',
  'ef-muted':      '#6B7280',
}
```

### Typografie
```
Font:       Inter Variable (Google Fonts)
Nav-Labels: 13px, font-weight 500
Page-H1:    24px, font-weight 700, text-gray-900
Section-H2: 18px, font-weight 600
Card-Title: 15px, font-weight 600
Table-Head: 12px, uppercase, letter-spacing 0.05em, text-gray-500
Body:       14px, font-weight 400, text-gray-700
Small:      12px, text-gray-500
```

### Komponenten-Standards
```
Border-Radius:  rounded-lg (8px) für Cards, rounded-md (6px) für Buttons/Inputs
Shadow:         shadow-sm für Cards (0 1px 2px rgba(0,0,0,0.05))
Button Primary: bg-ef-green text-white hover:bg-ef-green-dark, h-9 px-4 rounded-md text-sm font-medium
Button Ghost:   border border-ef-border text-ef-text hover:bg-gray-50
Input:          border border-ef-border rounded-md h-9 px-3 text-sm focus:ring-2 focus:ring-ef-green
Badge Green:    bg-ef-green-light text-ef-green-text text-xs px-2 py-0.5 rounded-full
Badge Gray:     bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full
```

## Verzeichnisstruktur
```
effective-football-admin/
├── CLAUDE.md                          ← diese Datei
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                 ← Sidebar + Header wrapper
│   │   ├── dashboard/page.tsx
│   │   ├── spieler/
│   │   │   ├── page.tsx               ← Liste
│   │   │   ├── [id]/page.tsx          ← Detail
│   │   │   └── neu/page.tsx           ← Erstellen
│   │   ├── trainer/
│   │   ├── benutzer/
│   │   ├── rollen/
│   │   ├── altersgruppen/
│   │   ├── qualifikationen/
│   │   ├── kunden-segmentierung/
│   │   ├── camps/
│   │   ├── training/
│   │   ├── trainings-teilnahmen/
│   │   ├── trainer-einsatzplanung/
│   │   ├── camp-erinnerungen/
│   │   ├── buchungen/
│   │   ├── rechnungen/
│   │   ├── auto-abrechnung/
│   │   ├── gutscheine/
│   │   ├── empfehlungen/
│   │   ├── finanzen/
│   │   ├── finanz-tracking/
│   │   ├── finanz-reporting/
│   │   ├── budget/
│   │   ├── genehmigungen/
│   │   ├── mahnwesen/
│   │   ├── onboarding/
│   │   ├── jobs/
│   │   ├── bewerber/
│   │   ├── hr-landingpage/
│   │   ├── email-vorlagen/
│   │   ├── campaigner/
│   │   ├── automationen/
│   │   ├── feedback/
│   │   ├── linktree/
│   │   ├── vorlagen/
│   │   └── linktree-analytics/
│   └── api/
│       ├── auth/callback/route.ts
│       └── [...weitere API routes]
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                ← Hauptnavigation
│   │   ├── SidebarGroup.tsx           ← kollapsierbare Gruppe
│   │   ├── SidebarItem.tsx            ← einzelner Nav-Link
│   │   └── Header.tsx                 ← Top-Bar mit Suche, Notifications, User
│   ├── ui/
│   │   ├── DataTable.tsx              ← TanStack Table wrapper
│   │   ├── FilterBar.tsx              ← Suche + Filter-Selects
│   │   ├── Modal.tsx                  ← Dialog-Wrapper
│   │   ├── Drawer.tsx                 ← Side-Drawer für Detail/Edit
│   │   ├── ConfirmDialog.tsx          ← Löschen-Bestätigung
│   │   ├── StatCard.tsx               ← KPI-Karte (Zahl + Label + Icon)
│   │   ├── Badge.tsx                  ← Status-Badges
│   │   ├── Avatar.tsx                 ← User-Avatar mit Initialen-Fallback
│   │   ├── PageHeader.tsx             ← H1 + Breadcrumb + Page-CTAs
│   │   ├── EmptyState.tsx             ← Leere Liste Illustration
│   │   └── LoadingSkeleton.tsx        ← Skeleton-Loader
│   └── forms/
│       ├── FormField.tsx              ← Label + Input + Error wrapper
│       └── SearchInput.tsx            ← Debounced Search
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  ← Browser Client
│   │   ├── server.ts                  ← Server Client
│   │   └── middleware.ts              ← Auth Helper
│   ├── hooks/
│   │   ├── useDataTable.ts
│   │   └── useDebounce.ts
│   └── utils/
│       ├── format.ts                  ← Datum, Währung, Telefon
│       └── cn.ts                      ← clsx + tailwind-merge
├── types/
│   └── database.types.ts              ← via supabase gen types
├── middleware.ts                       ← Auth Guard für /admin/*
├── tailwind.config.ts
└── next.config.ts
```

## Routing-Konventionen (nie abweichen)
```
Liste:         /[modul]              → page.tsx
Detail:        /[modul]/[id]         → [id]/page.tsx
Erstellen:     /[modul]/neu          → neu/page.tsx
Einstellungen: /[modul]/einstellungen
```

## Standard-Muster für jedes Modul

### Listenseite enthält IMMER:
- PageHeader (Titel + Breadcrumb + "Neu erstellen" Button)
- StatCards Row (2-4 KPIs)
- FilterBar (Suche + relevante Filter-Selects)
- DataTable (TanStack Table, Pagination, Sort, CSV-Export)
- Echte Supabase-Queries (kein Mock)

### Detailseite enthält IMMER:
- Breadcrumb Navigation
- Edit-Button (öffnet Drawer oder Edit-Mode)
- Delete-Button (mit ConfirmDialog)
- Audit-Log Section am Ende (wer hat wann was geändert)
- Echte Supabase-Queries

### Jede neue Tabelle bekommt SOFORT:
- RLS enabled
- select policy (authentifizierte User / role-based)
- insert/update/delete policy (role-based)

## Rollenmodell
```
super_admin   → alles
admin         → alles außer System-Einstellungen
trainer       → eigene Daten, Spieler-Lesezugriff
staff         → eingeschränkt je Modul
```

## Datums- und Zahlenformate
```typescript
// IMMER so — nie anders
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
format(date, 'dd.MM.yyyy', { locale: de })           // 24.03.2026
format(date, 'dd. MMMM yyyy', { locale: de })         // 24. März 2026
format(date, 'dd.MM.yyyy HH:mm', { locale: de })      // 24.03.2026 14:30

// Währung
new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(299)
// → 299,00 €
```

## Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://admin.effective.football
RESEND_API_KEY=
```

## Wichtige Hinweise
- Server Components by default — 'use client' nur bei Hooks/Events/TanStack Query
- TanStack Query für alle Client-seitigen Datenabrufe
- Supabase Server Client in Server Components + API Routes
- Supabase Browser Client in Client Components (via TanStack Query)
- Nach jedem Schema-Change: `npx supabase gen types typescript --local > types/database.types.ts`
- Commit-Format: `feat(modul): beschreibung` / `fix(modul): beschreibung`
