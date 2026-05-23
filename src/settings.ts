import { App, PluginSettingTab, Setting } from 'obsidian';
import PunctuationConverter from './main';
import { type Lang, type Locale, LOCALES, getLang } from './locale';

export interface PunctuationRule {
	enabled: boolean;
	from: string;
	to: string;
}

export const DEFAULT_RULES: PunctuationRule[] = [
	{ enabled: true, from: '，', to: ',' },
	{ enabled: true, from: '。', to: '.' },
	{ enabled: true, from: '：', to: ':' },
	{ enabled: true, from: '；', to: ';' },
	{ enabled: true, from: '！', to: '!' },
	{ enabled: true, from: '？', to: '?' },
	{ enabled: true, from: '【', to: '[' },
	{ enabled: true, from: '】', to: ']' },
	{ enabled: true, from: '（', to: '(' },
	{ enabled: true, from: '）', to: ')' },
	{ enabled: true, from: '《', to: '<' },
	{ enabled: true, from: '》', to: '>' },
	{ enabled: true, from: '“', to: '"' },
	{ enabled: true, from: '”', to: '"' },
	{ enabled: true, from: '‘', to: "'" },
	{ enabled: true, from: '’', to: "'" },
	{ enabled: true, from: '…', to: '...' },
	{ enabled: true, from: '、', to: ',' },
	{ enabled: true, from: '「', to: '{' },
	{ enabled: true, from: '」', to: '}' },
	{ enabled: true, from: '·', to: '.' },
	{ enabled: true, from: '～', to: '~' },
];

export type UILang = 'auto' | 'zh' | 'en';

export interface PunctuationConverterSettings {
	enabled: boolean;
	rules: PunctuationRule[];
	lang: UILang;
	ignoreCodeBlocks: boolean;
	ignoreMath: boolean;
	ignoreFrontmatter: boolean;
}

export const DEFAULT_SETTINGS: PunctuationConverterSettings = {
	enabled: true,
	rules: [...DEFAULT_RULES],
	lang: 'auto',
	ignoreCodeBlocks: false,
	ignoreMath: false,
	ignoreFrontmatter: false,
};

export function resolveLang(lang: UILang): Lang {
	return lang === 'auto' ? getLang() : lang;
}

export class PunctuationConverterSettingTab extends PluginSettingTab {
	plugin: PunctuationConverter;

	constructor(app: App, plugin: PunctuationConverter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private t(): Locale {
		return LOCALES[resolveLang(this.plugin.settings.lang)];
	}

	display(): void {
		const t = this.t();
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t.settingsLanguageLabel)
			.setDesc(t.settingsLanguageDesc)
			.addDropdown(dropdown =>
				dropdown
					.addOption('auto', 'Auto')
					.addOption('zh', '中文')
					.addOption('en', 'English')
					.setValue(this.plugin.settings.lang)
					.onChange(async (value) => {
						this.plugin.settings.lang = value as UILang;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		new Setting(containerEl)
			.setName(t.settingsEnableTitle)
			.setDesc(t.settingsEnableDesc)
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (value) => {
						this.plugin.settings.enabled = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.settingsIgnoreCodeBlocksTitle)
			.setDesc(t.settingsIgnoreCodeBlocksDesc)
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.ignoreCodeBlocks)
					.onChange(async (value) => {
						this.plugin.settings.ignoreCodeBlocks = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.settingsIgnoreMathTitle)
			.setDesc(t.settingsIgnoreMathDesc)
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.ignoreMath)
					.onChange(async (value) => {
						this.plugin.settings.ignoreMath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.settingsIgnoreFrontmatterTitle)
			.setDesc(t.settingsIgnoreFrontmatterDesc)
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.ignoreFrontmatter)
					.onChange(async (value) => {
						this.plugin.settings.ignoreFrontmatter = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setHeading().setName(t.settingsRulesHeading);

		this.renderRuleList();
		this.renderAddRule();
	}

	private renderRuleList(): void {
		const t = this.t();
		const rulesContainer = this.containerEl.createDiv('punctuation-rules');
		const rules = this.plugin.settings.rules;

		for (let i = 0; i < rules.length; i++) {
			const rule = rules[i]!;
			new Setting(rulesContainer)
				.setName(`${rule.from} → ${rule.to}`)
				.addToggle(toggle =>
					toggle
						.setValue(rule.enabled)
						.onChange(async (value) => {
							rule.enabled = value;
							await this.plugin.saveSettings();
						})
				)
				.addExtraButton(btn =>
					btn
						.setIcon('trash')
						.setTooltip(t.settingsDeleteTooltip)
						.onClick(async () => {
							this.plugin.settings.rules.splice(i, 1);
							await this.plugin.saveSettings();
							this.display();
						})
				);
		}
	}

	private renderAddRule(): void {
		const t = this.t();
		const addContainer = this.containerEl.createDiv('punctuation-add-rule');

		new Setting(addContainer).setHeading().setName(t.settingsAddHeading);

		let fromValue = '';
		let toValue = '';

		new Setting(addContainer)
			.setName(t.settingsFromLabel)
			.addText(text =>
				text.setPlaceholder('，').onChange(value => (fromValue = value))
			);

		new Setting(addContainer)
			.setName(t.settingsToLabel)
			.addText(text =>
				text.setPlaceholder(',').onChange(value => (toValue = value))
			);

		new Setting(addContainer).addButton(btn =>
			btn
				.setButtonText(t.settingsAddButton)
				.setCta()
				.onClick(async () => {
					if (!fromValue || !toValue) return;
					this.plugin.settings.rules.push({
						enabled: true,
						from: fromValue,
						to: toValue,
					});
					await this.plugin.saveSettings();
					this.display();
				})
		);
	}
}