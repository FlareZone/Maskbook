import { describe, test, expect } from 'vitest'
import { formatCurrency } from '../../src/helpers/formatCurrency.js'

describe('USD Currency price format util test', () => {
    test.each([
        { give: 0, expected: '$0.00' },
        { give: 0.1, expected: '$0.1' },
        { give: 0.2, expected: '$0.2' },
        { give: 0.12, expected: '$0.12' },
        { give: 0.1234111, expected: '$0.123411' },
        { give: 0.1234115, expected: '$0.123412' },
        { give: 1, expected: '$1.00' },
        { give: 1.1, expected: '$1.10' },
        { give: 1.55, expected: '$1.55' },
        { give: 2, expected: '$2.00' },
        { give: 2.11, expected: '$2.11' },
        { give: 2.111, expected: '$2.11' },
        { give: 2.115, expected: '$2.12' },
        { give: 2000000000000, expected: '$2,000,000,000,000.00' },
        { give: 0.1234, expected: '$0.1234' },
        { give: 0.1234111, expected: '$0.123411' },
        { give: 0.1234115, expected: '$0.123412' },
        { give: 0.000001, expected: '$0.000001' },
        { give: 0.00000101, expected: '$0.000001' },
        { give: 0.000002, expected: '$0.000002' },
        { give: 1e-9, options: { boundaries: { min: 0.000001, expand: 6 } }, expected: '$0.000000001' },
        { give: 1e-13, options: { boundaries: { min: 0.000001, expand: 6 } }, expected: '< $0.000000000001' },
        { give: 0.9993631112, expected: '$0.999363' },
        { give: 1.999363, expected: '$2.00' },
    ])('.formatCurrency($give)', ({ give, options, expected }) => {
        expect(formatCurrency(give, undefined, options)).toBe(expected)
    })
})

describe('USD Currency value format util test', () => {
    test.each([{ give: 0.001, expected: '< 0.01' }])('.format($give)', ({ give, expected }) => {
        expect(
            formatCurrency(give, 'USD', { boundaries: { min: 0.01, minExp: 2, expandExp: 0 }, symbols: { $: '' } }),
        ).toBe(expected)
    })
})

describe('EUR Currency format util test', () => {
    test.each([
        { give: 0, expected: '\u20AC0.00' },
        { give: 0.1, expected: '\u20AC0.1' },
        { give: 0.2, expected: '\u20AC0.2' },
        { give: 0.12, expected: '\u20AC0.12' },
        { give: 0.1234111, expected: '\u20AC0.123411' },
        { give: 0.1234115, expected: '\u20AC0.123412' },
        { give: 1, expected: '\u20AC1.00' },
        { give: 1.1, expected: '\u20AC1.10' },
        { give: 1.55, expected: '\u20AC1.55' },
        { give: 2, expected: '\u20AC2.00' },
        { give: 2.11, expected: '\u20AC2.11' },
        { give: 2.111, expected: '\u20AC2.11' },
        { give: 2.115, expected: '\u20AC2.12' },
        { give: 2000000000000, expected: '\u20AC2,000,000,000,000.00' },
        { give: 0.1234, expected: '\u20AC0.1234' },
        { give: 0.1234111, expected: '\u20AC0.123411' },
        { give: 0.1234115, expected: '\u20AC0.123412' },
        { give: 0.000001, expected: '\u20AC0.000001' },
        { give: 0.00000101, expected: '\u20AC0.000001' },
        { give: 0.000002, expected: '\u20AC0.000002' },
        { give: 1e-15, expected: '< \u20AC0.000000000001' },
    ])('.format($give)', ({ give, expected }) => {
        expect(formatCurrency(give, 'EUR')).toBe(expected)
    })
})

describe('Digital currency format util test', () => {
    test.each([
        { give: 0, currency: 'ETH', expected: '0.00 \u039E' },
        { give: 1.55, currency: 'ETH', expected: '1.55 \u039E' },
        { give: 1.55, currency: 'BTC', expected: '1.55 \u20BF' },
        { give: 0, currency: 'MATIC', expected: '0.00 MATIC' },
        { give: 0.00000001, currency: 'MATIC', expected: '< 0.000001 MATIC' },
        { give: 1.55, currency: 'MATIC', expected: '1.55 MATIC' },
    ])('.format($give)', ({ give, currency, expected }) => {
        const result = formatCurrency(give, currency)

        expect(result).toBe(expected)
    })
})

describe('None currency format util test', () => {
    test.each([
        { give: 0, currency: '', expected: '0.00 ' },
        { give: 1.55, currency: '', expected: '1.55 ' },
        { give: 0.00000001, currency: '', expected: '< 0.000001 ' },
    ])('.format($give)', ({ give, currency, expected }) => {
        const result = formatCurrency(give, currency)
        expect(result).toBe(expected)
    })
})