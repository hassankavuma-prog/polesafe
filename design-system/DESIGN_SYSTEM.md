# PoleSafe Design System v2.0
## Dual Theme — Light (Day) + Dark (Night)
## Auto-Adaptive for School Transport + Ride-Hailing

> **Principal Direction:** Hassan K.
> **Design Lead:** OpenClaw
> **Decision:** Auto day/night theme switching (light 6AM-6PM, dark 6PM-6AM)
> **Status Colors:** ✅ Preserved unchanged from v1

---

## 1. Core Design Decision

### 🎯 The Call

After evaluating a full dark-mode/Pyrax approach against PoleSafe's real usage:

- **School transport happens in daylight.** Parents check at 6:30 AM, drivers read pickup codes in bright sun, school admins work gate check-ins during morning drop-off.
- **Dark mode hurts in Ugandan sunlight.** OLED contrast washes out. Glassmorphism `backdrop-filter: blur()` is a performance killer on mid-range Android phones.
- **Green = trust.** Parents already associate #2E7D32 with "safe." Throwing that away for a glow effect would be bad product design.

**Result:** Dual-theme. Light canvas by day (modern, green-branded), dark canvas by night (Pyrax-inspired for PoleSafe Ride). Users get the best of both.

---

## 2. Theme Architecture

### Auto-Switch Logic

```js
function getTheme(hour = new Date().getHours()) {
  return (hour >= 6 && hour < 18) ? LIGHT : DARK;
}
```

| Time | Theme | Use Case |
|------|-------|----------|
| 6:00 AM – 5:59 PM | ☀️ Light | School runs, daytime tracking, admin |
| 6:00 PM – 5:59 AM | 🌙 Dark | PoleSafe Ride (evening trips) |

---

## 3. Color Palette

### Shared Brand Colors (never change)

```
🟢 Green      #2E7D32  — Primary brand, buttons, headers, success
   Light:     #4CAF50  — Badges, highlights
   Bg:        #E8F5E9  — Card backgrounds, stats

🔵 Blue       #1565C0  — Driver screens, info, links
   Light:     #42A5F5
   Bg:        #E3F2FD

🟠 Orange     #E65100  — School admin, warnings, late status
   Light:     #FFA726
   Bg:        #FFF3E0

🔴 Red        #C62828  — Errors, absent status, danger
   Light:     #EF5350
   Bg:        #FFEBEE

🟣 Purple     #6A1B9A  — Sick day status
   Bg:        #F3E5F5

🔵 Teal       #0277BD  — Excused absence status
   Bg:        #E0F7FA
```

### Status Colors (preserved from v1)

| Status    | Color    | Hex       |
|-----------|----------|-----------|
| Present   | 🟢 Green | `#2E7D32` |
| Absent    | 🔴 Red   | `#C62828` |
| Late      | 🟠 Orange| `#E65100` |
| Sick      | 🟣 Purple| `#6A1B9A` |
| Excused   | 🔵 Teal  | `#0277BD` |

### ☀️ Light Theme

```
Canvas:         #F5F5F5  (warm light gray)
Canvas Sec:     #FFFFFF  (white)
Surface:        #FFFFFF
Border:         #E0E0E0
Glass:          rgba(255,255,255,0.85)
Text Primary:   #1A1A2E
Text Secondary: #666666
Text Muted:     #999999
Accent Glow:    rgba(46,125,50,0.15)
```

### 🌙 Dark Theme

```
Canvas:         #0B0F17  (deep obsidian)
Canvas Sec:     #121824  (dark slate)
Surface:        rgba(30,41,59,0.85)
Border:         rgba(51,65,85,0.5)
Glass:          rgba(30,41,59,0.75)
Text Primary:   #FFFFFF
Text Secondary: #94A3B8
Text Muted:     #64748B
Accent Glow:    rgba(0,240,255,0.15)  (electric cyan)
```

---

## 4. Typography

```
Font:         Inter (geometric sans-serif)
Fallback:     SF Pro / Roboto

Scale:
hero      32px Bold      — Fares, pickup codes
h1        24px Semibold  — Screen titles, driver name
h2        20px Semibold  — Card headers, vehicle tiers
h3        18px Medium    — Section labels
body      16px Regular   — Ride details, addresses
caption   14px Regular   — Distance, time, secondary
micro     12px Regular   — Badges, tags

Spacing:   4/8/16/24/32/48 (xs/sm/md/lg/xl/xxl)
Radius:    6/10/14/16 (sm/md/lg/xl), 999 (pill)
```

---

## 5. Components

### GlassCard
- Light: white frosted surface with subtle border
- Dark: dark glassmorphism with blur effect
- Works in both themes automatically

### PrimaryButton
- Light: green (#2E7D32) with subtle green shadow
- Dark: cyan (#00F0FF) with neon glow
- Variants: secondary (outlined), ghost, danger (red)

### Components Built
- ✅ `mobile/theme.js` — Full dual-theme token system
- ✅ `mobile/components/GlassCard.js` — Themed frosted card
- ✅ `mobile/components/PrimaryButton.js` — Themed CTA button

---

## 6. Implementation Status

### ✅ Done
- [x] Color audit across all 20 screens
- [x] Theme file with light + dark + auto-switch
- [x] GlassCard component
- [x] PrimaryButton component
- [x] Status colors preserved

### ⬜ Next (apply to screens)
- [ ] Apply theme tokens to ParentDashboard
- [ ] Apply to DriverDashboard
- [ ] Apply to SchoolDashboard
- [ ] Apply to remaining 17 screens
- [ ] Day/night auto-switch integration
- [ ] UI consistency pass

---

*PoleSafe Design System v2.0 — Dual Theme*
*"Modern. Adaptive. Unmistakably safe."*
