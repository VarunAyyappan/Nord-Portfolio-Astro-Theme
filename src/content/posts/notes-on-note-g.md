---
title: Notes on Note G
description: Walking through the first published algorithm, one operation at a time.
date: 2026-09-14
updated: 2026-09-21
tags: [Algorithms, Mathematics]
cover: ./covers/notes-on-note-g.png
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## The operations

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Each operation reads two variables and writes one, as in this table:

| Operation | Reads        | Writes |
| --------- | ------------ | ------ |
| ×         | V2, V3       | V4     |
| −         | V4, V1       | V5     |
| ÷         | V5, V4       | V11    |
| +         | V11, V13     | V13    |

## In modern code

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Here is the same idea as a `bernoulli` function:

```ts
// Computes the nth Bernoulli number with the Akiyama–Tanigawa algorithm.
export function bernoulli(n: number): number {
  const a: number[] = [];
  for (let m = 0; m <= n; m++) {
    a[m] = 1 / (m + 1);
    for (let j = m; j >= 1; j--) {
      a[j - 1] = j * (a[j - 1] - a[j]);
    }
  }
  return a[0];
}

console.log(bernoulli(8)); // -0.0333…
```

### Checking the result

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit:

```python
from fractions import Fraction

def bernoulli(n: int) -> Fraction:
    """The nth Bernoulli number, exactly."""
    a = [Fraction(0)] * (n + 1)
    for m in range(n + 1):
        a[m] = Fraction(1, m + 1)
        for j in range(m, 0, -1):
            a[j - 1] = j * (a[j - 1] - a[j])
    return a[0]

assert bernoulli(8) == Fraction(-1, 30)
```

> The Analytical Engine weaves algebraical patterns just as the Jacquard loom weaves flowers and leaves.

Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit.
