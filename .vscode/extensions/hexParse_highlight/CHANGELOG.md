# CHANGELOG

## [1.2.1]

### Features

- **Matrix validation upgrade**: underflow (missing values) now reported as Error, overflow changed from Error to Warning; zero-size matrices now permitted
- **Tokenizer whitelist rewrite**: switched from character blacklist to whitelist regex matching Kotlin pTokens, improving Unicode and special character handling
- Matrix hover preview uses `?` instead of `0` for missing cells

### Fixes

- Whitespace no longer prematurely breaks word tokens during tokenization

---

## [1.2.0]

### Features

- **Lehmer Code calculator**: new `hexparse.calculateLehmer` command (`Ctrl+Shift+L`) that computes the Lehmer code from a selected integer sequence and replaces it with the formatted result; ported from HexParseMod's `CommandLehmerHelper`
- **Markdown code block highlighting**: HexParse fenced blocks inside `.md` files now receive full syntax highlighting via injection grammar
- **Hover text overhaul**: all pattern hovers now use i18n keys with consistent formatting and line breaks; added distinct hints for open/close group brackets and bare numeric literals
- **Cross-line bracket validation**: diagnostics for unmatched `[]`, `()`, `{}` with precise positions, correctly skipping block comments

### Fixes

- moreIotas pattern hover hints corrected
- Translation fixes across en/zh-cn locales for core patterns and multiple plugins
- Token parsing edge-case fixes

---

## [1.1.0]

### Features

- **i18n support**: Full internationalization system for completions, hover tips, and validation messages with English and Chinese (zh-cn) locales; snippets split into per-module JSON files under `locales/en/` and `locales/zh-cn/`
- **HexFlow hints**: Added hover and completion support for the HexFlow module, including eval/thoth-related syntax patterns

### Fixes

- Token parsing bugfixes

---

## [1.0.0]

### Features

- Full LSP support: language server providing diagnostics (validation), hover information, completions, and token-based syntax analysis for the HexParse language
