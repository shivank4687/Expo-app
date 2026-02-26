let contactNeedsRefresh = false;

export function markContactUpdated() {
    contactNeedsRefresh = true;
}

export function consumeContactUpdate() {
    const wasPending = contactNeedsRefresh;
    contactNeedsRefresh = false;
    return wasPending;
}
