export const parseValidDate = (dateString?: string | null): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    if (year < 1900) return null;
    return date;
};
