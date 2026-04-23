// Easings borrowed from iOS spring families. These are the only easings
// used anywhere in the app — consistency is the craft.
export const EASE = {
  // Apple "emphasized" — slight overshoot. Entrances.
  out:   "cubic-bezier(0.2, 0.8, 0.2, 1.0)",
  // Tight deceleration — pressed states, quick acknowledgements.
  quick: "cubic-bezier(0.32, 0.72, 0, 1.0)",
  // Material standard — mechanical transforms.
  std:   "cubic-bezier(0.4, 0.0, 0.2, 1.0)",
  // Steep in/out — page transitions.
  page:  "cubic-bezier(0.65, 0, 0.35, 1)"
} as const;
