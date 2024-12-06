# Changelog
All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

- - -
## plotly-express-v0.12.0 - 2024-11-23
#### Bug Fixes
- `dx` now respects the webgl flag (#934) - (9cdf1ee) - Joe
- Remove `frequency_bar` (#955) - (17fbfca) - Joe
- Correct type for generated JsPlugin (#741) - (7da0ecc) - Joe
- Remove server startup from python tests (#768) - (c6c2dd2) - Joe
- Plotly express ticking 3d plots reset pending orientation on tick (#677) - (169354f) - Matthew Runyon
- Prevent pushing broken docs to main (#719) - (86fb7aa) - Joe
- Can't pass both x and y to violin, box and strip (#699) - (70c1805) - Joe
#### Build system
- Upgrade to Vite 5 (#899) - (e94b990) - Matthew Runyon
#### Documentation
- Mention Deephaven version where `server-ui` Docker image is mentioned (#951) - (1fac6af) - JJ Brosnan
#### Features
- Allow passing in a pandas dataframe to dx plots (#967) - (cf03ff0) - Joe
#### Tests
- default tox to 3.8 (#972) - (103c1e7) - Joe

- - -

## plotly-express-v0.11.2 - 2024-07-31
#### Bug Fixes
- Add hist by e2e test and fix error with static plot by (#664) - (88eeaea) - Joe
#### Documentation
- small changes to plotly-express readme (#681) - (8959935) - Alex Peters
- MVP plotly-express docs (#554) - (4c556d3) - Alex Peters
- Add initial density heatmap docs (#626) - (2dfbe0f) - Joe
#### Refactoring
- example dataset column names to PascalCase (#666) - (def7069) - Alex Peters

- - -

## plotly-express-v0.11.1 - 2024-07-24
#### Bug Fixes
- Fixes PartitionedTable has no agg_by error (#662) - (685c359) - Joe
#### Build system
- UI docs and add plugin_builder.py (#630) - (7281eec) - Joe
#### Documentation
- add sidebar to UI docs and adjust readme (#633) - (e690c1b) - Don

- - -

## plotly-express-v0.11.0 - 2024-07-16
#### Bug Fixes
- add datasets to import to actually use them (#616) - (2266958) - Alex Peters
#### Features
- density heatmap (#598) - (8fb924d) - Joe

- - -

## plotly-express-v0.10.0 - 2024-07-09
#### Bug Fixes
- remove Number type and replace with float/int (#590) - (d0e24f4) - Akshat Jawne
- gapminder to be compatible with Pandas 2.0.3 (#586) - (fae2f75) - Alex Peters
#### Documentation
- Make autodoc output structured (#582) - (d1aa3d5) - Joe
#### Features
- add dx.data.jobs and dx.data.marketing example data sets (#595) - (41c7f7e) - Alex Peters
- Replace shortid with nanoid (#591) - (ad8aad9) - Akshat Jawne

- - -

## plotly-express-v0.9.0 - 2024-06-20
#### Bug Fixes
- update init to bring in new datasets (#564) - (048e1d6) - Alex Peters
#### Build system
- Require deephaven-core>=0.34.0 for plotly-express (#469) - (c735dec) - mofojed
#### Documentation
- function autodocs embedded in docs (#527) - (6977a33) - Joe
- add plotting sidebar and plotting docs edits (#519) - (a9840cb) - Don
- initial rough draft of dx docs with templates (#487) - (50f6e9a) - Don
#### Features
- ticking gapminder, wind, election datasets (#541) - (c8845b6) - Alex Peters
- Ticking tips data set (#521) - (ed9baef) - Alex Peters
#### Performance Improvements
- minor improvement to dx.data.iris() time to display (#525) - (932a550) - Don
#### Refactoring
- re-write dx.data.iris() using px.data to calculate base mean/std (#509) - (58f8a97) - Don

- - -

## plotly-express-v0.8.0 - 2024-05-16
#### Bug Fixes
- Improve TimePreprocessor code (#455) - (be887f7) - Joe
#### Features
- Plotly express downsampling (#453) - (0101436) - Matthew Runyon
#### Tests
- bump ts, eslint and prettier configs (#416) - (a4761cc) - Don

- - -

## plotly-express-v0.7.0 - 2024-04-03
#### Bug Fixes
- Ensure title is added to default figure (#396) - (2f0a8a0) - Joe
- Deephaven express chart title does not update dynamically (#386) - (556d07c) - Matthew Runyon
#### Features
- combine plotly plots into plotly-express plugin (#358) - (7a1893d) - Joe
- Add python 3.12 testing (#398) - (241348f) - devinrsmith

- - -

## plotly-express-v0.6.0 - 2024-03-19
#### Features
- Package matplotlib and ui JS with wheel (#343) - (7724e55) - Joe

- - -

## plotly-express-v0.5.0 - 2024-03-06
#### Build system
- Update dh ui packages to ^0.66.1 (#330) - (9433a98) - bmingles
#### Features
- Export plotly-express as a dashboard plugin (#329) - (6212bd5) - vbabich

- - -

## plotly-express-v0.4.1 - 2024-02-28
#### Bug Fixes
- Scatter plots rendering at the wrong location (#324) - (dfe5c48) - mofojed
- Type fixes and require pyright (#302) - (d5d003d) - Joe

- - -

## plotly-express-v0.4.0 - 2024-02-20
#### Bug Fixes
- Deephaven express memory leak (#277) - (ff6ad50) - Matthew Runyon
#### Build system
- Only install JS with Python with env var set (#285) - (22662df) - mofojed
#### Features
- Remove UI theme from PlotlyExpressChartModel (#251) - (4cbe4ca) - Matthew Runyon

- - -

## plotly-express-v0.3.0 - 2024-02-12
#### Bug Fixes
- Initial set of type fixes (#217) - (5c52488) - Joe
- Version bump + loading spinner fixes (#243) - (aeb7796) - bmingles
- Fixed time preprocessor test (#181) - (05bbd59) - Joe
#### Build system
- Post-release plotly-express bump to 0.3.0.dev0 (#173) - (0e69a02) - Joe
#### Features
- Support lerna scopes in npm start (#203) - (aab9591) - bmingles
- Add plotly-express JsPlugin implementation and registration (#150) - (d6d0416) - devinrsmith

- - -

Changelog generated by [cocogitto](https://github.com/cocogitto/cocogitto).