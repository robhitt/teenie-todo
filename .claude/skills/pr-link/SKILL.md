---
description: Show GitHub compare URL for the current branch to create a PR
user_invocable: true
---

Show the GitHub compare URL for the current branch so the user can create a PR.
Only show the link if everything is committed and pushed.

Steps:
1. Get the current branch name with `git branch --show-current`
2. If on `main`, tell the user there's nothing to compare
3. Check `git status` for uncommitted changes (staged, unstaged, or untracked). If there are any, tell the user they have uncommitted changes and stop.
4. Check `git log @{u}..HEAD` for unpushed commits. If there are any, tell the user they have unpushed commits and stop.
5. If everything is clean and pushed, output the link: `https://github.com/robhitt/teenie-todo/compare/main...<branch>`
