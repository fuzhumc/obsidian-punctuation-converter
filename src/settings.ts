import { App, PluginSettingTab, Setting } from 'obsidian';
import PunctuationConverter from './main';

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

export interface PunctuationConverterSettings {
	enabled: boolean;
	rules: PunctuationRule[];
}

export const DEFAULT_SETTINGS: PunctuationConverterSettings = {
	enabled: true,
	rules: [...DEFAULT_RULES],
};

export class PunctuationConverterSettingTab extends PluginSettingTab {
	plugin: PunctuationConverter;

	constructor(app: App, plugin: PunctuationConverter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('启用实时转换')
			.setDesc('在编辑时自动将中文标点转为英文标点')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (value) => {
						this.plugin.settings.enabled = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setHeading().setName('转换规则');

		this.renderRuleList();
		this.renderAddRule();
	}

	private renderRuleList(): void {
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
						.setTooltip('删除规则')
						.onClick(async () => {
							this.plugin.settings.rules.splice(i, 1);
							await this.plugin.saveSettings();
							this.display();
						})
				);
		}
	}

	private renderAddRule(): void {
		const addContainer = this.containerEl.createDiv('punctuation-add-rule');

		new Setting(addContainer).setHeading().setName('添加新规则');

		let fromValue = '';
		let toValue = '';

		new Setting(addContainer)
			.setName('原标点')
			.addText(text =>
				text.setPlaceholder('，').onChange(value => (fromValue = value))
			);

		new Setting(addContainer)
			.setName('目标标点')
			.addText(text =>
				text.setPlaceholder(',').onChange(value => (toValue = value))
			);

		new Setting(addContainer).addButton(btn =>
			btn
				.setButtonText('添加')
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