# Changelog

All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

- - -

## plotly-express-v0.19.2 - 2026-04-09

#### Bug Fixes

- DH-22224: Add multi-plugin support for Deephaven express ([#1330](https://github.com/deephaven/deephaven-plugins/pull/1330)) - (bf283e9) - mofojed

#### Documentation

- DH-21774: Plot by performance warning ([#1325](https://github.com/deephaven/deephaven-plugins/pull/1325)) - (cc79762) - Germain

- - -

## plotly-express-v0.19.1 - 2026-03-26

#### Bug Fixes

- DH-21423: xaxis_titles and yaxis_titles now apply to OHLC  ([#1318](https://github.com/deephaven/deephaven-plugins/pull/1318)) - (2fb5826) - Germain
- Fix a few type issues ([#1320](https://github.com/deephaven/deephaven-plugins/pull/1320)) - (65afb5f) - jnumainville

- - -

## plotly-express-v0.19.0 - 2026-03-16

#### Breaking Changes

- DH-20808: Add subplot_titles and title parameters to make_subplots ([#1283](https://github.com/deephaven/deephaven-plugins/pull/1283)) - (a9a28ab) - jnumainville

#### Features

- DH-20808: Add subplot_titles and title parameters to make_subplots ([#1283](https://github.com/deephaven/deephaven-plugins/pull/1283)) - (a9a28ab) - jnumainville

#### Bug Fixes

- Correct version for deephaven-core ([#1312](https://github.com/deephaven/deephaven-plugins/pull/1312)) - (d4ca2a1) - jnumainville
- DH-21383: Convert map center to TypedDict ([#1285](https://github.com/deephaven/deephaven-plugins/pull/1285)) - (9f279ae) - jnumainville
- Specify Sphinx version constraint in requirements and fix tests ([#1300](https://github.com/deephaven/deephaven-plugins/pull/1300)) - (c29fbfc) - jnumainville

- - -

## plotly-express-v0.18.3 - 2026-01-15

#### Breaking Changes

- DH-21259: Fix maps and add docs ([#1279](https://github.com/deephaven/deephaven-plugins/pull/1279)) - (99656a9) - jnumainville

#### Bug Fixes

- DH-21259: Fix maps and add docs ([#1279](https://github.com/deephaven/deephaven-plugins/pull/1279)) - (99656a9) - jnumainville

- - -

## plotly-express-v0.18.2 - 2025-11-18

#### Bug Fixes

- DH-20908: Handle table disconnects in Plotly Express ([#1267](https://github.com/deephaven/deephaven-plugins/pull/1267)) - (37e8a11) - bmingles

- - -

## plotly-express-v0.18.1 - 2025-11-04

#### Features

- Deephaven Pivot plugin ([#1231](https://github.com/deephaven/deephaven-plugins/pull/1231)) - (ac5d6f5) - vbabich

#### Bug Fixes

- update data generators to be deterministic when columns evaluated in parallel ([#1240](https://github.com/deephaven/deephaven-plugins/pull/1240)) - (dc17eab) - dsmmcken

#### Build system

- Update TypeScript to v5 ([#1247](https://github.com/deephaven/deephaven-plugins/pull/1247)) - (e98edd9) - mofojed

- - -

## plotly-express-v0.18.0 - 2025-09-10

#### Features

- Pivot table example generator ([#1230](https://github.com/deephaven/deephaven-plugins/pull/1230)) - (2ff9325) - dsmmcken

- - -

## plotly-express-v0.17.2 - 2025-09-03

#### Bug Fixes

- DH-18443: Fix `dx` and `dh.ui` tooltips ([#1226](https://github.com/deephaven/deephaven-plugins/pull/1226)) - (371bfcd) - jnumainville
- DH-18653: migrate to plotly >= 6.0.0 ([#1179](https://github.com/deephaven/deephaven-plugins/pull/1179)) - (61b76b8) - jnumainville

#### Build system

- Fix docs code fence plugin not registering py or groovy ([#1220](https://github.com/deephaven/deephaven-plugins/pull/1220)) - (96a6dc7) - mattrunyon

- - -

## plotly-express-v0.17.1 - 2025-07-22

#### Bug Fixes

- DH-19839: Subplot row_heights reversed in place ([#1203](https://github.com/deephaven/deephaven-plugins/pull/1203)) - (b82c47d) - jnumainville

- - -

## plotly-express-v0.17.0 - 2025-07-16

#### Features

- DH-18281: Add dx filter support ([#1185](https://github.com/deephaven/deephaven-plugins/pull/1185)) - (905945e) - jnumainville

#### Documentation

- Update a couple typos in static image export ([#1200](https://github.com/deephaven/deephaven-plugins/pull/1200)) - (72bb6d8) - mofojed

- - -

## plotly-express-v0.16.1 - 2025-06-24

#### Bug Fixes

- DH-19036: Fix failing subplot creation ([#1176](https://github.com/deephaven/deephaven-plugins/pull/1176)) - (e53b165) - jnumainville

#### Documentation

- Update our instructions for installing kaleido ([#1195](https://github.com/deephaven/deephaven-plugins/pull/1195)) - (106b74c) - mofojed
- DOC-574: Titles and Legends doc ([#1174](https://github.com/deephaven/deephaven-plugins/pull/1174)) - (9df65df) - jnumainville
- DOC-684: add webgl chrome limitations ([#1181](https://github.com/deephaven/deephaven-plugins/pull/1181)) - (542cb81) - jnumainville
- DOC-754: Fix header levels causing warnings ([#1178](https://github.com/deephaven/deephaven-plugins/pull/1178)) - (da5d339) - Germain Zhang-Houle

#### Build system

- Add snapshot generator ([#1183](https://github.com/deephaven/deephaven-plugins/pull/1183)) - (5b5ee61) - mofojed

- - -

## plotly-express-v0.16.0 - 2025-05-06

#### Features

- DH-18317: Add hierarchical path ([#1164](https://github.com/deephaven/deephaven-plugins/pull/1164)) - (334829d) - jnumainville

#### Bug Fixes

- fix hovertext logic for hierarchical plots ([#1159](https://github.com/deephaven/deephaven-plugins/pull/1159)) - (fddd6de) - jnumainville

#### Build system

- DH-19353: Add transpiled files and types to plotly-express build ([#1170](https://github.com/deephaven/deephaven-plugins/pull/1170)) - (65fa2fc) - mattrunyon

- - -

## plotly-express-v0.15.0 - 2025-04-30

#### Features

- DH-18073: Static image creation for dx ([#1167](https://github.com/deephaven/deephaven-plugins/pull/1167)) - (650d496) - jnumainville

#### Documentation

- Add ui component overview page, adjust sidebar ([#1161](https://github.com/deephaven/deephaven-plugins/pull/1161)) - (9ba7f2c) - dsmmcken
- snapshots for plotly-express components ([#1146](https://github.com/deephaven/deephaven-plugins/pull/1146)) - (98b0115) - ethanalvizo
- DH-18516: Add branchvalues info to hierarchical plots ([#1153](https://github.com/deephaven/deephaven-plugins/pull/1153)) - (8942623) - jnumainville

- - -

## plotly-express-v0.14.0 - 2025-04-08

#### Features

- DH-18165: Add calendar argument to several dx charts ([#1122](https://github.com/deephaven/deephaven-plugins/pull/1122)) - (47a2d71) - jnumainville
- indicator chart ([#1088](https://github.com/deephaven/deephaven-plugins/pull/1088)) - (eb835e3) - jnumainville

#### Bug Fixes

- DH-18685: Remove top margin from chart ([#1126](https://github.com/deephaven/deephaven-plugins/pull/1126)) - (47900a5) - jnumainville
- Detect if webgl is supported ([#1147](https://github.com/deephaven/deephaven-plugins/pull/1147)) - (5e651d1) - jnumainville
- Make `dx` histogram behavior consistent with `px` ([#1002](https://github.com/deephaven/deephaven-plugins/pull/1002)) - (08dcbce) - jnumainville
- Fix type version for plotly-express ([#1144](https://github.com/deephaven/deephaven-plugins/pull/1144)) - (2630d25) - mattrunyon

#### Build system

- Add custom sphinx translator to fix relative image paths in output ([#1136](https://github.com/deephaven/deephaven-plugins/pull/1136)) - (fa6615e) - mattrunyon

- - -

## plotly-express-v0.13.1 - 2025-03-07

#### Bug Fixes

- LivenessStateException with static table in `dx` and `ui` ([#1074](https://github.com/deephaven/deephaven-plugins/pull/1074)) - (951a376) - jnumainville

- - -

## plotly-express-v0.13.0 - 2025-02-04

#### Features

- `dx.indicator` spec ([#1062](https://github.com/deephaven/deephaven-plugins/pull/1062)) - (4478013) - jnumainville

#### Bug Fixes

- DH-18538: Deephaven express not respecting webgl flag within dh.ui ([#1103](https://github.com/deephaven/deephaven-plugins/pull/1103)) - (4516b77) - mattrunyon
- Pin plotly version ([#1104](https://github.com/deephaven/deephaven-plugins/pull/1104)) - (fa37812) - jnumainville
- Make docs links passthrough ([#1085](https://github.com/deephaven/deephaven-plugins/pull/1085)) - (2ef0ddb) - jnumainville

#### Documentation

- fix renamed unsafe-figure-update ([#1091](https://github.com/deephaven/deephaven-plugins/pull/1091)) - (ea5d637) - dsmmcken
- Add `unsafe_update_figure` doc ([#1058](https://github.com/deephaven/deephaven-plugins/pull/1058)) - (90c8e19) - jnumainville
- Expand sidebars by default for certain categories, add link to flexbox froggy ([#1073](https://github.com/deephaven/deephaven-plugins/pull/1073)) - (e76591d) - dsmmcken

- - -

## plotly-express-v0.12.1 - 2024-12-12

#### Bug Fixes

- switch to webgl by default for line plot ([#992](https://github.com/deephaven/deephaven-plugins/pull/992)) - (2c7bc01) - jnumainville

- - -

## plotly-express-v0.12.0 - 2024-11-22

#### Features

- Allow passing in a pandas dataframe to dx plots ([#967](https://github.com/deephaven/deephaven-plugins/pull/967)) - (cf03ff0) - jnumainville

#### Bug Fixes

- `dx` now respects the webgl flag ([#934](https://github.com/deephaven/deephaven-plugins/pull/934)) - (9cdf1ee) - jnumainville
- Remove `frequency_bar` ([#955](https://github.com/deephaven/deephaven-plugins/pull/955)) - (17fbfca) - jnumainville
- Correct type for generated JsPlugin ([#741](https://github.com/deephaven/deephaven-plugins/pull/741)) - (7da0ecc) - jnumainville
- Remove server startup from python tests ([#768](https://github.com/deephaven/deephaven-plugins/pull/768)) - (c6c2dd2) - jnumainville
- Plotly express ticking 3d plots reset pending orientation on tick ([#677](https://github.com/deephaven/deephaven-plugins/pull/677)) - (169354f) - mattrunyon
- Prevent pushing broken docs to main ([#719](https://github.com/deephaven/deephaven-plugins/pull/719)) - (86fb7aa) - jnumainville
- Can't pass both x and y to violin, box and strip ([#699](https://github.com/deephaven/deephaven-plugins/pull/699)) - (70c1805) - jnumainville

#### Documentation

- Mention Deephaven version where `server-ui` Docker image is mentioned ([#951](https://github.com/deephaven/deephaven-plugins/pull/951)) - (1fac6af) - JJ Brosnan

#### Tests

- default tox to 3.8 ([#972](https://github.com/deephaven/deephaven-plugins/pull/972)) - (103c1e7) - jnumainville

#### Build system

- Upgrade to Vite 5 ([#899](https://github.com/deephaven/deephaven-plugins/pull/899)) - (e94b990) - mattrunyon

- - -

## plotly-express-v0.11.2 - 2024-07-31

#### Bug Fixes

- Add hist by e2e test and fix error with static plot by ([#664](https://github.com/deephaven/deephaven-plugins/pull/664)) - (88eeaea) - jnumainville

#### Documentation

- small changes to plotly-express readme ([#681](https://github.com/deephaven/deephaven-plugins/pull/681)) - (8959935) - Alex Peters
- MVP plotly-express docs ([#554](https://github.com/deephaven/deephaven-plugins/pull/554)) - (4c556d3) - Alex Peters
- Add initial density heatmap docs ([#626](https://github.com/deephaven/deephaven-plugins/pull/626)) - (2dfbe0f) - jnumainville

#### Refactoring

- example dataset column names to PascalCase ([#666](https://github.com/deephaven/deephaven-plugins/pull/666)) - (def7069) - Alex Peters

- - -

## plotly-express-v0.11.1 - 2024-07-24

#### Bug Fixes

- Fixes PartitionedTable has no agg_by error ([#662](https://github.com/deephaven/deephaven-plugins/pull/662)) - (685c359) - jnumainville

#### Documentation

- add sidebar to UI docs and adjust readme ([#633](https://github.com/deephaven/deephaven-plugins/pull/633)) - (e690c1b) - dsmmcken

#### Build system

- UI docs and add plugin_builder.py ([#630](https://github.com/deephaven/deephaven-plugins/pull/630)) - (7281eec) - jnumainville

- - -

## plotly-express-v0.11.0 - 2024-07-16

#### Features

- density heatmap ([#598](https://github.com/deephaven/deephaven-plugins/pull/598)) - (8fb924d) - jnumainville

#### Bug Fixes

- add datasets to import to actually use them ([#616](https://github.com/deephaven/deephaven-plugins/pull/616)) - (2266958) - Alex Peters

- - -

## plotly-express-v0.10.0 - 2024-07-09

#### Features

- add dx.data.jobs and dx.data.marketing example data sets ([#595](https://github.com/deephaven/deephaven-plugins/pull/595)) - (41c7f7e) - Alex Peters
- Replace shortid with nanoid ([#591](https://github.com/deephaven/deephaven-plugins/pull/591)) - (ad8aad9) - Akshat Jawne

#### Bug Fixes

- remove Number type and replace with float/int ([#590](https://github.com/deephaven/deephaven-plugins/pull/590)) - (d0e24f4) - Akshat Jawne
- gapminder to be compatible with Pandas 2.0.3 ([#586](https://github.com/deephaven/deephaven-plugins/pull/586)) - (fae2f75) - Alex Peters

#### Documentation

- Make autodoc output structured ([#582](https://github.com/deephaven/deephaven-plugins/pull/582)) - (d1aa3d5) - jnumainville

- - -

## plotly-express-v0.9.0 - 2024-06-20

#### Features

- ticking gapminder, wind, election datasets ([#541](https://github.com/deephaven/deephaven-plugins/pull/541)) - (c8845b6) - Alex Peters
- Ticking tips data set ([#521](https://github.com/deephaven/deephaven-plugins/pull/521)) - (ed9baef) - Alex Peters

#### Bug Fixes

- update init to bring in new datasets ([#564](https://github.com/deephaven/deephaven-plugins/pull/564)) - (048e1d6) - Alex Peters

#### Performance Improvements

- minor improvement to dx.data.iris() time to display ([#525](https://github.com/deephaven/deephaven-plugins/pull/525)) - (932a550) - dsmmcken

#### Documentation

- function autodocs embedded in docs ([#527](https://github.com/deephaven/deephaven-plugins/pull/527)) - (6977a33) - jnumainville
- add plotting sidebar and plotting docs edits ([#519](https://github.com/deephaven/deephaven-plugins/pull/519)) - (a9840cb) - dsmmcken
- initial rough draft of dx docs with templates ([#487](https://github.com/deephaven/deephaven-plugins/pull/487)) - (50f6e9a) - dsmmcken

#### Refactoring

- re-write dx.data.iris() using px.data to calculate base mean/std ([#509](https://github.com/deephaven/deephaven-plugins/pull/509)) - (58f8a97) - dsmmcken

#### Build system

- Require deephaven-core>=0.34.0 for plotly-express ([#469](https://github.com/deephaven/deephaven-plugins/pull/469)) - (c735dec) - mofojed

- - -

## plotly-express-v0.8.0 - 2024-05-16

#### Features

- Plotly express downsampling ([#453](https://github.com/deephaven/deephaven-plugins/pull/453)) - (0101436) - mattrunyon

#### Bug Fixes

- Improve TimePreprocessor code ([#455](https://github.com/deephaven/deephaven-plugins/pull/455)) - (be887f7) - jnumainville

#### Tests

- bump ts, eslint and prettier configs ([#416](https://github.com/deephaven/deephaven-plugins/pull/416)) - (a4761cc) - dsmmcken

- - -

## plotly-express-v0.7.0 - 2024-04-03

#### Features

- combine plotly plots into plotly-express plugin ([#358](https://github.com/deephaven/deephaven-plugins/pull/358)) - (7a1893d) - jnumainville
- Add python 3.12 testing ([#398](https://github.com/deephaven/deephaven-plugins/pull/398)) - (241348f) - devinrsmith

#### Bug Fixes

- Ensure title is added to default figure ([#396](https://github.com/deephaven/deephaven-plugins/pull/396)) - (2f0a8a0) - jnumainville
- Deephaven express chart title does not update dynamically ([#386](https://github.com/deephaven/deephaven-plugins/pull/386)) - (556d07c) - mattrunyon

- - -

## plotly-express-v0.6.0 - 2024-03-19

#### Features

- Package matplotlib and ui JS with wheel ([#343](https://github.com/deephaven/deephaven-plugins/pull/343)) - (7724e55) - jnumainville

- - -

## plotly-express-v0.5.0 - 2024-03-06

#### Breaking Changes

- Export plotly-express as a dashboard plugin ([#329](https://github.com/deephaven/deephaven-plugins/pull/329)) - (6212bd5) - vbabich

#### Features

- Export plotly-express as a dashboard plugin ([#329](https://github.com/deephaven/deephaven-plugins/pull/329)) - (6212bd5) - vbabich

#### Build system

- Update dh ui packages to ^0.66.1 ([#330](https://github.com/deephaven/deephaven-plugins/pull/330)) - (9433a98) - bmingles

- - -

## plotly-express-v0.4.1 - 2024-02-28

#### Bug Fixes

- Scatter plots rendering at the wrong location ([#324](https://github.com/deephaven/deephaven-plugins/pull/324)) - (dfe5c48) - mofojed
- Type fixes and require pyright ([#302](https://github.com/deephaven/deephaven-plugins/pull/302)) - (d5d003d) - jnumainville

- - -

## plotly-express-v0.4.0 - 2024-02-20

#### Features

- Remove UI theme from PlotlyExpressChartModel ([#251](https://github.com/deephaven/deephaven-plugins/pull/251)) - (4cbe4ca) - mattrunyon

#### Bug Fixes

- Deephaven express memory leak ([#277](https://github.com/deephaven/deephaven-plugins/pull/277)) - (ff6ad50) - mattrunyon

#### Build system

- Only install JS with Python with env var set ([#285](https://github.com/deephaven/deephaven-plugins/pull/285)) - (22662df) - mofojed

- - -

## plotly-express-v0.3.0 - 2024-02-12

#### Features

- Support lerna scopes in npm start ([#203](https://github.com/deephaven/deephaven-plugins/pull/203)) - (aab9591) - bmingles
- Add plotly-express JsPlugin implementation and registration ([#150](https://github.com/deephaven/deephaven-plugins/pull/150)) - (d6d0416) - devinrsmith

#### Bug Fixes

- Initial set of type fixes ([#217](https://github.com/deephaven/deephaven-plugins/pull/217)) - (5c52488) - jnumainville
- Version bump + loading spinner fixes ([#243](https://github.com/deephaven/deephaven-plugins/pull/243)) - (aeb7796) - bmingles
- Fixed time preprocessor test ([#181](https://github.com/deephaven/deephaven-plugins/pull/181)) - (05bbd59) - jnumainville

#### Build system

- Post-release plotly-express bump to 0.3.0.dev0 ([#173](https://github.com/deephaven/deephaven-plugins/pull/173)) - (0e69a02) - jnumainville

- - -

## plotly-express-v0.2.0 - 2023-12-14

#### Features

- plotly-express Deephaven UI widget loading ([#119](https://github.com/deephaven/deephaven-plugins/pull/119)) - (878aa91) - mattrunyon
- bidirectional support ([#34](https://github.com/deephaven/deephaven-plugins/pull/34)) - (9e868ab) - jnumainville
- Convert plotly-express to WidgetPlugin ([#104](https://github.com/deephaven/deephaven-plugins/pull/104)) - (44e4983) - mattrunyon
- Adding maps ([#71](https://github.com/deephaven/deephaven-plugins/pull/71)) - (77507b9) - jnumainville

#### Bug Fixes

- type hint was wrong type in dx data generator ([#155](https://github.com/deephaven/deephaven-plugins/pull/155)) - (12802d4) - dsmmcken
- histograms not rendering properly ([#141](https://github.com/deephaven/deephaven-plugins/pull/141)) - (1c272b2) - jnumainville
- Set dtype_backend to None ([#136](https://github.com/deephaven/deephaven-plugins/pull/136)) - (8fccf21) - mofojed

#### Build system

- Version bump plotly-express to 0.2.0 ([#172](https://github.com/deephaven/deephaven-plugins/pull/172)) - (fb54a60) - jnumainville
- Update plotly-express to v0.2.0dev1 ([#137](https://github.com/deephaven/deephaven-plugins/pull/137)) - (84c6092) - mofojed

- - -

## plotly-express-v0.1.0 - 2023-10-26

#### Features

- Auth keycloak plugin ([#19](https://github.com/deephaven/deephaven-plugins/pull/19)) - (8e77e7d) - mofojed

#### Bug Fixes

- Plotly express package.json main field ([#72](https://github.com/deephaven/deephaven-plugins/pull/72)) - (85e9acf) - mattrunyon
- iris data should start with some data already ticked so docs don't show nothing ([#69](https://github.com/deephaven/deephaven-plugins/pull/69)) - (dd9513a) - dsmmcken
- 3d view resetting on tick ([#45](https://github.com/deephaven/deephaven-plugins/pull/45)) - (695a667) - mattrunyon
- Series colors when using plot_by symbol ([#33](https://github.com/deephaven/deephaven-plugins/pull/33)) - (89ebdbc) - mattrunyon

#### Build system

- Version bump dx to 0.1.0 ([#86](https://github.com/deephaven/deephaven-plugins/pull/86)) - (790b5b7) - jnumainville

- - -

