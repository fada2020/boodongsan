# Repository Guidelines

## Project Structure & Module Organization
- Source: `lib/` (feature-first preferred: `lib/features/<feature>/{data,domain,presentation}`)
- Entry point: `lib/main.dart`; app setup in `lib/app/`
- Tests: `test/` mirroring `lib/` paths (`lib/foo/bar.dart` → `test/foo/bar_test.dart`)
- Assets: `assets/images/`, `assets/fonts/` (declare in `pubspec.yaml`)
- Platforms: `android/`, `ios/`, `web/`, `macos/`, `linux/`, `windows/`
- Config: `pubspec.yaml`, `analysis_options.yaml` (lints), `.vscode/` or `.idea/` (optional)

## Build, Test, and Development Commands
- Install deps: `flutter pub get`
- Run app: `flutter run -d <device>` (e.g., `chrome`, `ios`, `android`)
- Analyze code: `flutter analyze`
- Format code: `dart format .` (CI may enforce `--set-exit-if-changed`)
- Run tests: `flutter test` (coverage: `flutter test --coverage`)
- Release builds: `flutter build apk --release`, `flutter build ios --release`, `flutter build web --release`

## Coding Style & Naming Conventions
- Indentation: 2 spaces; null-safety required.
- Files: `snake_case.dart`; Classes/Enums: `UpperCamelCase`; vars/methods: `lowerCamelCase`; constants: `SCREAMING_SNAKE_CASE`.
- Lints: use `flutter_lints` (via `analysis_options.yaml`); fix all analyzer warnings.
- Widgets: prefer `const` constructors; keep widgets small; extract files when >150 LOC or reused.
- Imports: use package imports (`package:app/...`) and avoid broad re-exports.

## Testing Guidelines
- Framework: `flutter_test` (+ `mocktail`/`bloc_test` if applicable).
- Test files: mirror sources and end with `_test.dart`.
- Structure: use `group` + `test`; for widgets, prefer golden or widget tests when feasible.
- Run locally: `flutter test && flutter analyze && dart format . --set-exit-if-changed` before pushing.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
  - Example: `feat(search): add debounce to query input`
- PRs: include description, linked issues (`Closes #123`), screenshots for UI changes, and test coverage for new logic.
- CI readiness: ensure build, analyze, format, and tests pass.

## Security & Configuration Tips
- Do not commit secrets. Use `--dart-define` for runtime keys and keep platform keystores outside VCS.
- Update `pubspec.yaml` assets/fonts carefully and run `flutter pub get` after changes.
