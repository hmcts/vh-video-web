export function convertStringToTranslationId(str): string {
    if (!str) {
        return '';
    }
    return str
        .trim()
        .replace(/[,\s’'/]/g, '-')
        .toLowerCase();
}
