# PocketMentor – Executive Communication Coach

PocketMentor is a mobile simulator designed for early-career software engineers and junior managers to practice high-stakes workplace conversations (scope pushback, upward feedback, tech-debt defense).

## Next Gen Award Track Submission
- **Monetization Engine:** RevenueCat Test Store SDK
- **Target Entitlement:** `pro`
- **Framework:** React Native / Expo (TypeScript)
- **Persistence:** Local-first session history via AsyncStorage

## RevenueCat Architecture
- Configuration & SDK initialization: `services/revenuecat.ts`
- Dynamic Offering & Package resolution: `components/PaywallModal.tsx`
- Real-time Entitlement checks & feature gating: `App.tsx`

## Local Setup
1. `npm install`
2. `npx expo start -c`
3. Press `w` to run web preview or scan QR with Expo Go.