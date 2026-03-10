# Changelog

## [0.1.14](https://github.com/zigorlsp7/cv/compare/v0.1.13...v0.1.14) (2026-03-10)


### Bug Fixes

* cv release trigger 20260309 ([#92](https://github.com/zigorlsp7/cv/issues/92)) ([ed23644](https://github.com/zigorlsp7/cv/commit/ed2364442dcaf8484b3ae6f82ff318b039587545))

## [0.1.13](https://github.com/zigorlsp7/cv/compare/v0.1.12...v0.1.13) (2026-03-09)


### Bug Fixes

* **release:** document release-please user-facing commit rule ([#90](https://github.com/zigorlsp7/cv/issues/90)) ([0f09535](https://github.com/zigorlsp7/cv/commit/0f095356aae86b0e0c17739b33c9586df21fafe0))

## [0.1.12](https://github.com/zigorlsp7/cv/compare/v0.1.11...v0.1.12) (2026-03-02)


### Bug Fixes

* **ci:** run CI and CodeQL on release PRs ([#78](https://github.com/zigorlsp7/cv/issues/78)) ([0469713](https://github.com/zigorlsp7/cv/commit/0469713b33cdc553e8fe2c509bbc20e134bdea00))
* **ci:** skip checks for release-please file-only PRs ([#71](https://github.com/zigorlsp7/cv/issues/71)) ([c5106ec](https://github.com/zigorlsp7/cv/commit/c5106ec43a4c0dccb7b3eb7497c67fd04dff1343))
* skip release pr check runs ([#73](https://github.com/zigorlsp7/cv/issues/73)) ([fced0fb](https://github.com/zigorlsp7/cv/commit/fced0fbb91b318c7a164195ac962a4b8e9bfecbf))
* skip release pr check runs ([#75](https://github.com/zigorlsp7/cv/issues/75)) ([c500cfd](https://github.com/zigorlsp7/cv/commit/c500cfda3cd134be0fe38dc5c674fd2e17f93785))

## [0.1.11](https://github.com/zigorlsp7/cv/compare/v0.1.10...v0.1.11) (2026-02-27)


### Bug Fixes

* **ci:** align cv release flow with release-please PR auto-merge ([#59](https://github.com/zigorlsp7/cv/issues/59)) ([07c6537](https://github.com/zigorlsp7/cv/commit/07c6537f602bb4208b8f72dd61a7def7d6a58fbd))
* restore release flow cv web ([#61](https://github.com/zigorlsp7/cv/issues/61)) ([34ccc87](https://github.com/zigorlsp7/cv/commit/34ccc8741862e7f6814f19a46e093f370191227f))

## [0.1.10](https://github.com/zigorlsp7/cv/compare/v0.1.9...v0.1.10) (2026-02-23)


### Features

* **a11y:** add accessibility audits and UI focus fixes ([#21](https://github.com/zigorlsp7/cv/issues/21)) ([5740c2a](https://github.com/zigorlsp7/cv/commit/5740c2aa3e807a578ac24689c21e14bfa3ca5646))
* add authentication with Google SSO and auth for edition ([#38](https://github.com/zigorlsp7/cv/issues/38)) ([3650505](https://github.com/zigorlsp7/cv/commit/365050572467dcb7f143363b70fda21d3af57f90))
* **api,web:** add runtime feature flags and RUM ingestion baseline ([daceec2](https://github.com/zigorlsp7/cv/commit/daceec2c65b7db16518f7a72b3af46cb83fe910b))
* basic cv info management and architecture description ([#18](https://github.com/zigorlsp7/cv/issues/18)) ([db15380](https://github.com/zigorlsp7/cv/commit/db15380c8bfb59443e7cd8597a6f8712e15a6ed0))
* **i18n:** require Tolgee runtime translations and drop local fallback ([#23](https://github.com/zigorlsp7/cv/issues/23)) ([b805acb](https://github.com/zigorlsp7/cv/commit/b805acbcf45244ab52085917f7b490f1898d02fc))


### Bug Fixes

* correct release-please config file name ([124abad](https://github.com/zigorlsp7/cv/commit/124abad98a1daa3000791ffd928c8fc7d217d6f9))
* correct release-please config file name ([6f93f47](https://github.com/zigorlsp7/cv/commit/6f93f47ad3d8d93cd510e3b8774dfa45666b0a7c))
* **deploy:** add compose binary fallback ([0fc9e1c](https://github.com/zigorlsp7/cv/commit/0fc9e1c201988e792a96ec5bca0fcf731c67efa4))
* **deploy:** authenticate EC2 host to ECR before app pull ([eb8d760](https://github.com/zigorlsp7/cv/commit/eb8d7608ad5bafb4ee84f2d595e55a2d108e3d4a))
* **deploy:** handle OpenBao volume perms when probe runs as root ([e5d4377](https://github.com/zigorlsp7/cv/commit/e5d4377584f3d3d10ebbc187f59a3cf153fa0b1f))
* **deploy:** install runtime deps on first remote run ([6fcc5c8](https://github.com/zigorlsp7/cv/commit/6fcc5c8665671269f50fe74b5588c7638082d6b8))
* **deploy:** poll SSM command status with longer timeout ([f02b546](https://github.com/zigorlsp7/cv/commit/f02b5465315940abe5a709acfab7d042123739b7))
* **deploy:** repair OpenBao data volume permissions ([9b28949](https://github.com/zigorlsp7/cv/commit/9b289497945ad424ff5140bafdc3e632330a3bad))
* **deploy:** support compose package fallback on AL2023 ([91a3f31](https://github.com/zigorlsp7/cv/commit/91a3f31c7525693e8055e1c25ec7ce7648e398a6))
* remove token like pattern ([36846aa](https://github.com/zigorlsp7/cv/commit/36846aa03a16b20a9fc47a298ae02f93ad5d2e83))
* web config ([4395350](https://github.com/zigorlsp7/cv/commit/439535074e0dcc923cf5554082b5f40a4434fa3e))

## [0.1.9](https://github.com/zigorlsp7/cv/compare/cv-v0.1.8...cv-v0.1.9) (2026-02-23)


### Bug Fixes

* **deploy:** add compose binary fallback ([0fc9e1c](https://github.com/zigorlsp7/cv/commit/0fc9e1c201988e792a96ec5bca0fcf731c67efa4))
* **deploy:** authenticate EC2 host to ECR before app pull ([eb8d760](https://github.com/zigorlsp7/cv/commit/eb8d7608ad5bafb4ee84f2d595e55a2d108e3d4a))
* **deploy:** handle OpenBao volume perms when probe runs as root ([e5d4377](https://github.com/zigorlsp7/cv/commit/e5d4377584f3d3d10ebbc187f59a3cf153fa0b1f))
* **deploy:** poll SSM command status with longer timeout ([f02b546](https://github.com/zigorlsp7/cv/commit/f02b5465315940abe5a709acfab7d042123739b7))
* **deploy:** repair OpenBao data volume permissions ([9b28949](https://github.com/zigorlsp7/cv/commit/9b289497945ad424ff5140bafdc3e632330a3bad))
* **deploy:** support compose package fallback on AL2023 ([91a3f31](https://github.com/zigorlsp7/cv/commit/91a3f31c7525693e8055e1c25ec7ce7648e398a6))

## [0.1.8](https://github.com/zigorlsp7/cv/compare/cv-v0.1.7...cv-v0.1.8) (2026-02-23)


### Bug Fixes

* **deploy:** add compose binary fallback ([0fc9e1c](https://github.com/zigorlsp7/cv/commit/0fc9e1c201988e792a96ec5bca0fcf731c67efa4))
* **deploy:** authenticate EC2 host to ECR before app pull ([eb8d760](https://github.com/zigorlsp7/cv/commit/eb8d7608ad5bafb4ee84f2d595e55a2d108e3d4a))
* **deploy:** handle OpenBao volume perms when probe runs as root ([e5d4377](https://github.com/zigorlsp7/cv/commit/e5d4377584f3d3d10ebbc187f59a3cf153fa0b1f))
* **deploy:** install runtime deps on first remote run ([6fcc5c8](https://github.com/zigorlsp7/cv/commit/6fcc5c8665671269f50fe74b5588c7638082d6b8))
* **deploy:** poll SSM command status with longer timeout ([f02b546](https://github.com/zigorlsp7/cv/commit/f02b5465315940abe5a709acfab7d042123739b7))
* **deploy:** repair OpenBao data volume permissions ([9b28949](https://github.com/zigorlsp7/cv/commit/9b289497945ad424ff5140bafdc3e632330a3bad))
* **deploy:** support compose package fallback on AL2023 ([91a3f31](https://github.com/zigorlsp7/cv/commit/91a3f31c7525693e8055e1c25ec7ce7648e398a6))

## [0.1.7](https://github.com/zigorlsp7/cv/compare/cv-v0.1.6...cv-v0.1.7) (2026-02-23)


### Bug Fixes

* **deploy:** add compose binary fallback ([0fc9e1c](https://github.com/zigorlsp7/cv/commit/0fc9e1c201988e792a96ec5bca0fcf731c67efa4))
* **deploy:** authenticate EC2 host to ECR before app pull ([eb8d760](https://github.com/zigorlsp7/cv/commit/eb8d7608ad5bafb4ee84f2d595e55a2d108e3d4a))
* **deploy:** handle OpenBao volume perms when probe runs as root ([e5d4377](https://github.com/zigorlsp7/cv/commit/e5d4377584f3d3d10ebbc187f59a3cf153fa0b1f))
* **deploy:** install runtime deps on first remote run ([6fcc5c8](https://github.com/zigorlsp7/cv/commit/6fcc5c8665671269f50fe74b5588c7638082d6b8))
* **deploy:** poll SSM command status with longer timeout ([f02b546](https://github.com/zigorlsp7/cv/commit/f02b5465315940abe5a709acfab7d042123739b7))
* **deploy:** repair OpenBao data volume permissions ([9b28949](https://github.com/zigorlsp7/cv/commit/9b289497945ad424ff5140bafdc3e632330a3bad))
* **deploy:** support compose package fallback on AL2023 ([91a3f31](https://github.com/zigorlsp7/cv/commit/91a3f31c7525693e8055e1c25ec7ce7648e398a6))

## [0.1.6](https://github.com/zigorlsp7/cv/compare/cv-v0.1.5...cv-v0.1.6) (2026-02-18)


### Features

* add authentication with Google SSO and auth for edition ([#38](https://github.com/zigorlsp7/cv/issues/38)) ([3650505](https://github.com/zigorlsp7/cv/commit/365050572467dcb7f143363b70fda21d3af57f90))

## [0.1.5](https://github.com/zigorlsp7/cv/compare/cv-v0.1.4...cv-v0.1.5) (2026-02-17)


### Features

* **i18n:** require Tolgee runtime translations and drop local fallback ([#23](https://github.com/zigorlsp7/cv/issues/23)) ([b805acb](https://github.com/zigorlsp7/cv/commit/b805acbcf45244ab52085917f7b490f1898d02fc))

## [0.1.4](https://github.com/zigorlsp7/cv/compare/cv-v0.1.3...cv-v0.1.4) (2026-02-17)


### Features

* **a11y:** add accessibility audits and UI focus fixes ([#21](https://github.com/zigorlsp7/cv/issues/21)) ([5740c2a](https://github.com/zigorlsp7/cv/commit/5740c2aa3e807a578ac24689c21e14bfa3ca5646))

## [0.1.3](https://github.com/zigorlsp7/cv/compare/cv-v0.1.2...cv-v0.1.3) (2026-02-16)


### Features

* **api,web:** add runtime feature flags and RUM ingestion baseline ([daceec2](https://github.com/zigorlsp7/cv/commit/daceec2c65b7db16518f7a72b3af46cb83fe910b))
* basic cv info management and architecture description ([#18](https://github.com/zigorlsp7/cv/issues/18)) ([db15380](https://github.com/zigorlsp7/cv/commit/db15380c8bfb59443e7cd8597a6f8712e15a6ed0))

## [0.1.2](https://github.com/zigorlsp7/cv/compare/cv-v0.1.1...cv-v0.1.2) (2026-02-14)


### Bug Fixes

* remove token like pattern ([36846aa](https://github.com/zigorlsp7/cv/commit/36846aa03a16b20a9fc47a298ae02f93ad5d2e83))
* web config ([4395350](https://github.com/zigorlsp7/cv/commit/439535074e0dcc923cf5554082b5f40a4434fa3e))

## [0.1.1](https://github.com/zigorlsp7/cv/compare/cv-v0.1.0...cv-v0.1.1) (2026-02-13)


### Bug Fixes

* correct release-please config file name ([124abad](https://github.com/zigorlsp7/cv/commit/124abad98a1daa3000791ffd928c8fc7d217d6f9))
* correct release-please config file name ([6f93f47](https://github.com/zigorlsp7/cv/commit/6f93f47ad3d8d93cd510e3b8774dfa45666b0a7c))
