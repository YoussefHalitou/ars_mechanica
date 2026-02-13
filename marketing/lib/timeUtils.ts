export function formatTimeInput(val: string): string {
    val = val.trim();
    if (!val) return "";
    
    // Remove all non-digits first to clean up input like "8:00" or "08.00"
    let digits = val.replace(/[^0-9]/g, "");
    
    // Case 1: "8" -> "08:00"
    if (digits.length === 1) {
        return "0" + digits + ":00";
    }
    // Case 2: "80" -> "08:00" (Ambiguous? Assume hour if < 24? Or "80" could be 8:00 if user types 8 0)
    // Actually "12" -> "12:00". "8" -> "08:00".
    if (digits.length === 2) {
        // If > 24, tricky. But assumes hours.
        return digits + ":00";
    }
    // Case 3: "800" -> "08:00"
    if (digits.length === 3) {
        return "0" + digits.slice(0, 1) + ":" + digits.slice(1);
    }
    // Case 4: "0800" -> "08:00", "1230" -> "12:30"
    if (digits.length === 4) {
        return digits.slice(0, 2) + ":" + digits.slice(2);
    }

    return val;
}
