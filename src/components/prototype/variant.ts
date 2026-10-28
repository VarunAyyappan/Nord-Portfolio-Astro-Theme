// PROTOTYPE (design directions): the variants ?variant= can pick.
export const variants = ["a", "b", "c"] as const;
export type Variant = (typeof variants)[number];

export const variantNames: Record<Variant | "current", string> = {
  current: "Current v1 design",
  a: "Reading room",
  b: "Workbench",
  c: "Nordic grid",
};
