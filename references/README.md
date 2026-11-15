# Approved video references

`posiblo-v1/` preserves the user-approved video, original project media, source snapshot, dependency lockfile, configuration, and historical production evidence. `posiblo-v1/manifest.json` hashes every archived file. Do not edit the archive or regenerate its manifest to hide changes.

Run `npm run verify:baseline` from the project root to detect changed or missing archived files. On PowerShell systems that block npm.ps1, use `npm.cmd` instead of `npm`.

The snapshot is local and available to Git; it has not been committed or backed up remotely by this task. Keep the archive with the project when backing it up. A hash manifest detects changes but is not an external backup or cryptographic signature.

The historical QA report and original scripts target `out/posiblo-first-test.mp4`, the old filename. Use the root project's `npm run verify:video` to check the actual approved filename. Do not run archived scripts in place; see `docs/video-standard.md` for isolated reproduction instructions.
