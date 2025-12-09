# ESLint Rule: require-metrics-flag

## Overview

Custom ESLint rule that enforces all metrics method calls (`metrics.count()`, `metrics.distribution()`, etc.) to be wrapped inside an `if (__METRICS__)` check. This prevents performance overhead from metrics collection in production builds where `__METRICS__` is `false`.

## Why This Rule?

- **Performance**: Metrics code should not execute in production builds
- **Consistency**: Ensures all metrics calls follow the same pattern
- **Type Safety**: Webpack define plugin statically replaces `__METRICS__` flag based on build mode

## Correct Usage

```typescript
// ✓ Always guard metrics calls with __METRICS__ check
if (__METRICS__) {
  metrics.count('download.success', 1)
}

if (__METRICS__) {
  metrics.distribution('search.results', count)
}
```

## Incorrect Usage

```typescript
// ✗ Missing __METRICS__ guard
metrics.count('event', 1) // ESLint Error!

// ✗ Wrong condition context
if (someOtherCondition) {
  metrics.count('event', 1) // ESLint Error!
}

// ✗ Bare metric call
function trackEvent() {
  metrics.count('event', 1) // ESLint Error!
}
```

## Supported Metrics Methods

The rule recognizes the following `metrics.*` methods that require guarding:

- `metrics.count()`
- `metrics.distribution()`
- `metrics.gauge()`

## Configuration

The rule is enabled in `eslint.config.mjs`:

```javascript
'require-metrics-flag/require-metrics-flag': 'error',
```

## Running the Rule

```bash
# Lint with the rule enabled
yarn lint

# ESLint will report violations:
# error  Metrics method "metrics.count" must be called within an "if (__METRICS__)" block
```

## Testing the Rule

```bash
# Run rule tests
node eslint-rules/require-metrics-flag.test.mjs
```

## Implementation Details

The rule uses ESLint's AST visitor pattern to:

1. Track when entering an `if (__METRICS__)` block
2. Check if `metrics.*` method calls are within that context
3. Report violations for unguarded metrics calls

It handles:

- Simple flag check: `if (__METRICS__)`
- Equality check: `if (__METRICS__ === true)`
- Nested metrics calls
- Multiple independent `__METRICS__` blocks
