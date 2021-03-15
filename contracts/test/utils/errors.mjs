// Original file: https://github.com/scale-it/algorand-builder/blob/master/packages/runtime/test/helpers/errors.ts

import { RuntimeError } from '@algorand-builder/runtime/build/errors/runtime-errors.js';
import chai from 'chai';

const { assert, AssertionError } = chai;

// Takes string array and executes opcode to expect teal error
export function execExpectError(stack, strs, op, err) {
  return () => {
    for (const s of strs) {
      stack.push(s);
    }
    expectTealError(() => op.execute(stack), err);
  };
}

export function expectTealError(f, errorDescriptor, matchMessage = undefined, errorMessage = undefined) {
  try {
    f();
  } catch (error) {
    assert.instanceOf(error, RuntimeError, errorMessage);
    assert.equal(error.number, errorDescriptor.number, errorMessage);
    assert.notMatch(
      error.message,
      /%[a-zA-Z][a-zA-Z0-9]*%/,
      'TealError has an non-replaced variable tag'
    );

    if (typeof matchMessage === 'string') {
      assert.include(error.message, matchMessage, errorMessage);
    } else if (matchMessage !== undefined) {
      assert.match(error.message, matchMessage, errorMessage);
    }

    return;
  }
  throw new AssertionError(
    `TealError number ${errorDescriptor.number} expected, but no Error was thrown`
  );
}

export async function expectTealErrorAsync(f, errorDescriptor, matchMessage = undefined) {
  // We create the error here to capture the stack trace before the await.
  // This makes things easier, at least as long as we don't have async stack
  // traces. This may change in the near-ish future.
  const error = new AssertionError(
    `TealError number ${errorDescriptor.number} expected, but no Error was thrown`
  );

  const match = String(matchMessage);
  const notExactMatch = new AssertionError(
    `TealError was correct, but should have include "${match}" but got "`
  );

  const notRegexpMatch = new AssertionError(
    `TealError was correct, but should have matched regex ${match} but got "`
  );

  try {
    await f();
  } catch (error) {
    assert.instanceOf(error, RuntimeError);
    assert.equal(error.number, errorDescriptor.number);
    assert.notMatch(
      error.message,
      /%[a-zA-Z][a-zA-Z0-9]*%/,
      'TealError has an non-replaced variable tag'
    );

    if (matchMessage !== undefined) {
      if (typeof matchMessage === 'string') {
        if (!error.message.includes(matchMessage)) {
          notExactMatch.message += `${String(error.message)}`;
          throw notExactMatch;
        }
      } else {
        if (matchMessage.exec(error.message) === null) {
          notRegexpMatch.message += `${String(error.message)}`;
          throw notRegexpMatch;
        }
      }
    }

    return;
  }

  throw error;
}
