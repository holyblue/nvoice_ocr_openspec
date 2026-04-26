---
name: openspec-validate
description: Run OpenSpec validation on a change, spec, or all items. Use when the user wants to validate an OpenSpec change or spec.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: local
  version: "1.0"
---

Run OpenSpec validation and report results.

**Input**: Optionally specify a change or spec name, or `--all`. Infer from conversation context if omitted.

**IMPORTANT**: All `openspec` commands must be run from the **project root** (the directory containing the `openspec/` folder), not from a subdirectory like `backend/`. Always `cd` to project root before running.

**Steps**

1. **Determine what to validate**

   - If `--all` provided → validate everything
   - If a name is provided → determine type:
     - Check `openspec/changes/<name>/` exists → it's a change
     - Check `openspec/specs/<name>/` exists → it's a spec
     - If ambiguous, use **AskUserQuestion tool** to ask `change` or `spec`
   - If nothing provided → infer from conversation context (current change being worked on)
   - If still unclear → run `openspec list --json` and use **AskUserQuestion tool** to prompt

2. **Find project root**

   Run:
   ```bash
   git rev-parse --show-toplevel
   ```
   Use this path as the working directory for all subsequent openspec commands.

3. **Run validation**

   From project root:

   - Single change:
     ```bash
     openspec validate "<name>" --type change
     ```
   - Single spec:
     ```bash
     openspec validate "<name>" --type spec
     ```
   - All changes:
     ```bash
     openspec validate --changes
     ```
   - All specs:
     ```bash
     openspec validate --specs
     ```
   - Everything:
     ```bash
     openspec validate --all
     ```

4. **Report results**

   - On success (exit 0): show "✓ Valid" with the item name
   - On failure (exit non-0): show the full error output and suggest fixes

**Output On Success**

```
✓ Change 'switch-to-google-genai-sdk' is valid
```

**Output On Failure**

```
✗ Validation failed for '<name>'

<error output from CLI>

Suggested fixes:
- <extracted actionable suggestion from error>
```

**Guardrails**
- Always run from project root, never from a subdirectory
- Do not guess change vs spec type — check directory existence first
- Show the raw CLI error output so the user has full context
