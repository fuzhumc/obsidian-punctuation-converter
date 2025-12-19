import {
  Plugin,
  Notice,
  TFile,
  Editor,
  MarkdownView,
  WorkspaceLeaf,
} from 'obsidian';
import {
  PunctuationConverterSettings,
  DEFAULT_SETTINGS,
  PunctuationConverterSettingTab,
} from './settings';

export default class PunctuationConverter extends Plugin {
  settings: PunctuationConverterSettings = DEFAULT_SETTINGS;
  private editorWatchers = new Set<() => void>();

  async onload() {
    await this.loadSettings();

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

    const transformText = (newText: string, oldText: string): string => {
      if (!this.settings.enabled) return newText;

      let result = newText;
      let changed = false;
      for (const rule of this.settings.rules) {
        if (rule.enabled && result.includes(rule.from)) {
          result = result.replaceAll(rule.from, rule.to);
          changed = true;
        }
      }
      return changed ? result : newText;
    };

    const dispose = this.watchEditorChanges(editor, transformText);
    this.editorWatchers.add(dispose);
  }

  private watchEditorChanges(
    editor: Editor,
    transformer: (newText: string, oldText: string) => string
  ): () => void {
    let lastValue = editor.getValue();
    let isProcessing = false;

    const checkAndUpdate = () => {
      const currentValue = editor.getValue();
      if (currentValue === lastValue || isProcessing) return;

      isProcessing = true;
      setTimeout(() => {
        try {
          const modified = transformer(currentValue, lastValue);
          if (modified !== currentValue) {
            const cursor = editor.getCursor();
            editor.setValue(modified);
            // 尽力恢复光标（简单策略）
            editor.setCursor(cursor);
          }
        } finally {
          lastValue = editor.getValue();
          isProcessing = false;
        }
      }, 0);
    };

    const intervalId = window.setInterval(checkAndUpdate, 150);
    return () => window.clearInterval(intervalId);
  }


  async convertEntireFile(file: TFile) {
    try {
      const content = await this.app.vault.read(file);
      let newContent = content;

      for (const rule of this.settings.rules) {
        if (rule.enabled && newContent.includes(rule.from)) {
          newContent = newContent.replaceAll(rule.from, rule.to);
        }
      }

      if (newContent !== content) {
        await this.app.vault.modify(file, newContent);
      }
    } catch (e) {
      console.error('转换文件失败', e);
      throw e;
    }
  }

async loadSettings() {
  const data = await this.loadData();

  this.settings = {
    enabled: typeof data?.enabled === 'boolean' ? data.enabled : DEFAULT_SETTINGS.enabled,
    
    rules: Array.isArray(data?.rules)
      ? this.validateRules(data.rules)
      : [...DEFAULT_SETTINGS.rules],
  };
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