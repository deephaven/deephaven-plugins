---
name: automated-code-review
description: Use when asked to review code. Determine the level of scrutiny needed and flag code for careful review, scan, or safe to merge.
---

# Automated Code Review

When asked to review code, consider the following questions to determine the level of scrutiny needed:

1. Architecture: Is this a major architectural decision? Would reverting this later be expensive or disruptive?
2. Reasoning: Is this code hard to reason about? Would another engineer need to mentally simulate this carefully to trust it?
3. Risk: Is this high risk? If this is subtly wrong, could it cause outages, corruption, security incidents, or expensive debugging?
4. User-facing: Is this user facing? Could this technically work while still being the wrong product behavior?
5. Novelty: Is this novel? Does this differ materially from established repository patterns?
6. Testing: Can we realistically prove this works with automated tests?
7. Implementation: Would a human reasonably disagree with this implementation choice?
8. Security: Does this have any security concerns?

There are three levels of concern to consider when reviewing code:

1. Safe to merge
2. Should be scanned
3. Requires careful review

If any of the concerns seem likely (above 50% confidence that the concern applies), flag for careful review.
If any of the concerns might apply (above 10% confidence that the concern applies), flag for scan.
Additionally, select a portion of the changes to randomly review. Select chunks of code that can reasonably be reviewed in isolation using the following guidelines:
This portion should be as high as 15% if less than 10% of the code is flagged already and as low as 5% if above 50% of the code is already flagged.

Provide reason(s) and confidence for flagging, and if possible, provide specific suggestions for improvement if they are blockers. If code is randomly flagged, that should be noted as the reason for review and it should be considered code for careful review, regardless of any confidence level. Code should only be randomly flagged if not already flagged for careful review or scan. Do not randomly flag user-facing documentation such as markdown files, but you can randomly flag code comments and docstrings.

These flags should be provided in addition to any specific comments on the code, such as correctness, not instead of.

## Running this skill:

If the user asks for a review, by default, the code on the current branch should be compared to the origin's main branch with `git diff` unless the user specifies otherwise. The user can specify a different branch, commit, file, or pull request to review against.
The user can provide a file name for output. If no file name is provided, write the output to the console.
Output into the markdown file at the specified location with the following format if the output is not going to the console:

```markdown
# Automated Code Review

## Summary

- Total lines of code changed: X
- Lines flagged for careful review: Y (Z%)
- Lines flagged for scan: A (B%)

## Flagged

### Review

#### File: [file name]

Reason(s) and confidence level
Code snipped flagged and link to the line in the file
Suggestions for improvement if applicable

### Scan

#### File: [file name]

Reason(s) and confidence level
Code snipped flagged and link to the line in the file
Suggestions for improvement if applicable
```
