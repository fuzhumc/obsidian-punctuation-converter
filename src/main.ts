import {
  Plugin,
  Notice,
  TFile,
  Editor,
  MarkdownView,
} from 'obsidian';
import {
  PunctuationConverterSettings,
  DEFAULT_SETTINGS,
  PunctuationConverterSettingTab,
} from './settings';

export default class PunctuationConverter extends Plugin {
  settings!: PunctuationConverterSettings;
  private editorWatchers = new Set<() => void>();

  async onload() {
    await this.loadSettings();

    // 侧边栏按钮
    this.addRibbonIcon('replace-all', '转换标点', async () => {
      const file = this.app.workspace.getActiveFile();
      if (!file) {
        new Notice('未打开任何文档');
        return;
      }
      await this.convertEntireFile(file);
      new Notice('标点转换完成');
    });

    // 注册设置
    this.addSettingTab(new PunctuationConverterSettingTab(this.app, this));

    // 命令：切换启用状态
    this.addCommand({
      id: 'toggle-punctuation-conversion',
      name: '切换中文标点转换',
      callback: async () => {
        this.settings.enabled = !this.settings.enabled;
        await this.saveSettings();
        new Notice(
          this.settings.enabled
            ? '标点自动转换已启用'
            : '标点自动转换已禁用'
        );
      },
    });

    // 命令：转换当前文档
    this.addCommand({
      id: 'convert-current-file-punctuation',
      name: '一键转换当前文档标点',
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice('未打开任何文档');
          return;
        }
        await this.convertEntireFile(file);
        new Notice('标点转换完成');
      },
    });

    // 右键菜单：转换选中文本
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor) => {
        if (!editor.somethingSelected()) return;

        menu.addItem((item) => {
          item
            .setTitle('转换选中标点')
            .setIcon('replace-all')
            .onClick(() => {
              const selection = editor.getSelection();
              let result = selection;
              for (const rule of this.settings.rules) {
                if (rule.enabled) {
                  result = result.replaceAll(rule.from, rule.to);
                }
              }
              if (result !== selection) {
                editor.replaceSelection(result);
              }
            });
        });
      })
    );

    // 监听所有 Markdown 视图
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf?.view instanceof MarkdownView) {
          this.attachEditorListener(leaf.view.editor);
        }
      })
    );

    // 初始化当前编辑器
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      this.attachEditorListener(activeView.editor);
    }
  }

  attachEditorListener(editor: Editor) {
    // 清理旧的监听器（防止重复绑定）
    this.editorWatchers.forEach(dispose => dispose());
    this.editorWatchers.clear();

    if (!editor) return;

    const transformText = (text: string): string => {
      if (!this.settings.enabled) return text;

      let result = text;
      for (const rule of this.settings.rules) {
        if (rule.enabled) {
          result = result.replaceAll(rule.from, rule.to);
        }
      }
      return result !== text ? result : text;
    };

    const dispose = this.watchEditorChanges(editor, transformText);
    this.editorWatchers.add(dispose);
  }

  private watchEditorChanges(
    editor: Editor,
    transformer: (text: string) => string
  ): () => void {
    let lastValue = editor.getValue();

    const offsetToPos = (text: string, offset: number) => {
      let line = 0;
      let ch = 0;
      for (let i = 0; i < offset && i < text.length; i++) {
        if (text[i] === '\n') {
          line++;
          ch = 0;
        } else {
          ch++;
        }
      }
      return { line, ch };
    };

    const checkAndUpdate = () => {
      const currentValue = editor.getValue();
      if (currentValue === lastValue) return;

      // 从两端 diff，找到变更区域
      let prefixLen = 0;
      const minLen = Math.min(lastValue.length, currentValue.length);
      while (prefixLen < minLen && lastValue[prefixLen] === currentValue[prefixLen]) {
        prefixLen++;
      }

      let oldSuffixLen = 0;
      let newSuffixLen = 0;
      const maxSuffix = Math.min(
        lastValue.length - prefixLen,
        currentValue.length - prefixLen
      );
      while (
        oldSuffixLen < maxSuffix &&
        lastValue[lastValue.length - 1 - oldSuffixLen] ===
          currentValue[currentValue.length - 1 - newSuffixLen]
      ) {
        oldSuffixLen++;
        newSuffixLen++;
      }

      const newEnd = currentValue.length - newSuffixLen;
      const insertedText = currentValue.slice(prefixLen, newEnd);
      const transformed = transformer(insertedText);

      if (transformed !== insertedText) {
        editor.replaceRange(
          transformed,
          offsetToPos(currentValue, prefixLen),
          offsetToPos(currentValue, newEnd)
        );
        lastValue = editor.getValue();
      } else {
        lastValue = currentValue;
      }
    };

    const intervalId = window.setInterval(checkAndUpdate, 150);
    return () => window.clearInterval(intervalId);
  }


  async convertEntireFile(file: TFile) {
    const content = await this.app.vault.read(file);
    let newContent = content;

    for (const rule of this.settings.rules) {
      if (rule.enabled) {
        newContent = newContent.replaceAll(rule.from, rule.to);
      }
    }

    if (newContent !== content) {
      await this.app.vault.modify(file, newContent);
    }
  }

  async loadSettings() {
    const raw = (await this.loadData()) as unknown;

    // 安全检查：raw 是否为有效设置对象
    let enabled = DEFAULT_SETTINGS.enabled;
    let rules = [...DEFAULT_SETTINGS.rules];

    if (typeof raw === 'object' && raw !== null) {
      if ('enabled' in raw) {
        const enabledVal = (raw as { enabled?: unknown }).enabled;
        if (typeof enabledVal === 'boolean') {
          enabled = enabledVal;
        }
      }

      if ('rules' in raw) {
        const rulesVal = (raw as { rules?: unknown }).rules;
        if (Array.isArray(rulesVal)) {
          rules = this.validateRules(rulesVal);
        }
      }
    }

    this.settings = { enabled, rules };
  }

  // 辅助方法：校验并修复规则数组
  private validateRules(rules: unknown[]): PunctuationConverterSettings['rules'] {
    if (!Array.isArray(rules)) return [...DEFAULT_SETTINGS.rules];

    return rules
      .map(rule => {
        if (typeof rule !== 'object' || rule === null) {
          return null;
        }
        const r = rule as Record<string, unknown>;
        return {
          enabled: typeof r.enabled === 'boolean' ? r.enabled : true,
          from: typeof r.from === 'string' ? r.from : '',
          to: typeof r.to === 'string' ? r.to : '',
        };
      })
      .filter(rule => rule !== null && rule.from !== '' && rule.to !== '') as PunctuationConverterSettings['rules'];
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    // 清理所有编辑器监听器
    this.editorWatchers.forEach(dispose => dispose());
    this.editorWatchers.clear();
  }
}