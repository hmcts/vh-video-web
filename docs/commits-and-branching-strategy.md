# Commits and Branching strategy


## Branch name git hook will run on pre commit and control the standard for new branch name.

The branch name should start with: feature/VIH-XXXX-branchName (X - is digit).
If git version is less than 2.9 the pre-commit file from the .githooks folder need copy to local .git/hooks folder.
To change git hooks directory to directory under source control run (works only for git version 2.9 or greater) :
\$ git config core.hooksPath .githooks

## Commit message

The commit message will be validated by prepare-commit-msg hook.
The commit message format should start with : 'feature/VIH-XXXX : ' folowing by 8 or more characters description of commit, otherwise the warning message will be presented.
