# Changelog

All notable changes to this project will be documented in this file.

## [1.3.1] - 2026-03-06

### Changed
- Switched the default theme fallback to `forest` across app startup, settings defaults, storage defaults, database defaults, and backup import fallbacks.
- Reworked the Home page so the mood picker sits directly under the header and acts as the primary entry point into a new record.
- Replaced the old single start-record CTA with direct mood choices that save a draft mood score and jump straight into recording.
- Refined the Home mood picker layout so the prompt reads more cleanly and the mood labels no longer break awkwardly.
- Removed avatar and username presentation from the Home header so the page starts with a cleaner, more product-focused greeting.
- Refined the History page cards with relative date labels, stronger mood emphasis, and cleaner spacing.
- Hid note preview text on History cards when a record has no written content, and removed the right-side score tag to reduce visual noise.
- Softened the backup restore experience in Settings with calmer copy, a backup-first reminder, and a clearer confirmation step.
- Refined copy across Home, Stats, Record, and Settings to sound more natural and less like internal product wording.
- Removed the test-notification action from reminder settings so the page only contains real user-facing controls.
- Removed the visible personal-profile entry from Settings and the related in-app navigation path.

### Added
- Expanded the default emotion library with more nuanced feelings such as gratitude, satisfaction, fatigue, self-doubt, boredom, anger, sadness, and despair.
- Added automatic backfill for newly introduced default emotions for both Web/localStorage and Native/SQLite users.

### Fixed
- Unified visible app version strings, backup version metadata, and Android release version naming for this release.
- Cleaned up Settings labels such as theme and feedback descriptions to improve readability.
- Rebuilt the About page with clean copy and valid structure after prior text-encoding damage.
- Removed unused profile UI files after the profile feature was dropped from the first-release scope.
