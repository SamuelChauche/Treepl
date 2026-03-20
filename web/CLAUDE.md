# EthCC[9] Cannes — UI Design System & Conventions

> Reference for Claude CLI / AI agents integrating or modifying this prototype.

---

## Language

All UI text in the app **must be in English**. No French strings in components.

---

## Brand Identity: Sofia Kit (Dark Mode Only)

This app is **dark mode exclusively**. There is no light mode. All backgrounds are near-black, text is warm off-white, and accents use an iridescent peach palette.

---

## Color Palette (`const C`)

### Backgrounds
| Token | Value | Usage |
|---|---|---|
| `C.background` | `#0a0a0a` | Page/screen background |
| `C.surface` | `#161618` | Card backgrounds (legacy, prefer glassSurface) |
| `C.surfaceGray` | `#1c1c20` | Inactive buttons, **opaque input fields**, secondary surfaces |
| `C.dark` | `#0a0a0a` | Alias for background |

### Text
| Token | Value | Usage |
|---|---|---|
| `C.textPrimary` | `#F2DED6` | Headings, primary content |
| `C.textSecondary` | `#a09088` | Subtitles, descriptions |
| `C.textTertiary` | `#6a5f5a` | Hints, inactive labels |
| `C.white` | `#FBF7F5` | Text on colored/dark backgrounds |

### Accent Colors
| Token | Value | Usage |
|---|---|---|
| `C.flat` | `#ffc6b0` | **PRIMARY ACCENT** — All active/selected states (nav, buttons, tabs, day selectors, badges). Flat peach from iridescence palette |
| `C.flatLight` | `rgba(255,198,176,0.15)` | Light tint of flat for subtle highlights |
| `C.primary` | `#cea2fd` | **DECORATIVE ONLY** — Avatars, gradients, QR codes, icons. NEVER for buttons or selections |
| `C.primaryLight` | `rgba(206,162,253,0.15)` | Light tint of primary for decorative backgrounds |
| `C.accent` | `#A6AF6B` | Secondary gradient color (used in avatar gradients with primary) |

### Semantic Colors
| Token | Value | Usage |
|---|---|---|
| `C.success` | `#22c55e` | Positive PnL, online status, verified, match % |
| `C.successLight` | `rgba(34,197,94,0.15)` | Success background tint |
| `C.error` | `#ef4444` | Negative PnL, remove actions |
| `C.errorLight` | `rgba(239,68,68,0.15)` | Error background tint |
| `C.trust` | `#00D4AA` | $TRUST token branding, chain info |
| `C.gold` | `#FCD34D` | XP rewards, podium |
| `C.warning` | `#f59e0b` | Warnings |

### Gradients
| Token | Value | Usage |
|---|---|---|
| `C.iridescence` | `linear-gradient(135deg, #D790C7 0%, #d37cbf 20%, #ffc6b0 50%, #ffa7b1 80%, #cea2fd 100%)` | **ONLY for `btnPill` (large CTA buttons)**. Do NOT use on small elements |
| `C.gradIr` | Same as iridescence | Alias |

### Borders
| Token | Value |
|---|---|
| `C.border` | `rgba(255,255,255,0.08)` |
| `C.borderLight` | `rgba(255,255,255,0.1)` |

---

## CRITICAL RULES — Flat vs Gradient

```
GRADIENT (C.iridescence / btnPill):
  ✅ Large CTA buttons (56px height, full-width, btnPill style)
  ❌ NEVER on small buttons, tabs, day selectors, badges, nav items

FLAT (C.flat / #ffc6b0):
  ✅ Active nav tab, selected day, active filter, vote tab, amount preset
  ✅ Badges (stats on profile), small action buttons, invite button
  ✅ Header backgrounds (Home, Vote pages)
  ✅ Text color for active labels in nav

C.primary (#cea2fd):
  ✅ Avatar gradients: linear-gradient(135deg, C.primary, C.accent)
  ✅ QR code pixels
  ✅ Decorative icons (MapPin, Link, etc.)
  ✅ "See all" / "View all" link text
  ❌ NEVER for active/selected UI states — use C.flat instead
```

