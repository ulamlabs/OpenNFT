import { internalService } from '@/services/internal';
import { emitError } from '@/utils/errors';


export async function checkIfOperationIsCompleted({ state }) {
  const actionResult = state.actionResult;
  const operationId = actionResult['operationId'];
  const response = await internalService.getOperation(operationId);
  if (response['is_pending'] === false) {
    if (response['is_executed'] === true) {
      return true;
    } else {
      emitError('Operation failed');
      return true;
    }
  }
  return false;
}
