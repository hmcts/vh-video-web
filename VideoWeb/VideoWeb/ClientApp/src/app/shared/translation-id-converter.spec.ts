import { convertStringToTranslationId } from './translation-id-converter';

describe('convertStringToTranslationId', () => {
    it('should return an empty string if input is null', () => {
        const result = convertStringToTranslationId(null);
        expect(result).toEqual('');
    });

    it('should return an empty string if input is undefined', () => {
        const result = convertStringToTranslationId(undefined);
        expect(result).toEqual('');
    });

    it('should return the correct string to translate id', () => {
        const result = convertStringToTranslationId('Insolvency');
        expect(result).toBe('insolvency');
    });

    it('should return the correct string to translate id with spaces', () => {
        const result = convertStringToTranslationId('Primary Health Lists');
        expect(result).toBe('primary-health-lists');
    });

    it('should return the correct string to translate id with spaces and special characters', () => {
        const result = convertStringToTranslationId('MP’s Expenses');
        expect(result).toBe('mp-s-expenses');
    });

    it('should return correct string to translate id with forward slash', () => {
        const result = convertStringToTranslationId('Benin/Edo');
        expect(result).toBe('benin-edo');
    });

    it('should return correct string to translate id with comma and spaces', () => {
        const result = convertStringToTranslationId('Kosli, Sambalpuri');
        expect(result).toBe('kosli--sambalpuri');
    });

    it('should return correct string to translate id with slash and spaces', () => {
        const result = convertStringToTranslationId('Palantypist / Speech to text');
        expect(result).toBe('palantypist---speech-to-text');
    });
});