---

## Input Fields

All input fields must use **opaque backgrounds** (`C.surfaceGray`), not transparent/semi-transparent:

```tsx
// ✅ Correct
background: C.surfaceGray  // #1c1c20

// ❌ Wrong
background: "rgba(255,255,255,0.04)"
```

---

## Layout — Scrollable Pages

Pages with scrollable content use a parent padding pattern. Do NOT add horizontal margin to child elements — the scroll container handles it:

```tsx
// ✅ Correct: padding on scroll container, no margin on children
<div style={{ flex: 1, overflowY: "auto", padding: "0 16px 80px" }}>
  <div style={{ ...glassSurface, marginTop: 16 }}>...</div>
  <button style={{ ...btnPill, marginTop: 16 }}>...</button>
</div>

// ❌ Wrong: margin on children inside padded container (causes misalignment)
<div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
  <div style={{ ...glassSurface, margin: "16px" }}>...</div>
  <button style={{ ...btnPill, margin: "16px" }}>...</button>
</div>
```

Use `paddingBottom: 80` on scroll containers to ensure content isn't hidden behind Nav5.

---

## Border Radius (`const R`)

| Token | Value | Usage |
|---|---|---|
| `R.sm` | `4` | Micro elements |
| `R.md` | `8` | Small cards, inputs |
| `R.lg` | `12` | Cards, panels |
| `R.xl` | `20` | Large cards, QR containers |
| `R.btn` | `28` | Buttons, pills, tags |

---

## Typography

```typescript
const FONT = "'Gotu','Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
```

- **Headings**: fontSize 20-44, fontWeight 700-900, color `C.textPrimary`
- **Body**: fontSize 13-15, fontWeight 400-500, color `C.textSecondary`
- **Labels**: fontSize 10-12, fontWeight 500-600, color `C.textTertiary`
- **Monospace**: fontFamily `"monospace"` for addresses (0x...) and TX hashes
- All text uses `fontFamily: FONT` unless monospace

---

## Glassmorphism System

All cards and surfaces use glassmorphism. Do NOT use flat `background: C.surface` on new elements.

### Helpers (spread into style objects)

```typescript
// Base glass — for action bars, overlays
const glass: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)"
};

// Card glass — for standard cards
const glassCard: CSSProperties = {
  ...glass,
  borderRadius: R.lg,       // 12px
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
};

// Navigation bar
const glassNav: CSSProperties = {
  background: "rgba(22,22,24,0.75)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderTop: "1px solid rgba(255,255,255,0.08)"
};

// Surface cards — session cards, vibe cards, platform cards
const glassSurface: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: R.lg,       // 12px
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
};
```

### Usage pattern
```tsx
// ✅ Correct: spread glass helper then override
<div style={{ padding: 14, ...glassSurface, marginBottom: 10 }}>

// ❌ Wrong: flat background
<div style={{ padding: 14, borderRadius: R.lg, background: C.surface }}>
```

---

## Button Styles

### `btnPill` — Primary CTA
```typescript
const btnPill: CSSProperties = {
  width: "100%", height: 56, borderRadius: R.btn,
  background: C.iridescence,  // gradient only on these large buttons
  color: "#0a0a0a",           // black text on gradient
  fontSize: 16, fontWeight: 600,
  border: "none", cursor: "pointer", fontFamily: FONT,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
};
```
Usage: `<button style={btnPill}>`, or spread + override: `<button style={{...btnPill, background: C.success}}>`

### Small active buttons/tabs
```tsx
// Active state
background: C.flat, color: "#0a0a0a"

// Inactive state
background: C.surfaceGray, color: C.textSecondary
```

---

## Component Architecture

