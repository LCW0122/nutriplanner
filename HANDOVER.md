# Planner: Handover Note (upload from another computer)

## What this is

Planner is a personal 7-day eating planner and meal log following a nutritionist plan. It is a static website: HTML, CSS and JavaScript only, no server and no build step. Records live in the browser of whichever device opens the site. Nothing is stored on GitHub.

## What is in this folder

| Path | What |
|---|---|
| `index.html` | Page shell. Contains `noindex` tags and the password screen markup |
| `css/tokens.css`, `css/styles.css` | Design tokens and styles |
| `js/gate.js` | Password screen (a screen lock, not security) |
| `js/app.js` | App logic |
| `data/library.js` | Food library. Delete an `F(...)` line to remove an item |
| `robots.txt`, `.nojekyll` | Search and GitHub Pages settings. `.nojekyll` is a hidden file |
| `README.md` | Technical notes, open questions for the nutritionist |

`index.html` must sit at the top level of the repository.

## Before you start

1. Use a personal GitHub account. Do not use a work email.
2. In GitHub: Settings, Emails, tick **Keep my email addresses private**, and copy the `...@users.noreply.github.com` address.
3. If you use git, set that address for this repository only, never the work email.
4. Free GitHub Pages needs a **public** repository. Everyone can read the source, including the salted digest of the password. The password is a screen lock only.
5. Pick a hard-to-guess repository name, because the URL shows the account name.

## Option 1: browser only (no commands)

1. github.com, **+**, New repository. Name it, choose Public, leave README, .gitignore and license unticked, Create.
2. Click **uploading an existing file**.
3. Open the unzipped folder and drag in everything **inside** it (`index.html`, `robots.txt`, `.nojekyll`, `css`, `js`, `data`, `README.md`). Do not drag the outer folder.
   - If `.nojekyll` is not visible, turn on "Hidden items" in File Explorer.
4. Commit changes.
5. Settings, Pages, Source: Deploy from a branch, branch `main`, folder `/ (root)`, Save.
6. Wait 1 to 2 minutes. The address appears at the top of the Pages screen.

## Option 2: git commands

Open PowerShell inside the folder (type `powershell` in the File Explorer address bar).

```
git init -b main
git rev-parse --show-toplevel
git config user.name "name to show"
git config user.email "your-noreply-address"
git add .
git status
git commit -m "Initial Planner site"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

- The second command must print this folder's path. If it prints a parent folder, stop.
- The push opens a browser sign-in the first time.
- Then enable Pages as in Option 1, step 5.

To update later: `git add .`, `git commit -m "what changed"`, `git push`.

## First run checklist (on a phone)

1. Open the address, enter the password, tick "remember this device" if wanted.
2. Mark a day type, generate a meal, tap the accept button, save it with a photo.
3. More, then Settings: download the backup `.json` and keep it somewhere safe.
4. Add to home screen (iPhone: Safari share button; Android: Chrome menu).

## Things to know

- Records are per device and per URL. A new URL starts empty. Export a backup before changing the address.
- iPhone Safari may clear site data after about a week without use. Back up weekly.
- `robots.txt` is ignored on `<user>.github.io/<repo>/`. The `noindex` tag in `index.html` does the work.
- To change the password, `js/gate.js` needs a new digest in the constant `H`. Ask Claude to generate it. Do not paste the password into the repository.
- A copy of the same app is on a private Claude Artifact link. It is a test copy with a separate data store.

## Open questions for the nutritionist

1. Noodles versus gluten avoidance (the PDF contradicts itself). Noodles are switched off by default.
2. Low Carb breakfast: is the sweet potato or corn example allowed? Currently excluded.
3. Rest Day has no rules in the PDF. It uses the eating-out formula.
4. All items marked 建議 need review, especially tempeh, natto, chestnut and the soy sauce substitute.
5. No kcal target in the PDF, and none is shown.
6. Supplement dosage is text only, with a disclaimer.

## Not done yet

- Real-phone test of photo upload and the `.json` download.
- Offline use (PWA) and self-hosted fonts.
- Logging for past days (logging works for the current week only).
