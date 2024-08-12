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
  
   /**
   * Checks if the given date is today.
   * @param {string | Date} date - The date to check. Can be a string or a Date object.
   * @returns {boolean} - True if the date is today, otherwise false.
   */
  export function isToday(date: string | Date): boolean {
    const today = new Date();
    const givenDate = new Date(date);
    return today.toDateString() === givenDate.toDateString();
  }
  
   /**
   * Get the current date as a string.
   * @returns {string} - The current date in ISO format
   */
   export function getCurrentDate(): string {
      return new Date().toISOString();
   }
   
   /**
   * Validate the description to allow only specific characters.
   * @param {string} description - The description to validate.
   * @returns {boolean} - True if valid, false otherwise.
   */
   export function isValidDescription(description: string):boolean {
      const regex = /^[a-zA-Z0-9 !#?+\-_:!"'{}[\]%]*$/;
      return regex.test(description) && description.length <= 150;
   }
   
}

export default Helper;