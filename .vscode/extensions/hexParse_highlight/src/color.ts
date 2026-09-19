/** 判断是否为合法 #RRGGBB 颜色值 */
export function isHexColor(value: unknown): value is string {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

/** 识别颜色配置特殊值 'theme'：解析为传入的主题色，其余原样返回 */
export function resolveThemeOr(raw: string, themeColor: string): string {
    return raw === 'theme' ? themeColor : raw
}

/** 默认主题色（暗色主题文本色），作为主题解析兜底 */
export const defaultThemeColor = '#d4d4d4'

/** 颜色相关配置的默认值（与 package.json 的 defaults 保持一致；渐变列表的 'theme' 由宿主解析为主题色） */
export const defaultConfigs = {
    patternGradient: ['#aa00ee', 'theme'],
    perWorldColor: '#7f7f7f',
    ballColor: 'theme',
} as const
