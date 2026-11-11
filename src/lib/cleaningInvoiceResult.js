export function getCleaningInvoiceBatchNotice(batch, bookAndSend) {
  const { succeeded, failed, skipped } = batch ?? {};
  if (![succeeded, failed, skipped].every(count => Number.isSafeInteger(count) && count >= 0)) {
    return {
      type: 'error',
      message: 'The server did not report the invoice results. Check e-conomic before trying again.',
    };
  }

  const completed = bookAndSend
    ? `${succeeded} booked for email`
    : `${succeeded} ${succeeded === 1 ? 'draft' : 'drafts'} created`;
  return {
    type: failed > 0 ? 'error' : succeeded > 0 ? 'success' : 'info',
    message: `${completed}, ${failed} failed, ${skipped} skipped.`,
  };
}
