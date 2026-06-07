# 生成于 GLM-5V-Turbo
"""
Merge syntaxes/src/*.yaml into HexParse.tmGrammar.json

Source layout:
  src/core.yaml        -> top-level + COMMENTS, STRUCTURAL, CUTTER, INIT
  src/literals.yaml    -> macro, comment_iota, literal, inner_literal, num
  src/patterns.yaml    -> pattern
  src/specials.yaml    -> special_handler (base: vec, gate)
  src/plugins/*.yaml   -> routed by _inject_into field per rule (addon rules)

Plugin file format (list of rule dicts):
  # Rules without _inject_into go to special_handler by default:
  - match: potion_.+$
    name: keyword.potion.literal

  # Rules with _inject_into are routed to that repository key:
  - _inject_into: pattern
    match: for_range/.+$
    name: keyword.control.meta.hexflow
  - _inject_into: literal
    match: str_.*$
    name: string.literal.moreiotas
  - _inject_into: structural
    match: \".*?\"
    name: string.literal.quotes.moreiotas

Valid _inject_into targets: pattern, literal, structural, special_handler (default)
The _inject_into key is stripped before writing output JSON.
"""

import json, os, yaml
from functools import partial

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(SCRIPT_DIR, 'src')
open = partial(open, encoding='utf-8')

VALID_TARGETS = {'pattern', 'literal', 'structural', 'special_handler'}
DEFAULT_TARGET = 'special_handler'


def load_yaml(path):
    with open(path) as f:
        return yaml.load(f, yaml.Loader) or {}


def inject_pattern(grammar, target_key, rule):
    """Append a single pattern rule into grammar['repository'][target_key].patterns"""
    repo = grammar['repository']
    container = repo.setdefault(target_key, {})
    container.setdefault('patterns', []).append(rule)


def merge_plugin_file(grammar, filepath, filename):
    """Parse a plugin yaml file and route rules to their _inject_into targets.

    Each entry in the list is a pattern rule dict.
    If a rule contains '_inject_into' key, its value determines the target repository key;
    the key is stripped before injection (not emitted into output JSON).
    Default target: special_handler
    """
    data = load_yaml(filepath)
    if not isinstance(data, list):
        print(f'  [warn] plugins/{filename} is not a list, skipping')
        return 0

    count = 0
    targets_used = set()

    for item in data:
        if not isinstance(item, dict):
            continue

        # Extract _inject_into if present; strip it from the rule
        target = item.pop('_inject_into', None)
        if target is not None:
            if target not in VALID_TARGETS:
                print(f'  [warn] plugins/{filename}: invalid _inject_into "{target}", '
                      f'valid: {VALID_TARGETS}')
                continue
            targets_used.add(target)
        else:
            target = DEFAULT_TARGET

        inject_pattern(grammar, target, item)
        count += 1

    if count > 0:
        target_str = ','.join(sorted(targets_used)) if targets_used else DEFAULT_TARGET
        print(f'  [+] plugins/{filename} ({count} rules -> {target_str})')

    return count


def main():
    # ── Base grammar shell ──────────────────────
    grammar = {
        'scopeName': 'source.HexParse',
        'patterns': [{'include': '#init'}],
        'repository': {},
    }

    # ── Merge core modules (order matters) ───────
    for name in ['core', 'literals', 'patterns', 'specials']:
        path = os.path.join(SRC_DIR, f'{name}.yaml')
        if not os.path.exists(path):
            print(f'[warn] {name}.yaml not found, skipping')
            continue
        data = load_yaml(path)
        grammar['repository'].update(data)
        print(f'  [+] {name}.yaml')

    # ── Merge plugins with _inject_into routing ──
    plugin_dir = os.path.join(SRC_DIR, 'plugins')
    if os.path.isdir(plugin_dir):
        plugin_files = sorted(
            f for f in os.listdir(plugin_dir) if f.endswith('.yaml')
        )
        for pf in plugin_files:
            merge_plugin_file(grammar, os.path.join(plugin_dir, pf), pf)

    # ── Write output ─────────────────────────────
    json_path = os.path.join(SCRIPT_DIR, 'HexParse.tmGrammar.json')

    with open(json_path, 'w') as f:
        json.dump(grammar, f, separators=(',', ':'), ensure_ascii=False)
    print(f'[ok] {json_path}')


if __name__ == '__main__':
    main()
