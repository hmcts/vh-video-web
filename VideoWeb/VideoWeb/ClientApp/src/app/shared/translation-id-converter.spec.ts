import { convertTranslationId } from './translation-id-converter';

describe('convertTranslationId', () => {
    it('should return an empty string if input is null', () => {
        const result = convertTranslationId(null);
        expect(result).toEqual('');
    });

    it('should return an empty string if input is undefined', () => {
        const result = convertTranslationId(undefined);
        expect(result).toEqual('');
    });

    it('should return the correct string to translate id', () => {
        const result = convertTranslationId('Insolvency');
        expect(result).toBe('insolvency');
    });

    it('should return the correct string to translate id with spaces', () => {
        const result = convertTranslationId('Primary Health Lists');
        expect(result).toBe('primary-health-lists');
    });

    it('should return the correct string to translate id with spaces and special characters', () => {
        const result = convertTranslationId('MP’s Expenses');
        expect(result).toBe('mp-s-expenses');
    });
});
