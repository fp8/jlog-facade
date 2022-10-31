# FP8 Typescript Node Seed Project

## Adding to GITLAB

This project has been prepared to be added to gitlab.  The follow step should be performed:

```
cd <proj-name>
git init
git lfs track "release/*.tgz"
git add .
git commit -m"Initial Commit"
```

Make sure to update the `package.json`'s `repository` section with url of the remote git project.

#### GIT LFS

* Setup [GIT LFS](https://git-lfs.github.com/)

## CI that includes Test

The default `.gitlab-ci.yml` is a simple version that create pages only for documentation.  Here is
a version that will also run tests:

```yaml
image: farport/fp8-alpine-node:latest

stages:
  - test
  - test_failed
  - deploy

test_job:
  stage: test
  script:
    - mkdir -p .public
    - yarn install
    - yarn test
    - wget --output-document .public/test-badge.svg https://img.shields.io/badge/test-passed-green.svg
    - yarn gitversion
  only:
    - master
  tags:
    - farport
    - nodejs
  artifacts:
    paths:
      - .public

test_job_failure:
  stage: test_failed
  script:
    - wget --output-document .public/test-badge.svg https://img.shields.io/badge/test-failed-red.svg
  when: on_failure
  only:
    - master
  tags:
    - farport
    - nodejs
  artifacts:
    paths:
      - .public

pages:
  stage: deploy
  script:
    - mkdir -p .public/rel
    - cp -r docs/* .public/
    - mkdir -p .public/docs/vers
    - cp -r docvers/* .public/docs/vers/
    - cp -r release/* .public/rel/
    - mv .public public
  when: always
  artifacts:
    paths:
      - public
  only:
    - master
  tags:
    - farport
    - nodejs
```
