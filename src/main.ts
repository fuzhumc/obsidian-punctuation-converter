import {
  Plugin,
  Notice,
  TFile,
  Editor,
  MarkdownView,
} from 'obsidian';
import {
  type PunctuationConverterSettings,
  DEFAULT_SETTINGS,
  PunctuationConverterSettingTab,
  resolveLang,
} from './settings';
import { type Locale, LOCALES, COMMAND_PREFIX, COMMAND_NAMES, getLang } from './locale';

export default class PunctuationConverter extends Plugin {
  settings!: PunctuationConverterSettings;
  private editorWatchers = new Set<() => void>();
  private statusBarItem!: HTMLElement;

  private t(): Locale {
    return LOCALES[resolveLang(this.settings.lang)];
  }

  async onload() {
    await this.loadSettings();

    const t = this.t();

    this.statusBarItem = this.addStatusBarItem();
    this.updateStatusBar();
    this.statusBarItem.addClass('mod-clickable');
    this.statusBarItem.addEventListener('click', async () => {
      this.settings.enabled = !this.settings.enabled;
      await this.saveSettings();
      this.updateStatusBar();
      new Notice(
        this.settings.enabled
          ? t.conversionEnabled
          : t.conversionDisabled
      );
    });

    this.addRibbonIcon('replace-all', t.ribbonTooltip, async () => {
      const file = this.app.workspace.getActiveFile();
      if (!file) {
        new Notice(t.noFileOpen);
        return;
      }
      await this.convertEntireFile(file);
      new Notice(t.conversionDone);
    });

    this.addSettingTab(new PunctuationConverterSettingTab(this.app, this));

    this.addCommand({
      id: 'toggle-punctuation-conversion',
      name: `${COMMAND_PREFIX[resolveLang(this.settings.lang)]}: ${COMMAND_NAMES.toggle[getLang()]}`,
      callback: async () => {
        this.settings.enabled = !this.settings.enabled;
        await this.saveSettings();
        this.updateStatusBar();
        new Notice(
          this.settings.enabled
            ? t.conversionEnabled
            : t.conversionDisabled
        );
      },
    });

    this.addCommand({
      id: 'convert-current-file-punctuation',
      name: `${COMMAND_PREFIX[resolveLang(this.settings.lang)]}: ${COMMAND_NAMES.convertFile[getLang()]}`,
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice(t.noFileOpen);
          return;
        }
        await this.convertEntireFile(file);
        new Notice(t.conversionDone);
      },
    });

    this.addCommand({
      id: 'toggle-ignore-code-blocks',
      name: `${COMMAND_PREFIX[resolveLang(this.settings.lang)]}: ${COMMAND_NAMES.toggleIgnoreCodeBlocks[getLang()]}`,
      callback: async () => {
        this.settings.ignoreCodeBlocks = !this.settings.ignoreCodeBlocks;
        await this.saveSettings();
        new Notice(
          this.settings.ignoreCodeBlocks
            ? t.ignoreCodeBlocksEnabled
            : t.ignoreCodeBlocksDisabled
        );
      },
    });

    this.addCommand({
      id: 'toggle-ignore-math',
      name: `${COMMAND_PREFIX[resolveLang(this.settings.lang)]}: ${COMMAND_NAMES.toggleIgnoreMath[getLang()]}`,
      callback: async () => {
        this.settings.ignoreMath = !this.settings.ignoreMath;
        await this.saveSettings();
        new Notice(
          this.settings.ignoreMath
            ? t.ignoreMathEnabled
            : t.ignoreMathDisabled
        );
      },
    });

    this.addCommand({
      id: 'toggle-ignore-frontmatter',
      name: `${COMMAND_PREFIX[resolveLang(this.settings.lang)]}: ${COMMAND_NAMES.toggleIgnoreFrontmatter[getLang()]}`,
      callback: async () => {
        this.settings.ignoreFrontmatter = !this.settings.ignoreFrontmatter;
        await this.saveSettings();
        new Notice(
          this.settings.ignoreFrontmatter
            ? t.ignoreFrontmatterEnabled
            : t.ignoreFrontmatterDisabled
        );
      },
    });

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor) => {
        if (!editor.somethingSelected()) return;

        menu.addItem((item) => {
          item
            .setTitle(t.contextMenuTitle)
            .setIcon('replace-all')
            .onClick(() => {
              const selection = editor.getSelection();
              const result = this.applyPunctuationRules(selection);
              if (result !== selection) {
                editor.replaceSelection(result);
              }
            });
        });
      })
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf?.view instanceof MarkdownView) {
          this.attachEditorListener(leaf.view.editor);
        }
      })
    );

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      this.attachEditorListener(activeView.editor);
    }
  }

  private updateStatusBar(): void {
    const t = this.t();
    this.statusBarItem.setText(
      this.settings.enabled ? t.statusBarEnabled : t.statusBarDisabled
    );
  }

  attachEditorListener(editor: Editor) {
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

      if (this.shouldSkipPosition(currentValue, prefixLen)) {
        lastValue = currentValue;
        return;
      }

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

  private shouldSkipPosition(text: string, position: number): boolean {
    if (this.settings.ignoreCodeBlocks && this.isInsideCodeBlock(text, position)) return true;
    if (this.settings.ignoreMath && this.isInsideMathRegion(text, position)) return true;
    if (this.settings.ignoreFrontmatter && this.isInsideFrontmatter(text, position)) return true;
    return false;
  }

  private isInsideCodeBlock(text: string, position: number): boolean {
    const before = text.slice(0, position);

    const fences = before.match(/^```/gm);
    if (fences && fences.length % 2 === 1) return true;

    const lastNewline = before.lastIndexOf('\n');
    const currentLine = before.slice(lastNewline + 1);
    const ticks = currentLine.match(/(?<!\\)`/g);
    if (ticks && ticks.length % 2 === 1) return true;

    return false;
  }

  private isInsideMathRegion(text: string, position: number): boolean {
    const before = text.slice(0, position);

    const dollars = before.match(/\$\$/g);
    if (dollars && dollars.length % 2 === 1) return true;

    const singles = before.match(/(?<!\$)\$(?!\$)/g);
    if (!singles) return false;

    let inDouble = false;
    let inlineCount = 0;
    const re = /\$\$|\$/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(before)) !== null) {
      if (m[0] === '$$') {
        inDouble = !inDouble;
      } else {
        if (!inDouble) inlineCount++;
      }
    }
    return inlineCount % 2 === 1;
  }

  private isInsideFrontmatter(text: string, position: number): boolean {
    if (!text.startsWith('---')) return false;

    const firstNewline = text.indexOf('\n');
    if (firstNewline === -1) return false;

    const afterFirstDelim = text.indexOf('\n---', firstNewline + 1);
    if (afterFirstDelim === -1) return position > firstNewline;

    if (position <= firstNewline) return false;
    if (position <= afterFirstDelim + 4) return true;
    return false;
  }

  private protectRegions(text: string): { protected: string; placeholders: Map<string, string> } {
    const placeholders = new Map<string, string>();
    let counter = 0;

    const PREFIX = '\x00PC';
    const place = (match: string): string => {
      const key = `${PREFIX}${counter++}\x00`;
      placeholders.set(key, match);
      return key;
    };

    let result = text;

    if (this.settings.ignoreFrontmatter) {
      result = result.replace(/^---[\s\S]*?\n---/, place);
    }

    if (this.settings.ignoreCodeBlocks) {
      result = result.replace(/```[\s\S]*?```/g, place);
      result = result.replace(/(?<!\\)(`+)(.+?)\1/g, place);
    }

    if (this.settings.ignoreMath) {
      result = result.replace(/\$\$[\s\S]*?\$\$/g, place);
      result = result.replace(/(?<!\$)\$(.+?)\$(?!\$)/g, place);
    }

    return { protected: result, placeholders };
  }

  private restoreRegions(text: string, placeholders: Map<string, string>): string {
    let result = text;
    for (const [key, original] of placeholders) {
      result = result.replaceAll(key, original);
    }
    return result;
  }

  private applyPunctuationRules(text: string): string {
    if (this.settings.ignoreCodeBlocks || this.settings.ignoreMath || this.settings.ignoreFrontmatter) {
      const { protected: protectedText, placeholders } = this.protectRegions(text);
      let result = protectedText;
      for (const rule of this.settings.rules) {
        if (rule.enabled) {
          result = result.replaceAll(rule.from, rule.to);
        }
      }
      return this.restoreRegions(result, placeholders);
    }

    let result = text;
    for (const rule of this.settings.rules) {
      if (rule.enabled) {
        result = result.replaceAll(rule.from, rule.to);
      }
    }
    return result;
  }

  async convertEntireFile(file: TFile) {
    const content = await this.app.vault.read(file);
    const newContent = this.applyPunctuationRules(content);

    if (newContent !== content) {
      await this.app.vault.modify(file, newContent);
    }
  }

  async loadSettings() {
    const raw = (await this.loadData()) as unknown;

    let enabled = DEFAULT_SETTINGS.enabled;
    let rules = [...DEFAULT_SETTINGS.rules];
    let lang = DEFAULT_SETTINGS.lang;
    let ignoreCodeBlocks = DEFAULT_SETTINGS.ignoreCodeBlocks;
    let ignoreMath = DEFAULT_SETTINGS.ignoreMath;
    let ignoreFrontmatter = DEFAULT_SETTINGS.ignoreFrontmatter;

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

      if ('lang' in raw) {
        const langVal = (raw as { lang?: unknown }).lang;
        if (langVal === 'auto' || langVal === 'zh' || langVal === 'en') {
          lang = langVal;
        }
      }

      if ('ignoreCodeBlocks' in raw) {
        const ignoreVal = (raw as { ignoreCodeBlocks?: unknown }).ignoreCodeBlocks;
        if (typeof ignoreVal === 'boolean') {
          ignoreCodeBlocks = ignoreVal;
        }
      }

      if ('ignoreMath' in raw) {
        const ignoreVal = (raw as { ignoreMath?: unknown }).ignoreMath;
        if (typeof ignoreVal === 'boolean') {
          ignoreMath = ignoreVal;
        }
      }

      if ('ignoreFrontmatter' in raw) {
        const ignoreVal = (raw as { ignoreFrontmatter?: unknown }).ignoreFrontmatter;
        if (typeof ignoreVal === 'boolean') {
          ignoreFrontmatter = ignoreVal;
        }
      }
    }

    this.settings = { enabled, rules, lang, ignoreCodeBlocks, ignoreMath, ignoreFrontmatter };
  }

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
    this.editorWatchers.forEach(dispose => dispose());
    this.editorWatchers.clear();
  }
}