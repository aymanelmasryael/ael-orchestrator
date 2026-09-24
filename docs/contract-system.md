# Contract System

The contract DSL is shared with **AEL TF-Serving Lab** — see that repository for the full specification.

## Grammar

```
contract <Name> {
    <field_name>: <type> [ [] ] [ ? ] [ = <default> ] [ @<decorator>(<args>) ... ]
}
```

## Supported Types

| Type | TypeScript | Description |
|------|------------|-------------|
| `string` | `string` | UTF-8 string |
| `int` | `number` | 32-bit integer |
| `float` | `number` | IEEE 754 double |
| `bool` | `boolean` | true/false |
| `any` | `unknown` | Any JSON value |
| `json` | `unknown` | Alias for `any` |

Arrays: `string[]`, `int[]`, etc.
Optional: `string?`, `int[]?`
Default: `= <value>`

## Decorators

| Decorator | Applies To | Validation |
|-----------|-----------|------------|
| `@min(n)` | string (length), int/float | `value >= n` |
| `@max(n)` | string (length), int/float | `value <= n` |
| `@range(a,b)` | int/float | `a <= value <= b` |
| `@pattern(re)` | string | `regex.test(value)` |
| `@enum(...)` | any | `value in list` |
| `@maxItems(n)` | arrays | `array.length <= n` |

## Example: `PromptRequest`

```dsl
contract PromptRequest {
  task: enum(general, code, summarize, translate, creative, analyze) = general
  prompt: string @min(1) @max(8000)
  max_tokens: int = 512 @range(1,4096)
  temperature: float = 0.7 @range(0.0,2.0)
  top_p: float? @range(0.0,1.0)
  system: string? @max(2000)
}
```

## Pipeline

```
DSL source
   │
   ▼ parseContract()
   │
   ▼ { name, fields[], diags[] }
   │
   ├──→ compileTs() → TypeScript interface
   │
   └──→ validateBody() → diagnostics[]
```

## Validation Order

1. Body must be a non-null object
2. Unknown fields → warnings
3. Missing required fields → errors
4. Type check per field
5. Array element type check
6. Decorator checks
7. Unknown decorators → warnings

## Limitations

- No nested objects
- No unions
- No recursive types
- No custom validators
- No async validation
- No schema versioning

These can be added in future iterations.