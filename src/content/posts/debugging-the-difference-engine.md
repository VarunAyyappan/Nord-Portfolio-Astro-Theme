---
title: Debugging the Difference Engine
description: A stuck carry, a patch and the stylesheet for the simulator's printout.
date: 2026-07-10
tags: [Debugging, Engines]
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Reproducing it

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris:

```sh
# Run the simulator for 40 turns of the crank.
npx difference-engine --turns 40 --trace > trace.log
grep -n "carry" trace.log | head -5
```

## The fix

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore:

```diff
- if (wheel.value > 9) wheel.carry = true;
+ if (wheel.value > 9) {
+   wheel.value -= 10;
+   wheel.carry = true;
+ }
```

## The printout

Excepteur sint occaecat cupidatat non proident. The printout uses its own stylesheet:

```css
@media print {
  .table {
    font-variant-numeric: tabular-nums;
    border-collapse: collapse;
  }
}
```

```html
<!doctype html>
<table class="table">
  <tr><td>1</td><td>2</td></tr>
</table>
```

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio.
