import { getLanguage } from 'obsidian';

export type Lang = 'zh' | 'en';

export interface Locale {
	// Ribbon & commands
	ribbonTooltip: string;
	// Notices
	noFileOpen: string;
	conversionDone: string;
	conversionEnabled: string;
	conversionDisabled: string;
	// Context menu
	contextMenuTitle: string;
	// Settings
	settingsEnableTitle: string;
	settingsEnableDesc: string;
	settingsRulesHeading: string;
	settingsDeleteTooltip: string;
	settingsAddHeading: string;
	settingsFromLabel: string;
	settingsToLabel: string;
	settingsAddButton: string;
	settingsLanguageLabel: string;
	settingsLanguageDesc: string;
	settingsIgnoreCodeBlocksTitle: string;
	settingsIgnoreCodeBlocksDesc: string;
	ignoreCodeBlocksEnabled: string;
	ignoreCodeBlocksDisabled: string;
	settingsIgnoreMathTitle: string;
	settingsIgnoreMathDesc: string;
	ignoreMathEnabled: string;
	ignoreMathDisabled: string;
	settingsIgnoreFrontmatterTitle: string;
	settingsIgnoreFrontmatterDesc: string;
	ignoreFrontmatterEnabled: string;
	ignoreFrontmatterDisabled: string;
	statusBarEnabled: string;
	statusBarDisabled: string;
}

export const LOCALES: Record<Lang, Locale> = {
	zh: {
		ribbonTooltip: '转换标点',
		noFileOpen: '未打开任何文档',
		conversionDone: '标点转换完成',
		conversionEnabled: '标点自动转换已启用',
		conversionDisabled: '标点自动转换已禁用',
		contextMenuTitle: '转换选中标点',
		settingsEnableTitle: '启用实时转换',
		settingsEnableDesc: '在编辑时自动将中文标点转为英文标点',
		settingsRulesHeading: '转换规则',
		settingsDeleteTooltip: '删除规则',
		settingsAddHeading: '添加新规则',
		settingsFromLabel: '原标点',
		settingsToLabel: '目标标点',
		settingsAddButton: '添加',
		settingsLanguageLabel: '界面语言',
		settingsLanguageDesc: '设置页面的显示语言',
		settingsIgnoreCodeBlocksTitle: '忽略代码块',
		settingsIgnoreCodeBlocksDesc: '跳过代码块和行内代码中的标点转换',
		ignoreCodeBlocksEnabled: '已启用忽略代码块',
		ignoreCodeBlocksDisabled: '已禁用忽略代码块',
		settingsIgnoreMathTitle: '忽略数学公式',
		settingsIgnoreMathDesc: '跳过 $...$ 和 $$...$$ 数学公式中的标点转换',
		ignoreMathEnabled: '已启用忽略数学公式',
		ignoreMathDisabled: '已禁用忽略数学公式',
		settingsIgnoreFrontmatterTitle: '忽略 Frontmatter',
		settingsIgnoreFrontmatterDesc: '跳过 YAML frontmatter 区域中的标点转换',
		ignoreFrontmatterEnabled: '已启用忽略 Frontmatter',
		ignoreFrontmatterDisabled: '已禁用忽略 Frontmatter',
			statusBarEnabled: '标点转换: 开',
			statusBarDisabled: '标点转换: 关',
	},
	en: {
		ribbonTooltip: 'Convert punctuation',
		noFileOpen: 'No file open',
		conversionDone: 'Punctuation conversion complete',
		conversionEnabled: 'Punctuation auto-conversion enabled',
		conversionDisabled: 'Punctuation auto-conversion disabled',
		contextMenuTitle: 'Convert selected punctuation',
		settingsEnableTitle: 'Enable real-time conversion',
		settingsEnableDesc: 'Automatically convert Chinese punctuation while typing',
		settingsRulesHeading: 'Conversion rules',
		settingsDeleteTooltip: 'Delete rule',
		settingsAddHeading: 'Add new rule',
		settingsFromLabel: 'Source punctuation',
		settingsToLabel: 'Target punctuation',
		settingsAddButton: 'Add',
		settingsLanguageLabel: 'Interface language',
		settingsLanguageDesc: 'Display language for the settings page',
		settingsIgnoreCodeBlocksTitle: 'Ignore code blocks',
		settingsIgnoreCodeBlocksDesc: 'Skip punctuation conversion inside code blocks and inline code',
		ignoreCodeBlocksEnabled: 'Ignore code blocks enabled',
		ignoreCodeBlocksDisabled: 'Ignore code blocks disabled',
		settingsIgnoreMathTitle: 'Ignore math regions',
		settingsIgnoreMathDesc: 'Skip punctuation conversion inside $...$ and $$...$$ math regions',
		ignoreMathEnabled: 'Ignore math regions enabled',
		ignoreMathDisabled: 'Ignore math regions disabled',
		settingsIgnoreFrontmatterTitle: 'Ignore frontmatter',
		settingsIgnoreFrontmatterDesc: 'Skip punctuation conversion inside YAML frontmatter',
		ignoreFrontmatterEnabled: 'Ignore frontmatter enabled',
		ignoreFrontmatterDisabled: 'Ignore frontmatter disabled',
	statusBarEnabled: 'Conv: ON',
	statusBarDisabled: 'Conv: OFF',
	},
};

export function getLang(): Lang {
	const locale = getLanguage();
	if (typeof locale === 'string' && locale.startsWith('zh')) return 'zh';
	return 'en';
}
export const COMMAND_PREFIX = {
	en: 'Chinese Punctuation Converter',
	zh: '中文标点转换',
};
export const COMMAND_NAMES = {
	toggle: { en: 'Enable/disable auto-conversion', zh: '启用/禁用自动转换' },
	convertFile: { en: 'Convert current file punctuation', zh: '转换当前文档标点' },
	toggleIgnoreCodeBlocks: { en: 'Enable/disable ignore code blocks', zh: '启用/禁用忽略代码块' },
	toggleIgnoreMath: { en: 'Enable/disable ignore math regions', zh: '启用/禁用忽略数学公式' },
	toggleIgnoreFrontmatter: { en: 'Enable/disable ignore frontmatter', zh: '启用/禁用忽略 Frontmatter' },
};