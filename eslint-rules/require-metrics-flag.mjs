/**
 * ESLint rule to enforce that metrics method calls are wrapped in __METRICS__ flag check
 *
 * Rule: Metrics method calls (metrics.count, metrics.distribution, etc.) must be
 * inside an if (__METRICS__) { ... } block to prevent performance overhead in production.
 *
 * @example
 * // ✓ Correct
 * if (__METRICS__) {
 *   metrics.count('event', 1)
 * }
 *
 * // ✗ Incorrect
 * metrics.count('event', 1)  // No __METRICS__ check
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Metrics method calls must be wrapped in __METRICS__ flag check',
      category: 'Best Practices',
    },
    messages: {
      metricsNotGuarded:
        'Metrics method "{{ method }}" must be called within an "if (__METRICS__)" block',
    },
  },
  create(context) {
    let insideMetricsCheck = false
    let metricsCheckDepth = 0

    return {
      IfStatement(node) {
        // Check if this is: if (__METRICS__) { ... }
        if (isMetricsFlagCheck(node.test)) {
          insideMetricsCheck = true
          metricsCheckDepth++
        }
      },
      'IfStatement:exit'(node) {
        if (isMetricsFlagCheck(node.test)) {
          metricsCheckDepth--
          if (metricsCheckDepth === 0) {
            insideMetricsCheck = false
          }
        }
      },
      CallExpression(node) {
        // Check if this is a metrics method call (metrics.count, metrics.distribution, etc.)
        if (isMetricsCall(node) && !insideMetricsCheck) {
          context.report({
            node,
            messageId: 'metricsNotGuarded',
            data: {
              method: getMethodName(node),
            },
          })
        }
      },
    }
  },
}

/**
 * Check if the test expression is checking the __METRICS__ flag
 * Handles: __METRICS__, __METRICS__ === true, __METRICS__ && condition, condition && __METRICS__, etc.
 */
function isMetricsFlagCheck(node) {
  // Simple case: if (__METRICS__)
  if (node.type === 'Identifier' && node.name === '__METRICS__') {
    return true
  }

  // Binary expression: if (__METRICS__ === true)
  if (node.type === 'BinaryExpression' && node.operator === '===') {
    const { left, right } = node
    if (
      left.type === 'Identifier' &&
      left.name === '__METRICS__' &&
      right.value === true
    ) {
      return true
    }
    if (
      right.type === 'Identifier' &&
      right.name === '__METRICS__' &&
      left.value === true
    ) {
      return true
    }
  }

  // Logical AND expression: if (__METRICS__ && condition) or if (condition && __METRICS__)
  if (node.type === 'LogicalExpression' && node.operator === '&&') {
    // Check if either side contains __METRICS__ flag check
    return isMetricsFlagCheck(node.left) || isMetricsFlagCheck(node.right)
  }

  return false
}

/**
 * Check if the node is a metrics method call
 * Matches: metrics.count(...), metrics.distribution(...), metrics.gauge(...), etc.
 */
function isMetricsCall(node) {
  const callee = node.callee

  // Check for metrics.method pattern
  if (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'metrics'
  ) {
    // Validate it's a known metrics method
    const methodName = callee.property.name
    const metricsMethod = ['count', 'distribution', 'gauge']
    return metricsMethod.includes(methodName)
  }

  return false
}

/**
 * Extract the method name for error message
 */
function getMethodName(node) {
  if (node.callee.type === 'MemberExpression') {
    return `metrics.${node.callee.property.name}`
  }
  return 'metrics'
}
