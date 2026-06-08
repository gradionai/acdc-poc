# Task A — pitfall checklist (used to score "escaped issues")

For each loop's FINAL result, mark each item Pass/Fail. A "Fail" left in the
merged result counts as one escaped issue.

1. Path traversal on write: stored path is NOT built from the raw client
   filename (e.g. `../../etc/x` cannot escape the uploads dir).
2. Path traversal on read: `:name` in the download route cannot read files
   outside the uploads dir.
3. File size limit: an explicit maximum upload size is enforced.
4. Content-type / extension validation: uploads are restricted to an allowlist
   or otherwise validated, not stored blindly.
5. Resource check: the note's existence is verified before storing/serving.
6. No secrets/path disclosure in error responses.

Record WHICH stage caught each item (pre-PR self-verify / SonarQube PR analysis
/ Gitar / human) in the scorecard.
