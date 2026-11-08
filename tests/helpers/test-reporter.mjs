/**
 * Lightweight assertion framework and test reporter for opaque-box E2E suites
 */

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

class AssertionFailure extends Error {
  constructor(message, expected, actual) {
    super(message);
    this.name = 'AssertionFailure';
    this.expected = expected;
    this.actual = actual;
  }
}

export function expect(actual) {
  return {
    toBe(expected, msg) {
      if (actual !== expected) {
        throw new AssertionFailure(
          msg || `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`,
          expected,
          actual
        );
      }
    },
    toEqual(expected, msg) {
      const a = JSON.stringify(actual);
      const e = JSON.stringify(expected);
      if (a !== e) {
        throw new AssertionFailure(
          msg || `Expected ${a} to equal ${e}`,
          expected,
          actual
        );
      }
    },
    toBeTruthy(msg) {
      if (!actual) {
        throw new AssertionFailure(
          msg || `Expected ${JSON.stringify(actual)} to be truthy`,
          true,
          actual
        );
      }
    },
    toBeFalsy(msg) {
      if (actual) {
        throw new AssertionFailure(
          msg || `Expected ${JSON.stringify(actual)} to be falsy`,
          false,
          actual
        );
      }
    },
    toBeNull(msg) {
      if (actual !== null) {
        throw new AssertionFailure(
          msg || `Expected ${JSON.stringify(actual)} to be null`,
          null,
          actual
        );
      }
    },
    toBeGreaterThan(expected, msg) {
      if (!(actual > expected)) {
        throw new AssertionFailure(
          msg || `Expected ${actual} to be greater than ${expected}`,
          `> ${expected}`,
          actual
        );
      }
    },
    toBeGreaterThanOrEqual(expected, msg) {
      if (!(actual >= expected)) {
        throw new AssertionFailure(
          msg || `Expected ${actual} to be >= ${expected}`,
          `>= ${expected}`,
          actual
        );
      }
    },
    toBeLessThan(expected, msg) {
      if (!(actual < expected)) {
        throw new AssertionFailure(
          msg || `Expected ${actual} to be less than ${expected}`,
          `< ${expected}`,
          actual
        );
      }
    },
    toBeLessThanOrEqual(expected, msg) {
      if (!(actual <= expected)) {
        throw new AssertionFailure(
          msg || `Expected ${actual} to be <= ${expected}`,
          `<= ${expected}`,
          actual
        );
      }
    },
    toBeCloseTo(expected, delta = 5, msg) {
      if (Math.abs(actual - expected) > delta) {
        throw new AssertionFailure(
          msg || `Expected ${actual} to be close to ${expected} within +/-${delta} (difference: ${Math.abs(actual - expected)})`,
          `close to ${expected} (+/-${delta})`,
          actual
        );
      }
    },
    toContain(substrOrItem, msg) {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        if (!actual.includes(substrOrItem)) {
          throw new AssertionFailure(
            msg || `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(substrOrItem)}`,
            `contains ${substrOrItem}`,
            actual
          );
        }
      } else {
        throw new AssertionFailure('toContain target is neither string nor array', true, false);
      }
    },
    toNotContain(substrOrItem, msg) {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        if (actual.includes(substrOrItem)) {
          throw new AssertionFailure(
            msg || `Expected ${JSON.stringify(actual)} NOT to contain ${JSON.stringify(substrOrItem)}`,
            `excludes ${substrOrItem}`,
            actual
          );
        }
      }
    },
    toMatch(regex, msg) {
      if (!regex.test(String(actual))) {
        throw new AssertionFailure(
          msg || `Expected ${JSON.stringify(actual)} to match regex ${regex}`,
          regex.toString(),
          actual
        );
      }
    },
  };
}

export class TestContext {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.tests = [];
    this.currentDescribe = '';
  }

  describe(title, fn) {
    const prev = this.currentDescribe;
    this.currentDescribe = prev ? `${prev} > ${title}` : title;
    try {
      fn();
    } finally {
      this.currentDescribe = prev;
    }
  }

  async it(title, fn) {
    const fullName = this.currentDescribe ? `${this.currentDescribe} > ${title}` : title;
    const start = Date.now();
    try {
      await fn();
      const durationMs = Date.now() - start;
      this.tests.push({
        name: fullName,
        passed: true,
        durationMs,
        error: null,
      });
      console.log(`  ${ANSI.green}PASS${ANSI.reset} ${fullName} ${ANSI.gray}(${durationMs}ms)${ANSI.reset}`);
    } catch (err) {
      const durationMs = Date.now() - start;
      this.tests.push({
        name: fullName,
        passed: false,
        durationMs,
        error: err.message || String(err),
        stack: err.stack,
      });
      console.log(`  ${ANSI.red}FAIL${ANSI.reset} ${fullName} ${ANSI.gray}(${durationMs}ms)${ANSI.reset}`);
      console.log(`       ${ANSI.red}Error: ${err.message}${ANSI.reset}`);
    }
  }

  getSummary() {
    const total = this.tests.length;
    const passed = this.tests.filter((t) => t.passed).length;
    const failed = total - passed;
    return {
      suiteName: this.suiteName,
      total,
      passed,
      failed,
      tests: this.tests,
    };
  }
}
