namespace Helper {
  type ResolvableTime = `${number}${"s" | "m" | "h" | "d" | "y"}`;
  /**
   * Resolves a human-readable time string to milliseconds.
   * @param times The time strings to resolve.
   * @example
   * // Resolves to 60000
   * resolveTime("1m");
   * @example
   * // Resolves to 100800000
   * resolveTime("1d", "4h");
   */
  export function resolveTime(...times: ResolvableTime[]) {
    return resolveTimeString(times.join(" "));
  }

  /**
   * Resolves a human-readable time string to milliseconds.
   * @param time The time string to resolve.
   * @example
   * // Resolves to 60000
   * resolveTime("1m");
   * @example
   * // Resolves to 100800000
   * resolveTime("1d 4h");
   */
  export function resolveTimeString(time: string): number {
    const regex = /(\d+)(s|m|h|d|y)/gi;
    let totalMilliseconds = 0;
    let match;

    while ((match = regex.exec(time)) !== null) {
      const amount = parseInt(match[1]);
      const unit = match[2];

      if (unit === "s") totalMilliseconds += amount * 1000;
      if (unit === "m") totalMilliseconds += amount * 1000 * 60;
      if (unit === "h") totalMilliseconds += amount * 1000 * 60 * 60;
      if (unit === "d") totalMilliseconds += amount * 1000 * 60 * 60 * 24;
      if (unit === "y") totalMilliseconds += amount * 1000 * 60 * 60 * 24 * 365;
    }

    return totalMilliseconds;
  }
}

export default Helper;