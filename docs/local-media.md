# Local video storage

At the user's request on 2026-11-19, all video files were removed from the current GitHub branch trees. Historical copies remain in older commits; removing those requires an explicitly approved history rewrite. Video extensions are ignored to prevent accidental commits.

Local media is stored under C:\Posiblo\posiblo-video-studio\, preserving each former repository-relative path. This includes input, generated and approved-reference video files. Other reference files and the original hash manifest are preserved; the manifest was not rewritten to hide missing video files.

Existing compositions, archived snapshots, completed pipeline state and baseline checks still refer to the former media paths. To preview or check old work, restore the required files from the external folder or explicitly update that composition's local media configuration. Missing-media and baseline checks will otherwise report missing files. Do not commit restored video files. New pipeline runs may generate local media normally, but must not push it to GitHub.

The 40-second export is stored at C:\Posiblo\posiblo-video-studio\out\shootsolo-20261103-103615-take10\short40\posiblo-introduction-40s.mp4.
