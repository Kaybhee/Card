const CARD_TYPE_PATTERNS: Array<{ type: string; pattern: RegExp}> = [
    { type: 'Visa', pattern: /^4\d{6,}$/ },
    { type: 'Mastercard', pattern: /^(5[1-5]\d{5,}|2(2[2-9]\d{3}|[3-6]\d{4}|7[01]\d{3}|720\d{2})\d{0,})$/ },
    { type: 'American Express', pattern: /^3[47]\d{5,}$/ },
    { type: 'Discover', pattern: /^6(?:011|5\d{2})\d{3,}$/ },
];

export function detectCard(digits: string): string {
    const match = CARD_TYPE_PATTERNS.find(( { pattern }) => pattern.test(digits));
    return match?.type ?? 'Unknown'
}