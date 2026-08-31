# Authentication & UI Refactoring Documentation

This document provides a comprehensive technical breakdown of all modifications made across the **Recurrly** codebase, covering architectural changes, branding updates, layout fixes, typography adjustments, and runtime stability enhancements.

---

## 1. Summary of Modifications

| Area | Changes Made | Files Affected |
| :--- | :--- | :--- |
| **Authentication Flow** | Integrated Clerk authentication, session gating, secure token caching via SecureStore, and multi-step registration with automatic email verification handling. | `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(auth)/index.tsx`, `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`, `lib/tokenCache.ts` |
| **Branding & Identity** | Standardized all brand text from "Recurly" to "Recurrly" across logo marks, wordmarks, helper text, and footer links. | `global.css`, `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx` |
| **Layout & Spacing** | Resolved logo wordmark overlap with subtitle, increased vertical margins between form groups and labels, and eliminated white screen rendering issues. | `global.css`, `app/_layout.tsx`, `app/(auth)/_layout.tsx` |
| **Typography & Sizing** | Scaled input text and placeholders to `14px` (`text-sm`), lightened placeholder text opacity, and adjusted heading tracking and line heights. | `global.css`, `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx` |
| **Runtime Bug Fixes** | Resolved `react-native-css` crash on centered input fields (`path.split is not a function`). | `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx` |

---

## 2. Detailed Technical Breakdown

### A. Branding & Header Layout Fixes

#### 1. Logo Header Text Overlap Resolution
* **Change:** Removed negative margin on `.auth-wordmark-sub` in `global.css`:
  ```css
  /* Before */
  .auth-wordmark-sub {
    @apply -mt-1 text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground;
  }

  /* After */
  .auth-wordmark-sub {
    @apply mt-1.5 text-[11px] font-sans-bold uppercase tracking-[1.5px] text-muted-foreground;
  }
  ```
* **How It Works Under the Hood:** React Native's Yoga flexbox layout engine treats negative margins by pulling child elements upward into the bounding box of previous siblings. Because custom display typography (*Plus Jakarta Sans ExtraBold*) has specific ascender/descender bounds, the negative top margin (`-4px`) forced `"SMART BILLING"` to collide directly into the base of `"Recurrly"`.
* **Why It Resolves the Issue:** Switching to `mt-1.5` (`+6px`) ensures a clean, positive vertical separation between the wordmark and its subtitle across all screen sizes and font-scaling settings.

#### 2. Brand Name Standardization
* **Change:** Standardized brand naming from `"Recurly"` to `"Recurrly"` across all screens, headers, labels, and footer switch links.
* **Why It Resolves the Issue:** Ensures consistent product branding matching the project repository across every customer-facing surface.

---

### B. Spacing & Typography Adjustments

#### 1. Title & Subtitle Breathing Room
* **Change:** Tuned heading sizes, letter spacing, and line heights in `global.css`:
  ```css
  /* Before */
  .auth-title {
    @apply text-3xl font-sans-bold text-primary;
  }
  .auth-subtitle {
    @apply mt-2 max-w-[320px] text-center text-base font-sans-medium text-muted-foreground;
  }

  /* After */
  .auth-title {
    @apply text-[28px] font-sans-bold text-primary tracking-tight;
  }
  .auth-subtitle {
    @apply mt-2.5 max-w-[320px] text-center text-sm font-sans-medium text-muted-foreground leading-relaxed;
  }
  ```
* **How It Works Under the Hood:** `tracking-tight` adjusts `letterSpacing: -0.5px` on large display headings, while `leading-relaxed` maps to a proportional `lineHeight: 1.625` (~23px on a 14px base font). React Native allocates line-height evenly above and below the baseline.
* **Why It Resolves the Issue:** Prevents multi-line subtitles from crowding together on mobile devices, establishing a clear visual hierarchy.

#### 2. Form Group & Label Vertical Spacing
* **Change:** Increased vertical spacing between adjacent fields and labels in `global.css`:
  ```css
  /* Before */
  .auth-form { @apply gap-4; }
  .auth-field { @apply gap-2; }

  /* After */
  .auth-form { @apply gap-5; }
  .auth-field { @apply gap-2.5; }
  ```
* **How It Works Under the Hood:** Flexbox `gap` creates non-collapsing margins between children. `.auth-form` now applies `20px` between input sections, and `.auth-field` applies `10px` between a label and its input.
* **Why It Resolves the Issue:** Enhances visual breathing room and improves touch-target separation.

---

### C. Input & Placeholder Styling

#### 1. Input & Placeholder Font Sizing
* **Change:** Standardized input and placeholder size to `text-sm` (14px) with adjusted vertical padding:
  ```css
  /* Before */
  .auth-input {
    @apply rounded-2xl border border-border bg-background px-4 py-4 text-base font-sans-medium text-primary;
  }

  /* After */
  .auth-input {
    @apply rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-sans-medium text-primary;
  }
  ```
* **How It Works Under the Hood:** React Native's `<TextInput>` inherits its placeholder size from the component's `fontSize` property. Setting `text-sm` (`14px`) with `py-3.5` (`14px` vertical padding) keeps the tap area comfortable (~48px) while rendering crisp text.
* **Why It Resolves the Issue:** Prevents placeholder text from dominating the input box and avoids truncation on compact viewports.

#### 2. Placeholder Text Contrast & Tint
* **Change:** Replaced the dark `#4c556b` placeholder color with a lightened alpha tone:
  ```tsx
  placeholderTextColor="rgba(8, 17, 38, 0.35)"
  ```
* **How It Works Under the Hood:** Directly tints the native iOS (`UITextField`) and Android (`EditText`) placeholder layers. Using a 35% opacity based on the primary color `#081126` maintains correct color temperature with softer contrast.
* **Why It Resolves the Issue:** Clearly differentiates unfilled inputs from typed user content and labels.

---

### D. Stability & Architecture Fixes

#### 1. Native CSS Runtime Stability Fix (`path.split is not a function`)
* **Change:** Removed `text-center` from `<TextInput className="...">` in `sign-up.tsx` and `sign-in.tsx`, passing alignment via inline styles instead:
  ```tsx
  <TextInput
    className="auth-input tracking-widest text-2xl font-sans-bold"
    style={{ textAlign: "center" }}
  />
  ```
* **How It Works Under the Hood:** `react-native-css` maps CSS classes to native props. Its internal configuration mapped `textAlign` to `true` (a boolean) rather than a string keypath. When `text-center` was parsed, it attempted to call `path.split(".")` on `true`, triggering a fatal runtime exception.
* **Why It Resolves the Issue:** Passing `style={{ textAlign: "center" }}` applies the alignment through standard React Native style props, completely bypassing the bug in the library's utility mapper.

#### 2. Root Layout & Auth Gate Redirection
* **Change:** Configured root fallback loading states in `app/_layout.tsx` and created `app/(auth)/index.tsx`:
  * Added fallback background `#fff9e3` to avoid blank white frames during font and auth initialization.
  * Added `initialRouteName="sign-in"` and content styling to `app/(auth)/_layout.tsx`.
* **Why It Resolves the Issue:** Prevents race conditions during initial app mount and guarantees smooth routing between signed-out and authenticated states.
