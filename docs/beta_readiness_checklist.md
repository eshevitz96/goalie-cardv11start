# Goalie Card V11 Beta Readiness Checklist

This document tracks the milestones required to release the Goalie Card V11 Beta to the Apple App Store (TestFlight).

## 1. Authentication & Security
- [ ] **Apple Sign-In (Native)**: Enable provider in Supabase and register Callback URL in Apple Developer Portal.
- [ ] **JWT Generation**: Generate and save the Apple Client Secret JWT in Supabase Dashboard.
- [ ] **Auto-Recognition**: Verify "Zero-Effort" entry logic links existing roster emails to Apple/Email accounts instantly.

## 2. Core Experience Polish
- [ ] **Index for GOOD (UX)**: Refactor Index Briefing to be minimalist and insight-driven (Remove titles/scores focus).
- [ ] **Dashboard Stability**: Final sweep for any "Temporal Dead Zone" errors or missing `AnimatePresence` imports.
- [ ] **Coaches Corner**: Ensure protocol recommendations are high-value and helpful.

## 3. App Store Metadata
- [ ] **App Icon**: Finalize "Flower" logo app icon (1024x1024).
- [ ] **Screenshots**: Generate 5 premium screenshots showcasing Dashboard, Goalie Card, and Film Workspace.
- [ ] **Description**: Draft the "Index for GOOD" narrative for the App Store page.

## 4. TestFlight Lifecycle
- [ ] **Build Upload**: Run `npm run build && npx cap copy ios` and archive in Xcode.
- [ ] **Internal Testing**: Distribute to internal team via App Store Connect.
- [ ] **External Alpha**: Invite the first 50 athletes once build is stable.

---
*Last updated: 2026-04-11*
