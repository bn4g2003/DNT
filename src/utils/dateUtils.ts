/**
 * Date utility functions
 */

/**
 * Safely format a date value to ISO date string (YYYY-MM-DD)
 * Handles various input types: string, Date, Firestore Timestamp
 */
export const formatDateSafe = (dateValue: unknown): string => {
    if (!dateValue) return '';

    try {
        // Handle Firestore Timestamp
        if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
            const date = (dateValue as { toDate: () => Date }).toDate();
            return date.toISOString().split('T')[0];
        }

        // Handle Date object
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
        }

        // Handle string
        if (typeof dateValue === 'string') {
            if (!dateValue.trim()) return '';
            // If already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                return dateValue;
            }
            // Try to parse as date
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }

        return '';
    } catch {
        return '';
    }
};

/**
 * Format date for display (DD/MM/YYYY)
 */
export const formatDate = (dateValue: string | undefined): string | null => {
    if (!dateValue) return null;

    try {
        // Handle various date formats
        const formatted = formatDateSafe(dateValue);
        if (!formatted) return null;

        const [year, month, day] = formatted.split('-');
        return `${day}/${month}/${year}`;
    } catch {
        return null;
    }
};

/**
 * Parse DD/MM/YYYY to YYYY-MM-DD
 */
export const parseDateVN = (vnDate: string): string => {
    if (!vnDate) return '';
    const parts = vnDate.split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 */
export const formatDateVN = (isoDate: string): string => {
    if (!isoDate) return '';
    const formatted = formatDateSafe(isoDate);
    if (!formatted) return '';
    const [y, m, d] = formatted.split('-');
    return `${d}/${m}/${y}`;
};

/**
 * Format date for display (DD/MM/YYYY) - alias for formatDate
 */
export const formatDisplayDate = formatDate;

/**
 * Format date with time for display
 */
export const formatDisplayDateTime = (dateValue: string | undefined): string | null => {
    if (!dateValue) return null;
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleString('vi-VN');
    } catch {
        return null;
    }
};

/**
 * Get relative time (e.g., "2 giờ trước")
 */
export const getRelativeTime = (dateValue: string | undefined): string => {
    if (!dateValue) return '';
    try {
        const date = new Date(dateValue);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 30) return `${diffDays} ngày trước`;
        return formatDate(dateValue) || '';
    } catch {
        return '';
    }
};
