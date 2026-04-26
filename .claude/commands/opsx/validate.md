---
name: "OPSX: Validate"
description: Run OpenSpec validation on a change or spec
category: Workflow
tags: [workflow, validate, openspec]
---

Run OpenSpec validation on a change, spec, or everything.

**Input**: Optionally specify a change or spec name after `/opsx:validate` (e.g., `/opsx:validate switch-to-google-genai-sdk`). Pass `--all` to validate everything. If omitted, infer from conversation context or prompt.

Use the **openspec-validate** skill to handle this.
