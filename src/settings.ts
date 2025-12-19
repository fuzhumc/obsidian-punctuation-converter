import { App, PluginSettingTab, Setting } from 'obsidian';
import PunctuationConverter from './main';

export interface PunctuationRule {
  enabled: boolean;
  from: string;
  to: string;
}

// 支持的转换
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
  { enabled: true, from: '、', to: '\\' },
  { enabled: true, from: '「', to: '{' },
  { enabled: true, from: '」', to: '}' },
  { enabled: true, from: '·', to: '`' },
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

    containerEl.createEl('h4', { text: '转换规则' });
    // 动态生成规则开关
    for (const rule of this.plugin.settings.rules) {
      new Setting(containerEl)
        .setName(`${rule.from} → ${rule.to}`)
        .addToggle(toggle =>
          toggle
            .setValue(rule.enabled)
            .onChange(async (value) => {
              rule.enabled = value;
              await this.plugin.saveSettings();
            })
        );
    }
  }
}