### Screen Components (full-page)
| Component | Route | Description |
|---|---|---|
| `OnboardingPage` | `/` | 8-step flow: Splash → Slides → Interests → Sessions → Wallet → Publish → Success |
| `HomePage` | `/home` | Balance header, Send/Invite actions, Nearby Vibes, Today's Sessions |
| `AgendaPage` | `/agenda` | Day filters, type filters, search, session cards with cart toggle |
| `CartPage` | `/cart` | Review selections, QR, TX summary, publish on-chain |
| `VotePage` | `/vote` | PnL header, Trending/My Votes/Discover tabs |
| `ProfilePage` | `/profile` | ENS social profiles from text records, Connect with ENS wallet for embedded users |
| `SessionDetailPage` | `/session/:id` | Session info, trend, add to cart |
| `TopicDetailPage` | `/topic/:id` | Topic detail with vault data |
| `SpeakerPage` | `/speaker/:slug` | Speaker profile, talks timeline |
| `VibeProfilePage` | `/vibe/:index` | ENS socials + mock socials fallback, Send $TRUST button (no Follow/Share) |
| `VibesListPage` | `/vibes` | Full list of vibe matches |
| `InvitePage` | `/invite` | QR code download app + Send $TRUST button + My Wallet QR |
| `SendPage` | `/send` | QR code display + $TRUST transfer with real `signer.sendTransaction()` |
| `BuyTrustPage` | `/buy` | Amount picker, wallet connect (MetaMask), purchase |
| `LeaderboardPage` | `/leaderboard` | PnL podium + ranked list |
| `SettingsPage` | `/settings` | Settings/preferences |

### Shared Components
| Component | Props | Description |
|---|---|---|
| `SplashBg` | `children` | Diamond mesh + dot grid background for splash screen |
| `Logo` | `size` | EthCC logo (two circles) |
| `PhoneFrame` | `children` | 390x844 phone mockup container |
| `StatusBar` | `light?: boolean` | iOS status bar (9:41, signal, battery) |
| `Dots` | `n, a` | Pagination dots (active = `C.flat`) |
| `Spark` | `data, color, h` | Mini sparkline bar chart |
| `CBends` | `items` | Horizontal color distribution bar |
| `Nav5` | `active, onNav, cc` | Bottom nav (5 tabs, glass backdrop, center cart button) |
| `Header` | `title, onLeaderboard, dark` | Search bar + trophy + bell. `dark` prop for iridescent header |

### Icons (`Ic.*`)
All icons accept `{ s?: number, c?: string, f?: boolean }`:
`Home`, `Discover`, `Cart`, `Vote`, `User`, `Bell`, `Search`, `Trophy`, `Back`, `Right`, `Check`, `Send`, `Receive`, `Bank`, `Heart`, `ArrowUp`, `ArrowDown`, `People`, `Plus`, `Wallet`, `Settings`, `Clock`, `Pin`, `Share`, `Trash`, `ThumbUp`, `MapPin`, `Link`, `X`

---

## Services

### `intuition.ts` — On-chain operations (Intuition Protocol)
- `connectWallet()` — MetaMask/AppKit, falls back to embedded wallet
- `ensureUserAtom()` — create user atom if not exists
- `buildProfileTriples()` / `createProfileTriples()` — on-chain profile
- `depositOnAtoms()` — batch deposit on topic/track atoms
- `estimateFees()` — fee estimation via proxy
- `approveProxy()` — one-time proxy approval

### `embeddedWallet.ts` — Client-side wallet for users without MetaMask
- `createEmbeddedWallet(password)` — generates `ethers.Wallet.createRandom()`, encrypts private key with AES-GCM (PBKDF2-derived key), stores in localStorage
- `connectEmbeddedWallet(password)` — decrypts and returns a `WalletConnection` compatible with all services
- `hasEmbeddedWallet()` / `getEmbeddedAddress()` — check stored wallet
- `markBackupDone()` / `isBackupDone()` — track if user saved their private key
- `needsUnlock()` — check if embedded wallet exists but needs password
- Private key is shown once during creation (backup screen). If user skips, HomePage shows a backup reminder banner.

