# DEV GUIDE - routes, features, and shared code

## How to add a new route

Routing is handled by `expo-router`. Every file inside `app/` represents a page.

Example: add a `profile` page.

1. Create `app/profile.tsx` as a thin wrapper around the feature screen:

```tsx
// app/profile.tsx
import { View, Text } from "react-native";

export default function ProfileRoute() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Profile</Text>
    </View>
  );
}
```

Or forward the feature screen directly:

```tsx
// app/profile.tsx
import { ProfileScreen } from "@features/profile/screens/ProfileScreen";
export default function Screen() {
  return <ProfileScreen />;
}
```

2. Handle navigation inside each screen as needed. With the map view running full-screen, additional screens should render their own controls (e.g., `Link` from `expo-router`) instead of relying on a shared footer.

## How to extend a feature with new screens or components

Suppose the map feature gets a settings screen and a couple of helper components.

1. Create the files:

```text
src/features/map/
  screens/
    MapSettingsScreen.tsx
  components/
    SelectionFilters.tsx
```

2. Add a route for the new screen:

```tsx
// app/map-settings.tsx
import { MapSettingsScreen } from "@features/map/screens/MapSettingsScreen";
export default function Screen() {
  return <MapSettingsScreen />;
}
```

3. Keep feature-specific building blocks nearby:

- `styles.ts` - feature styles
- `constants.ts` - UI constants
- `config/*` - feature configuration (for example, prompts)
- `components/*` - components scoped to the feature only

## How to create a new feature

Example: the `profile` feature.

1. Scaffold the structure:

```text
src/features/profile/
  screens/
    ProfileScreen.tsx
  styles.ts
  constants.ts
```

```tsx
// src/features/profile/screens/ProfileScreen.tsx
import { View, Text } from "react-native";
export function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Profile</Text>
    </View>
  );
}
```

2. Register the route:

```tsx
// app/profile.tsx
import { ProfileScreen } from "@features/profile/screens/ProfileScreen";
export default function Screen() {
  return <ProfileScreen />;
}
```

3. Move reusable logic to `shared/*` as soon as at least two features need it (see below).

## Shared - what belongs there

The `src/shared/*` folder must contain code that is genuinely reused.

Guidelines:

- `shared/api/*` - API clients or SDK wrappers (for example, `openai.ts`). Keep them pure and reusable.
- `shared/config/*` - environment/config adapters such as `env.ts`.
- `shared/navigation/*` - navigation constants/utilities (`routes.ts`). Do not put UI here.
- `shared/store/*` - global Zustand stores. Keep the surface small.
- `shared/types/*` - shared types/interfaces (for example, `ChatMessage`). Avoid business logic.
- `shared/ui/*` - reusable, feature-agnostic UI components (for example, `FooterNav`). Feature-specific components stay inside the feature folder.

Rules of thumb:

- Build inside the feature first; extract to `shared/*` only when there is a second consumer.
- Respect aliases: `@shared/*`, `@features/*`.
- Avoid circular dependencies between features and shared code.
- Do not place temporary or one-off utilities in `shared/*`.

Example: adding a shared UI component:

```tsx
// src/shared/ui/Card.tsx
import { View, StyleSheet } from "react-native";
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 12, backgroundColor: "#fff", padding: 12 },
});
```

Use it inside a feature:

```tsx
import { Card } from "@shared/ui/Card";
```

Need a new global store?

```ts
// src/shared/store/appStore.ts
import { create } from "zustand";
export const useAppStore = create<{
  lastPrompt: string;
  setLastPrompt: (v: string) => void;
}>((set) => ({
  lastPrompt: "",
  setLastPrompt: (v) => set({ lastPrompt: v }),
}));
```
