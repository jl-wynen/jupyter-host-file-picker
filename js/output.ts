/**
 * Format a size in bytes as a human-readable string.
 * @param size Size in bytes.
 */
export function humanSize(size: number | null): HTMLSpanElement {
    const span = document.createElement("span");
    if (size === null) {
        span.innerText = "ERROR";
    } else {
        const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
        const value = (size / Math.pow(1024, i)).toFixed(2);
        const unit = ["B", "kiB", "MiB", "GiB", "TiB"][i];
        span.innerText = `${value} ${unit}`;
    }
    return span;
}

/**
 * Format an approximate duration in seconds.
 *
 * This function returns a rough approximation of the duration between two dates.
 * This is useful for displaying times in the past where the precise time does not
 * matter or cannot be displayed, e.g., because it is not updated continuously.
 *
 * This function is less precise and more concise than common packages for
 * date formatting to reduce the size of dates in the folder view.
 *
 * @param date Date to display.
 * @param reference Reference date.
 * @returns Approximate duration in from `date` to `reference`.
 */
export function approxDurationSince(date: Date, reference: Date): string {
    const diff = (reference.getTime() - date.getTime()) / 1000; // time delta in seconds
    if (diff < 0) {
        return date.toISOString();
    }
    if (diff < 5) {
        return "now";
    }
    if (diff < 60) {
        return "seconds ago";
    }
    if (diff < 3600) {
        return `${Math.round(diff / 60)}min ago`;
    }
    if (diff < 3600 * 24) {
        return `${Math.round(diff / 3600)}h ago`;
    }
    const days = Math.round(diff / 3600 / 24);
    if (days == 1) {
        return "yesterday";
    }
    return `${days} days ago`;
}