### `sessionNotifService.ts` — Session end notification scheduler
- Schedules toast + native notifications for when sessions end
- `createTestSession()` — generates a test session ending 3 minutes from now (for daily testing)
- `startSessionNotifScheduler()` — sets up timers for all sessions ending in the next 24h, re-checks every 5 min

### `notificationService.ts` — Native browser notifications (Notification API)
- `requestNotificationPermission()` — requests permission on first load
- `showNativeNotification()` — shows a browser notification (works when tab is not focused)
- `notifySessionEnd()` / `notifyReplayAvailable()` — specific notification types with click-to-open

### `replayService.ts` — Replay polling
- Polls `public/replays.json` every hour for new YouTube replay links
- `checkForNewReplays()` — detects new links, filters by user's "Want to watch" preferences
- `startReplayPolling()` — starts periodic check, calls callback on new replays
- `getReplayUrl()` — get replay URL for a specific session (used in SessionDetailPage)

### `leaderboardService.ts` — Blockscout API
- Fetches transaction data from Blockscout for leaderboard ranking
- PnL = $TRUST sent, fallback to mock data

### `ensService.ts` — ENS text records resolution
- Resolves ENS text records (GitHub, X, Discord, Website)
- Used by ProfilePage and VibeProfilePage for social profiles

### `voteService.ts` — Topic voting
- `submitVotes()` — batch deposit on topic atom vaults (support/oppose)

### `portfolioService.ts` — Position tracking
- `fetchUserPositions()` / `fetchPortfolio()` — GraphQL query for user vault positions
- `redeemPosition()` — withdraw from vault

### `trendingService.ts` — Trending data
- `fetchTrendingTopics()` — topics sorted by total TRUST deposited
- `fetchTopicVoters()` / `fetchTopicEvents()` — vault activity

### `StorageService.ts` — localStorage persistence
- Cart (`ethcc-cart`), Topics (`ethcc-topics`), Votes (`ethcc-votes`)

### localStorage keys reference
| Key | Content |
|-----|---------|
| `ethcc-cart` | Set of session/topic IDs in cart |
| `ethcc-topics` | Set of published track interests |
| `ethcc-votes` | Set of voted topic IDs |
| `ethcc-ratings-pending` | Map of sessionId → rating (1-5), pending checkout |
| `ethcc-ratings` | Map of sessionId → { rating, timestamp }, display cache |
| `ethcc-published-sessions` | Array of session IDs published on-chain (permanent) |
| `ethcc-pending-topics` | Array of tracks added as interest but not yet published |
| `ethcc-trust-transfers` | Array of { from, to, amount, hash, timestamp } for leaderboard |
| `ethcc-wallet-address` | Last connected wallet address |
| `ethcc-embedded-wallet` | Encrypted embedded wallet { address, encryptedKey, salt, iv } |
| `ethcc-backup-done` | "1" if user acknowledged private key backup |
| `ethcc-onboarded` | "1" if user completed onboarding |
| `ethcc-want-replay` | Array of session IDs user wants replay for |
| `ethcc-seen-replays` | Array of session IDs whose replay notification was shown |

---

## Hooks

| Hook | Purpose |
|---|---|
| `useCart` | Cart state + persistence + `useSyncExternalStore` for Nav5 badge |
| `useSessionFilter` | Filter state (day, type, topic) |
| `useWallet` | Full wallet flow: connect → approve → create profile |
| `useWalletConnection` | Low-level AppKit wallet state (provider, signer, balance) |
| `useVibeMatches` | GraphQL query for like-minded users by shared interests |
| `useInterestCounts` | Interest count polling per topic |
| `usePwaInstall` | Captures `beforeinstallprompt`, provides `promptInstall()` + `canInstall` |
| `useEnsProfile` | Resolves ENS text records for user social profiles |

