"use strict";
/**
 * Schedule parsing utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAY_NAMES = void 0;
exports.parseSchedule = parseSchedule;
exports.generateSessionDates = generateSessionDates;
// Day mapping for Vietnamese schedule strings
const DAY_MAP = {
    'chủ nhật': 0, 'cn': 0,
    'thứ 2': 1, 'thứ hai': 1, 't2': 1,
    'thứ 3': 2, 'thứ ba': 2, 't3': 2,
    'thứ 4': 3, 'thứ tư': 3, 't4': 3,
    'thứ 5': 4, 'thứ năm': 4, 't5': 4,
    'thứ 6': 5, 'thứ sáu': 5, 't6': 5,
    'thứ 7': 6, 'thứ bảy': 6, 't7': 6,
};
exports.DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
/**
 * Parse schedule string to extract days and time
 * Input: "14:00-15:30 T2, T4, T6" or "14:00-15:30 Thứ 2, Thứ 4, Thứ 6"
 * Output: { time: "14:00-15:30", days: [1, 3, 5] }
 */
function parseSchedule(schedule) {
    console.log(`[parseSchedule] Input: "${schedule}"`);
    if (!schedule) {
        console.log(`[parseSchedule] Empty schedule, returning empty`);
        return { time: null, days: [] };
    }
    const scheduleLower = schedule.toLowerCase();
    const days = new Set();
    // Parse Vietnamese day names
    for (const [dayName, dayNum] of Object.entries(DAY_MAP)) {
        if (scheduleLower.includes(dayName)) {
            console.log(`[parseSchedule] Found day "${dayName}" -> ${dayNum}`);
            days.add(dayNum);
        }
    }
    // Parse T2, T4, T6 format
    const tMatches = schedule.match(/T([2-7])/gi);
    if (tMatches) {
        console.log(`[parseSchedule] T-format matches: ${tMatches.join(', ')}`);
        tMatches.forEach(match => {
            const n = parseInt(match.substring(1));
            if (n >= 2 && n <= 7) {
                // T2 = Monday (1), T7 = Saturday (6)
                days.add(n === 7 ? 6 : n - 1);
            }
        });
    }
    // Parse time
    const timeMatch = schedule.match(/(\d{1,2})[h:](\d{2})?\s*[-–]\s*(\d{1,2})[h:](\d{2})?/);
    let time = null;
    if (timeMatch) {
        const startHour = timeMatch[1].padStart(2, '0');
        const startMin = (timeMatch[2] || '00').padStart(2, '0');
        const endHour = timeMatch[3].padStart(2, '0');
        const endMin = (timeMatch[4] || '00').padStart(2, '0');
        time = `${startHour}:${startMin}-${endHour}:${endMin}`;
        console.log(`[parseSchedule] Parsed time: ${time}`);
    }
    else {
        console.log(`[parseSchedule] Could not parse time from: "${schedule}"`);
    }
    const result = {
        time,
        days: Array.from(days).sort()
    };
    console.log(`[parseSchedule] Final result: time="${result.time}", days=[${result.days.join(',')}]`);
    return result;
}
/**
 * Generate session dates based on schedule
 */
function generateSessionDates(startDate, totalSessions, scheduleDays) {
    if (scheduleDays.length === 0 || totalSessions <= 0) {
        return [];
    }
    const sessions = [];
    let currentDate = new Date(startDate);
    let sessionCount = 0;
    const maxDays = 365; // Safety limit
    let daysChecked = 0;
    while (sessionCount < totalSessions && daysChecked < maxDays) {
        const dayOfWeek = currentDate.getDay();
        if (scheduleDays.includes(dayOfWeek)) {
            sessions.push({
                date: currentDate.toISOString().split('T')[0],
                dayOfWeek: exports.DAY_NAMES[dayOfWeek]
            });
            sessionCount++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
        daysChecked++;
    }
    return sessions;
}
//# sourceMappingURL=scheduleParser.js.map