import { emitError } from '@/utils/errors';

export function InvalidResponse(response=null) {
  const error = new Error('Invalid Response');
  error.response = response;
  return error;
}

InvalidResponse.prototype = Object.create(Error.prototype);

export async function handleNodeExceptions(e) {
  const insufficientFundsError = /TransactionPool\.Remember: transaction [A-Z0-9]+: underflow on subtracting \d+ from sender amount \d+/g;
  const belowMinimumError = /TransactionPool\.Remember: transaction [A-Z0-9]+: account [A-Z0-9]+ balance \d+ below min (\d+)/g;
  const maxOptedInApps = /TransactionPool\.Remember: transaction [A-Z0-9]+: cannot opt in app [A-Z0-9]+ for [A-Z0-9]+: max opted-in apps per acct is \d+/g;
  let match;
  if (e.message.match(insufficientFundsError)) {
    emitError('Insufficient funds');
    throw e;
    // eslint-disable-next-line no-constant-condition
  } else if ((match = [...e.message.matchAll(belowMinimumError)]).length > 0) {
    const minimumBalance = (Number(match[0][1]) / (10 ** 6)).toFixed(6);
    emitError(`After this transaction, the balance would fall below the minimum of ${minimumBalance} Algos`);
    throw e;
  } else if (e.message.match(maxOptedInApps)) {
    emitError('Maximum amount of opted-in applications per account exceeded. Use a different account');
    throw e;
  }
  emitError('Unexpected error occured while sending transaction');
  throw e;
}