---

## TypeScript Interfaces

```typescript
interface Track { id: string; name: string; color: string; icon: string; }
interface Session { id: number; title: string; speaker: string; trackId: string; type: "talk"|"workshop"|"panel"; time: string; date: string; stage: string; interested: number; trend: string; up: boolean; tags: string[]; desc: string; }
interface Web3Topic { id: string; name: string; cat: string; votes: number; pnl: string; up: boolean; mktCap: number; trend: number[]; }
interface Vibe { name: string; addr: string; shared: string[]; pct: number; online: boolean; dist: string; px?: number; py?: number; }
interface Platform { id: string; name: string; icon: string; color: string; desc: string; score: string; }
interface LeaderboardUser { name: string; addr: string; pnl: string; up: boolean; votes: number; mktCap: string; rank: number; isMe?: boolean; }
interface WalletConnection { provider: any; signer: any; proxy: any; multiVault: any; address: string; ethers: any; }
interface IconProps { s?: number; c?: string; f?: boolean; }
```

---

## On-Chain / Intuition Protocol Context

- **Chain**: 1155 (Intuition L3)
- **Token**: $TRUST (native gas token)
- **MultiVault**: `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e`
- **Sofia Fee Proxy**: `0x26F81d723Ad1648194FAa4b7E235105Fd1212c6c`
- **Creator**: `0x077b59a3751Cd6682534C8203aAb29113876af01`
- **RPC**: `https://rpc.intuition.systems/http`
- **GraphQL**: `https://mainnet.intuition.sh/v1/graphql`
- **Atom "I" pattern**: All vote triples use shared atom "I" (`0x7ab197b...`) as subject. Users identified by vault positions, not individual atoms.
- **Profile triples**: `[User] --are interested by--> [Track]`, `[User] --attending--> [Session]`

---

## Sessions — Published Sessions

Published sessions are permanent (`ethcc-published-sessions` in localStorage). Once published on-chain, they cannot be unchecked or removed from the cart.

---

## Ratings — Cart & Checkout

Ratings are added to cart, then deposited at checkout via `depositBatch`. Each rating creates a deposit in the vault of the corresponding `[Session] --has tag--> [N/5]` triple.

---

## Navigation

Routes defined in `main.tsx` via react-router-dom v7:

```
/           → OnboardingPage
/home       → HomePage
/agenda     → AgendaPage
/cart       → CartPage
/vote       → VotePage
/profile    → ProfilePage
/session/:id → SessionDetailPage
/topic/:id  → TopicDetailPage
/speaker/:slug → SpeakerPage
/send       → SendPage
/buy        → BuyTrustPage
/leaderboard → LeaderboardPage
/invite     → InvitePage
/vibes      → VibesListPage
/vibe/:index → VibeProfilePage
/settings   → SettingsPage
```

Nav5 is visible on: `/home`, `/agenda`, `/cart`, `/vote`, `/profile`

---

## Common Patterns

### Card with glassmorphism
```tsx
<div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, ...glassSurface, marginBottom: 8, cursor: "pointer" }}>
```

### Avatar circle
```tsx
<div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
  {name.slice(0, 2)}
</div>
```

### Active/inactive toggle
```tsx
// Active
background: C.flat, color: "#0a0a0a"
// Inactive
background: C.surfaceGray, color: C.textSecondary
```

### PnL display
```tsx
<span style={{ color: item.up ? C.success : C.error, fontWeight: 700 }}>
  {item.pnl}
</span>
```

### Back button
```tsx
<button onClick={onBack} style={{ width: 42, height: 42, borderRadius: 14, background: C.surfaceGray, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
  <Ic.Back c={C.textPrimary} />
</button>
```

### Notification toast (App.tsx)
```tsx
// Local toast via sessionNotifService scheduler (no Push Protocol)
// 5-second auto-dismiss, click to close
// Uses glass background with slideDown animation
```
