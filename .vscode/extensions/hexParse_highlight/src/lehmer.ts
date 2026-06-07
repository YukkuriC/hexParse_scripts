// 生成于 GLM-5V-Turbo
/** Maximum number of elements in a Lehmer sequence */
const MAX_COUNT = 20

/**
 * Calculate Lehmer code from a permutation sequence.
 * Ported from CommandLehmerHelper.CalcLehmer (HexParseMod)
 *
 * @param orders - Array of integers representing the permutation
 * @returns The Lehmer code as a bigint, or null if input is invalid
 */
export function calcLehmer(orders: number[]): bigint | null {
    if (orders.length === 0 || orders.length > MAX_COUNT) return null

    let res = 0n
    let frac = 1n

    for (let offset = 1; offset < orders.length; offset++) {
        frac *= BigInt(offset)
        const pos = orders.length - 1 - offset
        const cur = orders[pos]
        let cnt = 0
        for (let j = pos; j < orders.length; j++) {
            if (orders[j] < cur) cnt++
        }
        res += frac * BigInt(cnt)
    }

    return res
}

/**
 * Parse a string of integers separated by whitespace, commas, or semicolons
 * into a number array.
 * Returns null if any token is not a valid integer.
 */
export function parseLehmerInput(input: string): number[] | null {
    const raw = input.split(/[\s,;]+/)
    const orders: number[] = []
    for (const seg of raw) {
        if (seg === '') continue
        const num = Number(seg)
        if (!Number.isInteger(num)) return null
        orders.push(num)
        if (orders.length > MAX_COUNT) return null
    }
    return orders.length > 0 ? orders : null
}
