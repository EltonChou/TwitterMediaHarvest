/**
 * Tests for the require-metrics-flag ESLint rule
 */
import rule from './require-metrics-flag.mjs'
import tsParser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

ruleTester.run('require-metrics-flag', rule, {
  valid: [
    // ✓ Correct: metrics call wrapped in __METRICS__ check
    {
      code: `
        if (__METRICS__) {
          metrics.count('event', 1)
        }
      `,
    },
    // ✓ Correct: metrics.distribution wrapped
    {
      code: `
        if (__METRICS__) {
          metrics.distribution('latency', 100)
        }
      `,
    },
    // ✓ Correct: nested metrics calls in check
    {
      code: `
        if (__METRICS__) {
          metrics.count('event1', 1)
          metrics.distribution('event2', 50)
        }
      `,
    },
    // ✓ Correct: no metrics call
    {
      code: `
        if (__METRICS__) {
          console.log('something')
        }
      `,
    },
    // ✓ Correct: non-metrics call outside check
    {
      code: `
        console.log('some logging')
      `,
    },
    // ✓ Correct: metrics.gauge wrapped
    {
      code: `
        if (__METRICS__) {
          metrics.gauge('memory', 512)
        }
      `,
    },
    // ✓ Correct: metrics call with combined condition (__METRICS__ && other)
    {
      code: `
        if (__METRICS__ && isEverythingOk) {
          metrics.count('event', 1)
        }
      `,
    },
    // ✓ Correct: metrics call with combined condition (other && __METRICS__)
    {
      code: `
        if (isEverythingOk && __METRICS__) {
          metrics.distribution('latency', 100)
        }
      `,
    },
    // ✓ Correct: metrics call with __METRICS__ === true
    {
      code: `
        if (__METRICS__ === true) {
          metrics.count('event', 1)
        }
      `,
    },
  ],
  invalid: [
    // ✗ Error: metrics call without __METRICS__ check
    {
      code: `metrics.count('event', 1)`,
      errors: [
        {
          messageId: 'metricsNotGuarded',
          data: { method: 'metrics.count' },
        },
      ],
    },
    // ✗ Error: metrics.distribution without check
    {
      code: `metrics.distribution('latency', 100)`,
      errors: [
        {
          messageId: 'metricsNotGuarded',
          data: { method: 'metrics.distribution' },
        },
      ],
    },
    // ✗ Error: metrics call in wrong context
    {
      code: `
        if (someCondition) {
          metrics.count('event', 1)
        }
      `,
      errors: [
        {
          messageId: 'metricsNotGuarded',
          data: { method: 'metrics.count' },
        },
      ],
    },
    // ✗ Error: metrics.gauge without check
    {
      code: `metrics.gauge('memory', 512)`,
      errors: [
        {
          messageId: 'metricsNotGuarded',
          data: { method: 'metrics.gauge' },
        },
      ],
    },
    // ✗ Error: metrics call with OR condition (doesn't guarantee __METRICS__)
    {
      code: `
        if (__METRICS__ || someCondition) {
          metrics.count('event', 1)
        }
      `,
      errors: [
        {
          messageId: 'metricsNotGuarded',
          data: { method: 'metrics.count' },
        },
      ],
    },
  ],
})

// eslint-disable-next-line no-console
console.log('All rule tests passed!')
