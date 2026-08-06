## [1.1.0](https://github.com/rgoshen/countdown-timer-ts/compare/v1.0.1...v1.1.0) (2026-08-06)

### Features

* **release:** release on dependency bumps and publish versioned images ([248d594](https://github.com/rgoshen/countdown-timer-ts/commit/248d5941facf9510905c55dc43d250229af12e62))

### Bug Fixes

* **release:** stop racing publish-container.yml for the latest tag ([1555bdb](https://github.com/rgoshen/countdown-timer-ts/commit/1555bdb4ca4537a74ad37a31eb35313db3c3ba26))

### Dependencies

* **deps-dev:** bump @babel/core from 7.28.0 to 7.29.7 ([662aee2](https://github.com/rgoshen/countdown-timer-ts/commit/662aee227419627e136e8966a2708df31b667acf))
* **deps-dev:** bump fast-uri from 3.1.4 to 3.1.5 ([9b9abb0](https://github.com/rgoshen/countdown-timer-ts/commit/9b9abb0cae595e290e485a4d32e3f45550e66ac1))
* **deps-dev:** bump flatted from 3.3.3 to 3.4.4 ([56be23a](https://github.com/rgoshen/countdown-timer-ts/commit/56be23af9f4f216f9410908e57fc50c9bd03f271))
* **deps-dev:** bump lodash from 4.17.21 to 4.18.1 ([5bb45a5](https://github.com/rgoshen/countdown-timer-ts/commit/5bb45a516adb9fe000ceb0bc8c700c5437630ef9))
* **deps:** bump postcss from 8.5.6 to 8.5.25 ([dd15609](https://github.com/rgoshen/countdown-timer-ts/commit/dd15609dc2c2aa18e580285b51f3c0ecc84d86e2))
* **deps:** bump rollup from 4.46.2 to 4.62.4 ([93aeff1](https://github.com/rgoshen/countdown-timer-ts/commit/93aeff121f5100e5dd1098b5cae28040d6b14f23))
* **deps:** bump undici from 6.27.0 to 7.29.0 ([9c997d8](https://github.com/rgoshen/countdown-timer-ts/commit/9c997d8a58e74dec4320bd8a80efc6c313f3078c))
* **deps:** bump ws from 8.18.3 to 8.21.2 ([f02d5ed](https://github.com/rgoshen/countdown-timer-ts/commit/f02d5ed0d9816162287041105eec8a9c8e459ab0))

## [1.0.1](https://github.com/rgoshen/countdown-timer-ts/compare/v1.0.0...v1.0.1) (2026-07-25)

### Bug Fixes

* scope the pages concurrency group per ref ([ba6db61](https://github.com/rgoshen/countdown-timer-ts/commit/ba6db6126ec93b5142c23716c5305220ff4d25c1))

## 1.0.0 (2026-07-25)

### Features

* configure semantic-release with an explicit changelog type map ([aba6d9f](https://github.com/rgoshen/countdown-timer-ts/commit/aba6d9fc0be53415189fbc427fe5dcac6b074742))
* enforce conventional commit messages with commitlint ([ee1c712](https://github.com/rgoshen/countdown-timer-ts/commit/ee1c7129fbb5f585b6c3b075bc338244ddd9de21))
* publish and pull GHCR container image ([ca85138](https://github.com/rgoshen/countdown-timer-ts/commit/ca85138553c231097e7d2725989f2d99d95376a8))

### Bug Fixes

* pin the changelog preset to the version the writer supports ([7afb54c](https://github.com/rgoshen/countdown-timer-ts/commit/7afb54c3c2b4642fa22a0e9784eec9534ecd49a7))
* remove the pages preview job that cannot succeed ([307a935](https://github.com/rgoshen/countdown-timer-ts/commit/307a935c00889ba1c19061fbaed60372df911452))
* restore clean CI baseline ([fb8fa23](https://github.com/rgoshen/countdown-timer-ts/commit/fb8fa23de88e08e36407bd70b190c0037b9969e6))
* use the effect key so hidden commit types stay out of the changelog ([e640b2f](https://github.com/rgoshen/countdown-timer-ts/commit/e640b2f5054f71bb1729e2079f8cb785a370df0e))

### Documentation

* declare the changelog preset once at the config root ([6cfde42](https://github.com/rgoshen/countdown-timer-ts/commit/6cfde42660391555ee7e16284fc808317d7df179))
* design automated release and changelog ([1008a9a](https://github.com/rgoshen/countdown-timer-ts/commit/1008a9ad3c715d75903e8371dea5b30cecea5cef))
* design local Docker Compose workflow ([7d6e788](https://github.com/rgoshen/countdown-timer-ts/commit/7d6e788e5d107f821520be33691f8065fd490d5b))
* document GHCR Compose workflow ([87067ef](https://github.com/rgoshen/countdown-timer-ts/commit/87067ef27275ac1853bf65a9b332ed03e1955c84))
* document the automated release process ([251746a](https://github.com/rgoshen/countdown-timer-ts/commit/251746a8100d7f5e13df34cc338ec62565e709f7))
* note the dry-run result on non-release branches ([c020c1b](https://github.com/rgoshen/countdown-timer-ts/commit/c020c1b0e84a452a7a6192743f93562d9de29741))
* plan automated release and changelog implementation ([a3977d3](https://github.com/rgoshen/countdown-timer-ts/commit/a3977d3da47419e8f14084c909552010d0592759))
* plan local Docker Compose implementation ([6513763](https://github.com/rgoshen/countdown-timer-ts/commit/65137636b630535c214549266d6e412d63bd95b1))
* revise container workflow for GHCR ([4a27ca1](https://github.com/rgoshen/countdown-timer-ts/commit/4a27ca125ba59020ef5d840f80997821a5c86a44))
* strengthen container config test plan ([08a119f](https://github.com/rgoshen/countdown-timer-ts/commit/08a119fa176aca2df281ffb1b833efe039fee5c8))

### Continuous Integration

* add the semantic-release workflow ([8be504c](https://github.com/rgoshen/countdown-timer-ts/commit/8be504c36fe33a35c948000d514d65dc19123a39))
* give dependabot conventional commit messages ([106ee4e](https://github.com/rgoshen/countdown-timer-ts/commit/106ee4e2ffb3ab27859f7b3a7eb664241e3a2807))
