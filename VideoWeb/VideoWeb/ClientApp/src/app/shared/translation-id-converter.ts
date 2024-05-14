export function convertStringToTranslationId(str): string {
    if (!str) {
        return '';
    }
    return str.replace(/[\s’']/g, '-').toLowerCase();
}
