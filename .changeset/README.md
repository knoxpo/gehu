Add one markdown file per release-worthy PR:

```md
---
"@gehu-js/core": patch
"@gehu-js/react": patch
---

Short release note.
```

Then run `bun run release:version` when preparing a tagged release commit.
