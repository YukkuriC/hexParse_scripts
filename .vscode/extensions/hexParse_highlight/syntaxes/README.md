# HexParse Highlight -- Syntax Definition

## Coloring (TextMate Scope Conventions)

Scope prefixes determine token colors in TextMate-compatible editors. This project follows a **semantic grouping** convention: tokens with the same prefix family share the same visual color.

```hexParse
// 1. Dynamic Entity References (entity.name.type.*)
entity_550e8400-e29b-41d4-a716-446655440000  mote_a1b2c3d4-0d00-0721-abcd-deadbeef6666_0
// 2. Static Data Literals (keyword.*.literal)
vec_3_2  gate_114_514_1919  matrix_2_2_1_0_0_1
// 3. Type Identifiers (support.type.*)
type/iota_hexcasting:pattern  id_minecraft:player  dim_minecraft:overworld  potion_minecraft:strength  glyph_callback
// 4. Meta & Control Flow (keyword.control/operator.*)
for_each  eval/cc  if  (  )  [  ]  {  }  for_range/cube/pure
// 5. Pattern Tokens (keyword.* / variable.*)
num_1.375  mask_--vv--  copy_mask_-n-  _wedsaq  brainsweep
// 6. Constants (constant.*)
true  false  null  garbage  42  \
// 7. Strings & Comments (string.* / comment.*)
"hello world"  str_unquoted_text  comment_foo  tab_114514  /* block comment */ // line comment
// 8. Functions (support.function.*)
prop_tmp  myprop_evil  #my_aim
```

### Color Groups

#### 1. Dynamic Entity References (`entity.name.type.*`)

UUID-based or entity-like references that resolve to a runtime object.

| Token | Scope | Source |
|-------|-------|--------|
| `entity_<uuid>` | `entity.name.type.entity` | core / literals.yaml |
| `mote_<uuid>_<idx>` | `entity.name.type.hexal.mote` | hexal plugin |

**Rationale**: Both carry UUIDs and represent dynamic, entity-adjacent references rather than static values.

---

#### 2. Static Data Literals (`keyword.*`)

Immutable data objects defined inline in the script.

| Token | Scope | Source |
|-------|-------|--------|
| `vec[_x][_y][_z]` | `keyword.vector` | specials.yaml |
| `gate[_x_y_z\|uuid...]` | `keyword.hexal.gate` | hexal plugin |
| `matrix_<rows>_<cols>_<values...>` | `keyword.moreiotas.matrix` | moreIotas plugin |

**Rationale**: All three are self-contained static data structures; gate UUID-binding is an atypical edge case and does not change the fundamental category.

---

#### 3. Type Identifiers (`support.type.*`)

Named type or registry identifiers (ResourceLocation-based).

| Token | Scope | Source |
|-------|-------|--------|
| `type/<kind>_<id>` | `support.type.moreiotas.typeid` | moreIotas plugin |
| `id_<rl>` | `support.type.hexpose.identifier` | hexPose plugin |
| `dim_<id>` | `support.type.oneironaut.dimension` | oneironaut plugin |
| `potion_<id>` | `support.type.ephemera.potion` | ephemera plugin |
| `glyph_<name>` | `support.type.hexarslinker.glyph` | hexArsLinker plugin |

**Rationale**: All are registry/namespace identifiers that name a *type* or *category* of thing, not a value instance.

---

#### 4. Meta & Control Flow (`keyword.control.*` / `keyword.operator.*`)

Language-level structural tokens.

| Token | Scope | Source |
|-------|-------|--------|
| `for_each`, `eval/cc`, `eval`, etc. | `keyword.control.meta` | patterns.yaml |
| `if` | `keyword.control.meta` | patterns.yaml |
| `(` `[` `{` | `keyword.control.*.left` | core.yaml |
| `)` `]` `}` | `keyword.control.*.right` | core.yaml |
| `for_range/*`, `pure_*`, `call_stack` | `keyword.control.hexflow.meta` | hexFlow plugin |

---

#### 5. Pattern Tokens (`keyword.*`)

Pattern-related literals.

| Token | Scope | Source |
|-------|-------|--------|
| `num_<value>` | `keyword.num.pattern` | patterns.yaml |
| `mask_<chars>` | `keyword.mask` | patterns.yaml |
| `copy_mask_*` | `keyword.mask.hexflow.copymask` | hexFlow plugin |
| `_wedsaq` (raw) | `keyword.rawpattern` | patterns.yaml |
| `<sig>` (registered) | `variable.pattern` | patterns.yaml |

---

#### 6. Constants (`constant.*`)

Fixed language constants.

| Token | Scope | Source |
|-------|-------|--------|
| `true` / `false` | `constant.language.boolean` | literals.yaml |
| `null` | `constant.language.null` | literals.yaml |
| `garbage` | `constant.language.garbage` | literals.yaml |
| numeric literal | `constant.numeric` | literals.yaml |
| `\\` escape | `constant.character.escape` | literals.yaml |

---

#### 7. Strings & Comments (`string.*` / `comment.*`)

| Token | Scope | Source |
|-------|-------|--------|
| `"..."` (quoted) | `string.quoted.moreiotas.double` | moreIotas plugin |
| `str_<content>` (unquoted) | `string.unquoted.moreiotas.string` | moreIotas plugin |
| `comment` / `%...%` | `comment.iota` | literals.yaml |
| `tab` indent | `comment.iota.tab` | literals.yaml |
| `# ...` | `comment.line` | core.yaml |
| `%...%` (multi-line) | `comment.multiline` | core.yaml |

---

#### 8. Functions (`support.function.*`)

Callable references that contain executable logic.

| Token | Scope | Source |
|-------|-------|--------|
| `#macro_name` | `support.function.macro` | literals.yaml |
| `prop_` / `myprop_` | `support.function.hexcellular.property` | hexcellular plugin |

**Rationale**: Macros are user-defined callable expansions; properties carry executable handlers. Both behave as function-like references.

---

### Naming Convention Rules

**Global format**: `{coloring type}.{mod id}.{content}`

- `coloring type` -- TextMate scope prefix (e.g. `keyword`, `support.function`)
- `mod id` -- source module: **omitted for `core`** (built-in), or plugin name (`hexflow`, `hexal`, etc.)
- `content` -- descriptive name of the token

When adding a new token, choose the scope prefix by answering:

1. **Is it a UUID-based dynamic reference?** -> `entity.name.type.<plugin>.<name>`
2. **Is it a static data literal?** -> `keyword.<subcat>.<plugin>.<name>`
3. **Is it a type/registry identifier?** -> `support.type.<plugin>.<name>`
4. **Is it a control-flow or meta construct?** -> `keyword.control.<plugin>.<name>` or `keyword.operator.<plugin>.<name>`
5. **Is it a language constant?** -> `constant.<subcat>.<plugin>.<name>`
6. **Is it a string or comment?** -> `string.*` / `comment.*`
7. **Is it a callable with executable content?** -> `support.function.<plugin>.<name>`
