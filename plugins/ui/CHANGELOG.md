# Changelog

All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

- - -

## ui-v0.40.0 - 2026-07-02

#### Features

- DH-19683: multi-select combo box component in deephaven.ui ([#1349](https://github.com/deephaven/deephaven-plugins/pull/1349)) - (63dc774) - jnumainville
- DH-22536: Apply transformations to dh.ui widgets when sending to clients. ([#1357](https://github.com/deephaven/deephaven-plugins/pull/1357)) - (1fbbb71) - Charles P. Wright

- - -


## ui-v0.39.1 - 2026-06-29

#### Bug Fixes

- **(ui)** DH-22995: wrap bare dashboard children in a panel on rehydration ([#1379](https://github.com/deephaven/deephaven-plugins/pull/1379)) - (ef050b7) - mofojed

- - -


## ui-v0.39.0 - 2026-06-26

#### Features

- DH-21756: Add ui.component memoization and selective re-rendering ([#1296](https://github.com/deephaven/deephaven-plugins/pull/1296)) - (bc1a3d2) - mofojed
- DH-21841: Add a way to set table sort state from `ui.table`. ([#1358](https://github.com/deephaven/deephaven-plugins/pull/1358)) - (45d9922) - Simon

#### Bug Fixes

- DH-18770: Chart builder support for ui.table ([#1356](https://github.com/deephaven/deephaven-plugins/pull/1356)) - (a36b309) - jnumainville
- DOC-1404: update link to dynamic plots overview ([#1374](https://github.com/deephaven/deephaven-plugins/pull/1374)) - (a30f1c6) - margaretkennedy
- DH-21257: Check if panel parent is in root when opening ([#1366](https://github.com/deephaven/deephaven-plugins/pull/1366)) - (3ac48fb) - dgodinez-dh

- - -


## ui-v0.38.0 - 2026-06-10

#### Features

- DH-19717: Add per-user persistence for dashboards ([#1352](https://github.com/deephaven/deephaven-plugins/pull/1352)) - (8730542) - mofojed

#### Bug Fixes

- **(ui)** DH-22743: check for existing panels from the layout root instead of the parent stack ([#1359](https://github.com/deephaven/deephaven-plugins/pull/1359)) - (7878751) - mofojed
- DH-22684: text input fields preserve user input while focused ([#1350](https://github.com/deephaven/deephaven-plugins/pull/1350)) - (0b40d46) - mofojed

- - -


## ui-v0.37.0 - 2026-05-20

#### Features

- DH-21898: Local routing ([#1348](https://github.com/deephaven/deephaven-plugins/pull/1348)) - (a42efa4) - jnumainville
- DH-21757: WidgetPlugin support in deephaven.ui ([#1341](https://github.com/deephaven/deephaven-plugins/pull/1341)) - (86c141e) - mofojed

- - -


## ui-v0.36.1 - 2026-05-13

#### Bug Fixes

- DH-22174: ui.table works with rollup and tree tables ([#1343](https://github.com/deephaven/deephaven-plugins/pull/1343)) - (3a83d3f) - mofojed

#### Documentation

- DOC-752 copies changelog on docs build and adds to sidebar menu ([#1345](https://github.com/deephaven/deephaven-plugins/pull/1345)) - (6fa17ba) - dsmmcken

- - -


## ui-v0.36.0 - 2026-05-06

#### Features

- DH-22178: deephaven.ui context ([#1334](https://github.com/deephaven/deephaven-plugins/pull/1334)) - (e528392) - jnumainville

#### Documentation

- DOC-1344: dh.ui improvements with confirmed details ([#1338](https://github.com/deephaven/deephaven-plugins/pull/1338)) - (bcd183f) - elijahpetty

- - -

## ui-v0.35.0 - 2026-04-22

#### Features

- DH-21654: Routing hooks ([#1319](https://github.com/deephaven/deephaven-plugins/pull/1319)) - (95de68d) - jnumainville
- DH-21376: Add heatmap support to ui.TableFormat ([#1329](https://github.com/deephaven/deephaven-plugins/pull/1329)) - (18af2da) - Germain

#### Bug Fixes

- DH-21616: Databar overrides text color when using format prop ([#1323](https://github.com/deephaven/deephaven-plugins/pull/1323)) - (af9b1e1) - Germain

#### Documentation

- DOC-1099: misc dh.ui doc improvements ([#1331](https://github.com/deephaven/deephaven-plugins/pull/1331)) - (59f0eff) - elijahpetty

#### Revert

- "docs: DOC-1099: misc dh.ui doc improvements" ([#1337](https://github.com/deephaven/deephaven-plugins/pull/1337)) - (f73abf8) - dsmmcken

- - -

## ui-v0.34.0 - 2026-03-26

#### Features

- DH-21375: Integrate databars with UI table format ([#1289](https://github.com/deephaven/deephaven-plugins/pull/1289)) - (da5892b) - Germain

#### Bug Fixes

- Fix a few type issues ([#1320](https://github.com/deephaven/deephaven-plugins/pull/1320)) - (65afb5f) - jnumainville

- - -

## ui-v0.33.0 - 2026-03-09

#### Features

- **(ui)** DH-19818: add nested dashboard support ([#1302](https://github.com/deephaven/deephaven-plugins/pull/1302)) - (b8fd9ed) - mofojed

- - -

## ui-v0.32.3 - 2026-03-05

#### Bug Fixes

- DH-21449: Fix flickering from cloning all objects in apply patch ([#1309](https://github.com/deephaven/deephaven-plugins/pull/1309)) - (e72ee74) - dgodinez-dh

- - -

## ui-v0.32.2 - 2026-02-19

#### Bug Fixes

- DH-21670: Memory leak when using use_row_data hooks ([#1305](https://github.com/deephaven/deephaven-plugins/pull/1305)) - (274feda) - mofojed
- DH-20953: AG Grid styling only worked when deephaven.ui installed ([#1271](https://github.com/deephaven/deephaven-plugins/pull/1271)) - (7dae890) - mofojed
- DH-19973: Ad-hoc aggregations not persisting on UI Table ([#1232](https://github.com/deephaven/deephaven-plugins/pull/1232)) - (abedaee) - mattrunyon

#### Documentation

- DOC-1109: Deephaven UI table docs should link to theme colors (p2 - fix link) ([#1304](https://github.com/deephaven/deephaven-plugins/pull/1304)) - (d1cb0cf) - elijahpetty
- DOC-1109: Deephaven UI table docs should link to theme colors ([#1294](https://github.com/deephaven/deephaven-plugins/pull/1294)) - (65b1c50) - elijahpetty
- DOC-1127: Clarify that all components re-render on state changes and emphasize use_memo for expensive calculations ([#1291](https://github.com/deephaven/deephaven-plugins/pull/1291)) - (b5c1f3d) - mofojed
- DOC-824: multi select combo_box example ([#1255](https://github.com/deephaven/deephaven-plugins/pull/1255)) - (910d174) - ethanalvizo
- Add active_item_index example to ui.stack documentation ([#1258](https://github.com/deephaven/deephaven-plugins/pull/1258)) - (ea7793e) - Copilot
- Move always fetch columns section to events documentation ([#1254](https://github.com/deephaven/deephaven-plugins/pull/1254)) - (c2529ff) - Copilot
- Update error message description in documentation ([#1256](https://github.com/deephaven/deephaven-plugins/pull/1256)) - (b7ace57) - dsmmcken
- DOC-896: ui.table databar examples ([#1235](https://github.com/deephaven/deephaven-plugins/pull/1235)) - (0d94f49) - ethanalvizo
- scrollable image ([#1236](https://github.com/deephaven/deephaven-plugins/pull/1236)) - (a0c06f1) - ethanalvizo
- ui.TableFormat text alignment property example ([#1229](https://github.com/deephaven/deephaven-plugins/pull/1229)) - (1024cca) - dsmmcken

#### Build system

- Update TypeScript to v5 ([#1247](https://github.com/deephaven/deephaven-plugins/pull/1247)) - (e98edd9) - mofojed

- - -

## ui-v0.32.1 - 2025-09-03

#### Bug Fixes

- DH-18443: Fix `dx` and `dh.ui` tooltips ([#1226](https://github.com/deephaven/deephaven-plugins/pull/1226)) - (371bfcd) - jnumainville

- - -

## ui-v0.32.0 - 2025-08-14

#### Features

- DH-10205: Enforce text alignment priority hierarchy in UI table ([#1219](https://github.com/deephaven/deephaven-plugins/pull/1219)) - (cc96a74) - Germain Zhang-Houle
- Add ui.resolve to support URIs in dh.ui ([#1215](https://github.com/deephaven/deephaven-plugins/pull/1215)) - (bf2d51d) - mattrunyon
- DH-19146: element plugin and template ([#1201](https://github.com/deephaven/deephaven-plugins/pull/1201)) - (f06b2cf) - jnumainville
- DH-18601: Table plugin support on ui.table ([#1217](https://github.com/deephaven/deephaven-plugins/pull/1217)) - (2084cf5) - mattrunyon

#### Bug Fixes

- DH-19988: Render error superceding document error on reinitialize ([#1222](https://github.com/deephaven/deephaven-plugins/pull/1222)) - (e5a97cb) - mattrunyon

#### Build system

- Fix docs code fence plugin not registering py or groovy ([#1220](https://github.com/deephaven/deephaven-plugins/pull/1220)) - (96a6dc7) - mattrunyon

- - -

## ui-v0.31.4 - 2026-03-09

#### Bug Fixes

- DH-21449: Fix flickering from cloning all objects in apply patch… ([#1313](https://github.com/deephaven/deephaven-plugins/pull/1313)) - (eda29ae) - mofojed

- - -

## ui-v0.31.3 - 2025-10-17

- - -

## ui-v0.31.2 - 2025-10-15

#### Bug Fixes

- DH-19973: Ad-hoc aggregations not persisting on UI Table ([#1233](https://github.com/deephaven/deephaven-plugins/pull/1233)) - (30f9eb2) - mattrunyon

- - -

## ui-v0.31.1 - 2025-08-14

#### Bug Fixes

- DH-19988: Render error superceding document error on reinitialize ([#1223](https://github.com/deephaven/deephaven-plugins/pull/1223)) - (736f2b2) - mattrunyon

- - -

## ui-v0.31.0 - 2025-07-16

#### Features

- DH-18836 Add support for linker to UITable ([#1187](https://github.com/deephaven/deephaven-plugins/pull/1187)) - (b23ec3c) - mattrunyon

#### Bug Fixes

- DH-19428: Make ui.image use crossorigin="anonymous" ([#1211](https://github.com/deephaven/deephaven-plugins/pull/1211)) - (39707ea) - mofojed
- DOC-843: Update tutorial ([#1212](https://github.com/deephaven/deephaven-plugins/pull/1212)) - (725457b) - margaretkennedy

- - -

## ui-v0.30.0 - 2025-07-09

#### Features

- DH-19292 Add ui.table selection event ([#1196](https://github.com/deephaven/deephaven-plugins/pull/1196)) - (85db04b) - mattrunyon
- DH-18354 Add input filter support to UITable ([#1180](https://github.com/deephaven/deephaven-plugins/pull/1180)) - (edd9397) - mattrunyon
- DH-19000: Persist deephaven UI table client-side state ([#1152](https://github.com/deephaven/deephaven-plugins/pull/1152)) - (e1a9971) - mattrunyon
- DH-18349: Keep ui.tabs mounted when not active ([#1177](https://github.com/deephaven/deephaven-plugins/pull/1177)) - (c3c15e0) - mattrunyon
- DH-18073: Static image creation for dx ([#1167](https://github.com/deephaven/deephaven-plugins/pull/1167)) - (650d496) - jnumainville

#### Bug Fixes

- DH-19705: Query restart broke ui.dashboards ([#1191](https://github.com/deephaven/deephaven-plugins/pull/1191)) - (c38b786) - mofojed
- DH-19696: Plotly objects were not loading correctly in deephaven.ui ([#1189](https://github.com/deephaven/deephaven-plugins/pull/1189)) - (e6af7dc) - mofojed

#### Documentation

- DOC-759: warnings when building deephaven UI docs ([#1182](https://github.com/deephaven/deephaven-plugins/pull/1182)) - (d1d7e00) - Germain Zhang-Houle
- Fix tutorial doc to not display error ([#1169](https://github.com/deephaven/deephaven-plugins/pull/1169)) - (766ec08) - mofojed
- Fix deephaven.ui code blocks that have errors ([#1166](https://github.com/deephaven/deephaven-plugins/pull/1166)) - (51be97d) - mofojed
- Apply miscellaneous fixes to deephaven.ui docs ([#1162](https://github.com/deephaven/deephaven-plugins/pull/1162)) - (01693d7) - arman-ddl
- Add ui component overview page, adjust sidebar ([#1161](https://github.com/deephaven/deephaven-plugins/pull/1161)) - (9ba7f2c) - dsmmcken
- escape hatches ([#1158](https://github.com/deephaven/deephaven-plugins/pull/1158)) - (4b40e2c) - dgodinez-dh
- size and theme ([#1156](https://github.com/deephaven/deephaven-plugins/pull/1156)) - (d564c2d) - dgodinez-dh

#### Build system

- Add snapshot generator ([#1183](https://github.com/deephaven/deephaven-plugins/pull/1183)) - (5b5ee61) - mofojed

- - -

## ui-v0.29.4 - 2025-06-27

#### Bug Fixes

- DH-18073: ui.image convert bytes to str ([#1199](https://github.com/deephaven/deephaven-plugins/pull/1199)) - (b6d3230) - mofojed

- - -

## ui-v0.29.3 - 2025-06-24

#### Bug Fixes

- DH-19705: Query restart broke ui.dashboards ([#1190](https://github.com/deephaven/deephaven-plugins/pull/1190)) - (c57be53) - mofojed
- DH-19696: Plotly objects were not loading correctly in deephaven… ([#1192](https://github.com/deephaven/deephaven-plugins/pull/1192)) - (a98604e) - mofojed

- - -

## ui-v0.29.2 - 2025-04-08

#### Bug Fixes

- remove incorrect defaults in ui.grid to fix auto ([#1154](https://github.com/deephaven/deephaven-plugins/pull/1154)) - (684e5fc) - dgodinez-dh

- - -

## ui-v0.29.1 - 2025-04-01

#### Bug Fixes

- Handle a null jsonClient correctly (DH-18461) ([#1138](https://github.com/deephaven/deephaven-plugins/pull/1138)) - (1852554) - mofojed
- Unwanted linebreaks in `tutorial.md` ([#1133](https://github.com/deephaven/deephaven-plugins/pull/1133)) - (63d6e66) - jnumainville

#### Documentation

- component doc for ui.grid ([#1148](https://github.com/deephaven/deephaven-plugins/pull/1148)) - (e6996c1) - dgodinez-dh
- Fixing docs links ([#1139](https://github.com/deephaven/deephaven-plugins/pull/1139)) - (328802e) - mattrunyon

#### Refactoring

- Remove fast-deep-equal from UITable ([#1140](https://github.com/deephaven/deephaven-plugins/pull/1140)) - (f1054ee) - mofojed

- - -

## ui-v0.29.0 - 2025-03-19

#### Features

- DH-18652 Programmatically display aggregates rows with ui.table ([#1131](https://github.com/deephaven/deephaven-plugins/pull/1131)) - (4437252) - mattrunyon
- List format options for ui.labeled_value ([#1137](https://github.com/deephaven/deephaven-plugins/pull/1137)) - (7d0915b) - Eric Lin
- dates and date formatting for ui.labeled_value ([#1128](https://github.com/deephaven/deephaven-plugins/pull/1128)) - (f1b896f) - Eric Lin

#### Bug Fixes

- Re-opening widget would break interactivity (DH-18090) ([#1143](https://github.com/deephaven/deephaven-plugins/pull/1143)) - (8f73a3d) - mofojed
- wrong date converter for day granularity ([#1132](https://github.com/deephaven/deephaven-plugins/pull/1132)) - (9d277ab) - dgodinez-dh

#### Documentation

- creating dashboards ([#1127](https://github.com/deephaven/deephaven-plugins/pull/1127)) - (73607fd) - dgodinez-dh
- layout overview ([#1120](https://github.com/deephaven/deephaven-plugins/pull/1120)) - (6f95184) - dgodinez-dh
- snapshots for components ([#1123](https://github.com/deephaven/deephaven-plugins/pull/1123)) - (a8c5303) - ethanalvizo

#### Build system

- Add custom sphinx translator to fix relative image paths in output ([#1136](https://github.com/deephaven/deephaven-plugins/pull/1136)) - (fa6615e) - mattrunyon

- - -

## ui-v0.28.1 - 2025-03-07

#### Bug Fixes

- ui.dialog should throw error for invalid children ([#1130](https://github.com/deephaven/deephaven-plugins/pull/1130)) - (66aec06) - dgodinez-dh

#### Documentation

- add missing api reference for ui.action_group ([#1124](https://github.com/deephaven/deephaven-plugins/pull/1124)) - (a04dee5) - dsmmcken
- update tables in state ([#1121](https://github.com/deephaven/deephaven-plugins/pull/1121)) - (3a0a682) - dgodinez-dh

- - -

## ui-v0.28.0 - 2025-03-03

#### Features

- color picker ([#1086](https://github.com/deephaven/deephaven-plugins/pull/1086)) - (9174c56) - ethanalvizo
- Document delta updates (DH-18090) ([#1119](https://github.com/deephaven/deephaven-plugins/pull/1119)) - (3ac3a22) - mofojed

- - -

## ui-v0.27.0 - 2025-02-26

#### Features

- UI table respond to non-primitive prop changes ([#1046](https://github.com/deephaven/deephaven-plugins/pull/1046)) - (024811d) - mattrunyon
- accordion ([#1075](https://github.com/deephaven/deephaven-plugins/pull/1075)) - (76b6195) - ethanalvizo

#### Bug Fixes

- Callable cleanup race (DH-18536) ([#1113](https://github.com/deephaven/deephaven-plugins/pull/1113)) - (34c0b60) - mofojed

#### Documentation

- preserving and resetting state ([#1118](https://github.com/deephaven/deephaven-plugins/pull/1118)) - (374a9e9) - dgodinez-dh
- share state between components ([#1116](https://github.com/deephaven/deephaven-plugins/pull/1116)) - (66fdee9) - dgodinez-dh
- choose the state structure ([#1114](https://github.com/deephaven/deephaven-plugins/pull/1114)) - (838741f) - dgodinez-dh
- update plotting ([#1101](https://github.com/deephaven/deephaven-plugins/pull/1101)) - (2c5ba66) - dgodinez-dh
- update lists in state ([#1097](https://github.com/deephaven/deephaven-plugins/pull/1097)) - (c45c5f5) - dgodinez-dh
- queueing a series of updates ([#1095](https://github.com/deephaven/deephaven-plugins/pull/1095)) - (d5dee4d) - dgodinez-dh
- react to input with state ([#1105](https://github.com/deephaven/deephaven-plugins/pull/1105)) - (11b2335) - dgodinez-dh
- add docs attribution statement, purge the readme content ([#1111](https://github.com/deephaven/deephaven-plugins/pull/1111)) - (98c9c27) - dsmmcken

- - -

## ui-v0.26.1 - 2025-02-06

#### Bug Fixes

- DH-18415: Cannot expand rows after applying rollup to ui.table ([#1109](https://github.com/deephaven/deephaven-plugins/pull/1109)) - (0d09ef4) - mattrunyon

- - -

## ui-v0.26.0 - 2025-02-06

#### Features

- disclosure ([#1068](https://github.com/deephaven/deephaven-plugins/pull/1068)) - (6934bf2) - ethanalvizo
- ui.footer ([#1100](https://github.com/deephaven/deephaven-plugins/pull/1100)) - (9b38e75) - Eric Lin
- ui.breadcrumbs ([#1094](https://github.com/deephaven/deephaven-plugins/pull/1094)) - (312af69) - Eric Lin
- ui.tag_group ([#1090](https://github.com/deephaven/deephaven-plugins/pull/1090)) - (05eb407) - Eric Lin
- ui.labeled_value ([#1029](https://github.com/deephaven/deephaven-plugins/pull/1029)) - (8f278a7) - Akshat Jawne
- ui.divider ([#1047](https://github.com/deephaven/deephaven-plugins/pull/1047)) - (0a1b861) - Akshat Jawne

#### Bug Fixes

- ui.markdown was styling code incorrectly ([#1106](https://github.com/deephaven/deephaven-plugins/pull/1106)) - (c84db85) - mofojed
- Make docs links passthrough ([#1085](https://github.com/deephaven/deephaven-plugins/pull/1085)) - (2ef0ddb) - jnumainville
- Ensure ReactPanelErrorBoundary handles undefined children ([#1089](https://github.com/deephaven/deephaven-plugins/pull/1089)) - (e622b83) - mofojed

#### Documentation

- update dictionaries in state ([#1096](https://github.com/deephaven/deephaven-plugins/pull/1096)) - (120ac06) - dgodinez-dh
- update work with tables ([#1098](https://github.com/deephaven/deephaven-plugins/pull/1098)) - (bd9d20d) - dgodinez-dh
- Fix menu_trigger snippet ([#1099](https://github.com/deephaven/deephaven-plugins/pull/1099)) - (3847a35) - vbabich
- state as a snapshot ([#1093](https://github.com/deephaven/deephaven-plugins/pull/1093)) - (2b4d8ea) - dgodinez-dh
- render cycle ([#1087](https://github.com/deephaven/deephaven-plugins/pull/1087)) - (fece0a7) - dgodinez-dh
- state a component's memory ([#1084](https://github.com/deephaven/deephaven-plugins/pull/1084)) - (bed23d8) - dgodinez-dh
- respond to events ([#1083](https://github.com/deephaven/deephaven-plugins/pull/1083)) - (17c6635) - dgodinez-dh
- deephaven.ui dashboard crash course ([#1057](https://github.com/deephaven/deephaven-plugins/pull/1057)) - (185b0dc) - jnumainville

- - -

## ui-v0.25.0 - 2025-01-15

#### Features

- ui.menu component ([#1076](https://github.com/deephaven/deephaven-plugins/pull/1076)) - (cf23da1) - dgodinez-dh
- ui.logic button ([#1050](https://github.com/deephaven/deephaven-plugins/pull/1050)) - (7c83ec2) - ethanalvizo
- add undefined type option ([#1026](https://github.com/deephaven/deephaven-plugins/pull/1026)) - (ef7e741) - Steven Wu

#### Bug Fixes

- add menu and menu_trigger to sidebar ([#1078](https://github.com/deephaven/deephaven-plugins/pull/1078)) - (49ad632) - dgodinez-dh
- Allow autodoc functions to have no parameters ([#1072](https://github.com/deephaven/deephaven-plugins/pull/1072)) - (6b261d6) - jnumainville
- label prop typing ([#1071](https://github.com/deephaven/deephaven-plugins/pull/1071)) - (716b3d9) - Steven Wu

#### Documentation

- use_render_queue, use_liveness_scope, use_table_listener docs ([#1044](https://github.com/deephaven/deephaven-plugins/pull/1044)) - (abd691e) - mofojed
- Expand sidebars by default for certain categories, add link to flexbox froggy ([#1073](https://github.com/deephaven/deephaven-plugins/pull/1073)) - (e76591d) - dsmmcken
- ui.list_view selection_mode ([#1070](https://github.com/deephaven/deephaven-plugins/pull/1070)) - (b51373f) - bmingles
- ui as a tree ([#1067](https://github.com/deephaven/deephaven-plugins/pull/1067)) - (2e1a725) - dgodinez-dh
- Render Lists ([#1061](https://github.com/deephaven/deephaven-plugins/pull/1061)) - (30a1f9f) - dgodinez-dh
- Pure Components ([#1064](https://github.com/deephaven/deephaven-plugins/pull/1064)) - (30f3730) - dgodinez-dh
- Using Hooks ([#1056](https://github.com/deephaven/deephaven-plugins/pull/1056)) - (28b5a51) - dgodinez-dh
- Component Rules ([#1055](https://github.com/deephaven/deephaven-plugins/pull/1055)) - (21e8c5d) - dgodinez-dh
- Update First Component ([#1065](https://github.com/deephaven/deephaven-plugins/pull/1065)) - (a6d1aad) - dgodinez-dh
- Conditional Rendering ([#1060](https://github.com/deephaven/deephaven-plugins/pull/1060)) - (0ce7634) - dgodinez-dh

- - -

## ui-v0.24.0 - 2024-12-12

#### Features

- ui.meter ([#1032](https://github.com/deephaven/deephaven-plugins/pull/1032)) - (6730aa9) - ethanalvizo
- ui.avatar ([#1027](https://github.com/deephaven/deephaven-plugins/pull/1027)) - (2738a1d) - Akshat Jawne
- Toast Implementation ([#1030](https://github.com/deephaven/deephaven-plugins/pull/1030)) - (e53b322) - dgodinez-dh

#### Bug Fixes

- UI loading duplicate panels in embed iframe ([#1043](https://github.com/deephaven/deephaven-plugins/pull/1043)) - (e1559a4) - mattrunyon

#### Documentation

- Working with Tables ([#1059](https://github.com/deephaven/deephaven-plugins/pull/1059)) - (6e73350) - dgodinez-dh
- Importing and Exporting Components ([#1054](https://github.com/deephaven/deephaven-plugins/pull/1054)) - (21b752c) - dgodinez-dh
- Your First Component ([#1052](https://github.com/deephaven/deephaven-plugins/pull/1052)) - (ce3843a) - dgodinez-dh
- Add Stack with tabs to dashboard docs ([#1048](https://github.com/deephaven/deephaven-plugins/pull/1048)) - (cf0c994) - mofojed

- - -

## ui-v0.23.3 - 2025-01-21

#### Bug Fixes

- Ensure ReactPanelErrorBoundary handles undefined children ([#1092](https://github.com/deephaven/deephaven-plugins/pull/1092)) - (2c31622) - mofojed

- - -

## ui-v0.23.2 - 2025-01-13

#### Bug Fixes

- UI loading duplicate panels in embed iframe ([#1082](https://github.com/deephaven/deephaven-plugins/pull/1082)) - (928ee35) - mofojed

- - -

## ui-v0.23.1 - 2024-11-22

- - -

## ui-v0.23.0 - 2024-11-22

#### Breaking Changes

- dashboard ([#814](https://github.com/deephaven/deephaven-plugins/pull/814)) - (4114ecc) - ethanalvizo
- contextual_help uses heading, content, footer props ([#945](https://github.com/deephaven/deephaven-plugins/pull/945)) - (d7bcc22) - Steven Wu

#### Features

- ui.search_field ([#999](https://github.com/deephaven/deephaven-plugins/pull/999)) - (063f39a) - ethanalvizo
- ui.inline_alert ([#1007](https://github.com/deephaven/deephaven-plugins/pull/1007)) - (cfd6410) - Akshat Jawne
- Show loading spinners immediately in ui ([#1023](https://github.com/deephaven/deephaven-plugins/pull/1023)) - (3748dac) - mattrunyon
- Show loading panel immediately for deephaven UI - (dcbfdab) - mattrunyon
- Column sources for ui.table formatting ([#1010](https://github.com/deephaven/deephaven-plugins/pull/1010)) - (c25f578) - mattrunyon
- Add column_display_names to ui.table ([#1008](https://github.com/deephaven/deephaven-plugins/pull/1008)) - (1343ec8) - mattrunyon
- ui.markdown component ([#987](https://github.com/deephaven/deephaven-plugins/pull/987)) - (7ec5060) - Steven Wu
- ui.badge  ([#973](https://github.com/deephaven/deephaven-plugins/pull/973)) - (55e8ce2) - Akshat Jawne
- ui.link ([#980](https://github.com/deephaven/deephaven-plugins/pull/980)) - (2f07d2e) - Akshat Jawne
- Add useConditionalCallback hook ([#993](https://github.com/deephaven/deephaven-plugins/pull/993)) - (512fab2) - mofojed
- UI table formatting ([#950](https://github.com/deephaven/deephaven-plugins/pull/950)) - (b9109e0) - mattrunyon
- UI Dialog and DialogTrigger Components ([#953](https://github.com/deephaven/deephaven-plugins/pull/953)) - (0fbae91) - dgodinez-dh
- Add standard style props to UI table ([#921](https://github.com/deephaven/deephaven-plugins/pull/921)) - (46f236e) - mattrunyon
- ui.markdown component ([#903](https://github.com/deephaven/deephaven-plugins/pull/903)) - (0d1eea8) - Steven Wu
- ui.checkbox_group ([#813](https://github.com/deephaven/deephaven-plugins/pull/813)) - (8901fad) - Akshat Jawne
- UI Component Range Calendar ([#930](https://github.com/deephaven/deephaven-plugins/pull/930)) - (fde198c) - dgodinez-dh
- ui.table always_fetch_columns ([#929](https://github.com/deephaven/deephaven-plugins/pull/929)) - (7f8c023) - mattrunyon
- ui.progress_bar and ui.progress_circle ([#892](https://github.com/deephaven/deephaven-plugins/pull/892)) - (1ea206e) - Steven Wu
- UI Calendar Component ([#918](https://github.com/deephaven/deephaven-plugins/pull/918)) - (90b27b1) - dgodinez-dh

#### Bug Fixes

- missing sidebar docs ([#1018](https://github.com/deephaven/deephaven-plugins/pull/1018)) - (00c2181) - ethanalvizo
- Re-running ui code initially rendering the old document ([#1017](https://github.com/deephaven/deephaven-plugins/pull/1017)) - (b3f5459) - mattrunyon
- Resize contextual help popup for widget error messages ([#995](https://github.com/deephaven/deephaven-plugins/pull/995)) - (3a74733) - mofojed
- to_camel_case fails on leading or trailing underscores ([#979](https://github.com/deephaven/deephaven-plugins/pull/979)) - (08ff89c) - mattrunyon
- slider input default value ([#959](https://github.com/deephaven/deephaven-plugins/pull/959)) - (3a448ea) - Steven Wu
- text input default value ([#958](https://github.com/deephaven/deephaven-plugins/pull/958)) - (0ac72be) - Steven Wu
- set necessity_indicator default to None ([#947](https://github.com/deephaven/deephaven-plugins/pull/947)) - (3b25024) - Steven Wu
- contextual_help uses heading, content, footer props ([#945](https://github.com/deephaven/deephaven-plugins/pull/945)) - (d7bcc22) - Steven Wu
- number field format options ([#827](https://github.com/deephaven/deephaven-plugins/pull/827)) - (317e80b) - ethanalvizo
- button group align ([#917](https://github.com/deephaven/deephaven-plugins/pull/917)) - (aac6593) - Steven Wu

#### Documentation

- Add docs for use_callback, use_ref, hooks overview page ([#1012](https://github.com/deephaven/deephaven-plugins/pull/1012)) - (701b004) - mofojed
- form ([#925](https://github.com/deephaven/deephaven-plugins/pull/925)) - (2eb5fab) - ethanalvizo
- Add architecture document ([#949](https://github.com/deephaven/deephaven-plugins/pull/949)) - (6ae6493) - mofojed
- ui.tabs ([#943](https://github.com/deephaven/deephaven-plugins/pull/943)) - (bbe18e3) - Akshat Jawne
- ui.contextual_help ([#974](https://github.com/deephaven/deephaven-plugins/pull/974)) - (e3c5540) - Akshat Jawne
- panel ([#964](https://github.com/deephaven/deephaven-plugins/pull/964)) - (1eecb75) - ethanalvizo
- fragment ([#962](https://github.com/deephaven/deephaven-plugins/pull/962)) - (954184c) - ethanalvizo
- flex ([#785](https://github.com/deephaven/deephaven-plugins/pull/785)) - (54337d1) - ethanalvizo
- ui.action_menu ([#928](https://github.com/deephaven/deephaven-plugins/pull/928)) - (992bd33) - Akshat Jawne
- update README.md ([#975](https://github.com/deephaven/deephaven-plugins/pull/975)) - (f7ee1a6) - margaretkennedy
- dashboard ([#814](https://github.com/deephaven/deephaven-plugins/pull/814)) - (4114ecc) - ethanalvizo
- number field ([#932](https://github.com/deephaven/deephaven-plugins/pull/932)) - (ada2acc) - ethanalvizo
- Mention Deephaven version where `server-ui` Docker image is mentioned ([#951](https://github.com/deephaven/deephaven-plugins/pull/951)) - (1fac6af) - JJ Brosnan
- Table formatting spec ([#889](https://github.com/deephaven/deephaven-plugins/pull/889)) - (f79224a) - mattrunyon
- list view ([#769](https://github.com/deephaven/deephaven-plugins/pull/769)) - (37cb5a7) - ethanalvizo
- ui.toggle_button ([#927](https://github.com/deephaven/deephaven-plugins/pull/927)) - (93ca388) - Akshat Jawne
- ui.button_group ([#910](https://github.com/deephaven/deephaven-plugins/pull/910)) - (0ccd557) - Akshat Jawne
- icon ([#774](https://github.com/deephaven/deephaven-plugins/pull/774)) - (afa4faf) - ethanalvizo
- ui.heading ([#908](https://github.com/deephaven/deephaven-plugins/pull/908)) - (863655b) - Akshat Jawne
- ui.text ([#907](https://github.com/deephaven/deephaven-plugins/pull/907)) - (68b6515) - Akshat Jawne
- ui.action_group ([#895](https://github.com/deephaven/deephaven-plugins/pull/895)) - (356d33a) - Akshat Jawne

#### Refactoring

- Separate remove_empty_keys and dict_to_camel_case behavior ([#971](https://github.com/deephaven/deephaven-plugins/pull/971)) - (6a99461) - mattrunyon

#### Revert

- "feat: ui.markdown component" ([#956](https://github.com/deephaven/deephaven-plugins/pull/956)) - (d8e9f2f) - Steven Wu

#### Tests

- default tox to 3.8 ([#972](https://github.com/deephaven/deephaven-plugins/pull/972)) - (103c1e7) - jnumainville

#### Build system

- Update required versions ([#1020](https://github.com/deephaven/deephaven-plugins/pull/1020)) - (cb28447) - mofojed

- - -

## ui-v0.22.0 - 2024-10-01

#### Breaking Changes

- allow overflow by default on ui.panel ([#896](https://github.com/deephaven/deephaven-plugins/pull/896)) - (df5b17c) - dsmmcken

#### Features

- Dataclass serialization support for deephaven UI ([#897](https://github.com/deephaven/deephaven-plugins/pull/897)) - (42315cf) - mattrunyon
- allow overflow by default on ui.panel ([#896](https://github.com/deephaven/deephaven-plugins/pull/896)) - (df5b17c) - dsmmcken
- Time Field UI Component ([#825](https://github.com/deephaven/deephaven-plugins/pull/825)) - (d76503b) - dgodinez-dh
- wrap contextual help if primitive ([#817](https://github.com/deephaven/deephaven-plugins/pull/817)) - (7e51073) - Steven Wu
- expose rollup group behaviour as dh.ui option for UI Table ([#738](https://github.com/deephaven/deephaven-plugins/pull/738)) - (1807862) - Akshat Jawne
- Date Field Implementation ([#804](https://github.com/deephaven/deephaven-plugins/pull/804)) - (9a72d2d) - dgodinez-dh
- DateRangePicker Implementation ([#780](https://github.com/deephaven/deephaven-plugins/pull/780)) - (088d623) - dgodinez-dh

#### Bug Fixes

- text_field events throw error ([#913](https://github.com/deephaven/deephaven-plugins/pull/913)) - (94206d8) - Steven Wu
- dynamically update panel title ([#906](https://github.com/deephaven/deephaven-plugins/pull/906)) - (894dbc0) - Steven Wu
- ui.radio value defaulting ([#818](https://github.com/deephaven/deephaven-plugins/pull/818)) - (5581ae4) - Akshat Jawne
- empty list view ([#828](https://github.com/deephaven/deephaven-plugins/pull/828)) - (ef82561) - Steven Wu
- allows keys to be set in props ([#810](https://github.com/deephaven/deephaven-plugins/pull/810)) - (ca06eea) - Steven Wu
- Correct type for generated JsPlugin ([#741](https://github.com/deephaven/deephaven-plugins/pull/741)) - (7da0ecc) - jnumainville
- add wrapper to toggle_button ([#821](https://github.com/deephaven/deephaven-plugins/pull/821)) - (fff1d6c) - Steven Wu
- set label_align default to None ([#820](https://github.com/deephaven/deephaven-plugins/pull/820)) - (0dcfe3a) - Steven Wu
- text_area on_key_down throws errors ([#798](https://github.com/deephaven/deephaven-plugins/pull/798)) - (86f4b3e) - Steven Wu
- icon type auto-generation and normalization ([#696](https://github.com/deephaven/deephaven-plugins/pull/696)) - (ef4bb29) - ethanalvizo

#### Documentation

- flex pydocs ([#912](https://github.com/deephaven/deephaven-plugins/pull/912)) - (5fb0ed5) - ethanalvizo
- use_memo docs ([#779](https://github.com/deephaven/deephaven-plugins/pull/779)) - (abf4b72) - mofojed
- ui.text_field ([#802](https://github.com/deephaven/deephaven-plugins/pull/802)) - (473e3e8) - Akshat Jawne
- ui.switch ([#793](https://github.com/deephaven/deephaven-plugins/pull/793)) - (c735682) - Akshat Jawne
- ui.table ([#776](https://github.com/deephaven/deephaven-plugins/pull/776)) - (cb089be) - mattrunyon
- fix image links in readme ([#800](https://github.com/deephaven/deephaven-plugins/pull/800)) - (ce48410) - dsmmcken
- Add use_effect docs ([#772](https://github.com/deephaven/deephaven-plugins/pull/772)) - (c077219) - mofojed
- update sidebar component casing ([#797](https://github.com/deephaven/deephaven-plugins/pull/797)) - (2558551) - dsmmcken

#### Refactoring

- rename label_alignment to label_align ([#799](https://github.com/deephaven/deephaven-plugins/pull/799)) - (e31ac51) - Steven Wu

#### Build system

- Upgrade to Vite 5 ([#899](https://github.com/deephaven/deephaven-plugins/pull/899)) - (e94b990) - mattrunyon

- - -

## ui-v0.21.0 - 2024-09-03

#### Features

- Allow validation_errors to be passed into ui.form ([#789](https://github.com/deephaven/deephaven-plugins/pull/789)) - (371a825) - mofojed
- UI Table databars ([#736](https://github.com/deephaven/deephaven-plugins/pull/736)) - (ada20a3) - mattrunyon

#### Bug Fixes

- Remove server startup from python tests ([#768](https://github.com/deephaven/deephaven-plugins/pull/768)) - (c6c2dd2) - jnumainville

#### Documentation

- fix unclosed html tag in markdown ([#791](https://github.com/deephaven/deephaven-plugins/pull/791)) - (fb7bd78) - dsmmcken
- Add missing components to sidebar ([#782](https://github.com/deephaven/deephaven-plugins/pull/782)) - (ae34f96) - mofojed
- action button ([#702](https://github.com/deephaven/deephaven-plugins/pull/702)) - (39d5c39) - ethanalvizo
- image ([#703](https://github.com/deephaven/deephaven-plugins/pull/703)) - (bc84ecb) - ethanalvizo

- - -

## ui-v0.20.0 - 2024-08-23

#### Features

- Javascript DatePicker Implementation ([#667](https://github.com/deephaven/deephaven-plugins/pull/667)) - (ff48512) - dgodinez-dh
- ui.image ([#670](https://github.com/deephaven/deephaven-plugins/pull/670)) - (874ba97) - ethanalvizo
- ui.text_area ([#652](https://github.com/deephaven/deephaven-plugins/pull/652)) - (5fb24bc) - Akshat Jawne

#### Bug Fixes

- use_effect behaviour ([#734](https://github.com/deephaven/deephaven-plugins/pull/734)) - (c091dac) - mofojed
- autodoc failures hotfix ([#748](https://github.com/deephaven/deephaven-plugins/pull/748)) - (dbcfef3) - Akshat Jawne
- Remove `replay_lock` in `use_table_listener` ([#749](https://github.com/deephaven/deephaven-plugins/pull/749)) - (acf35ec) - jnumainville
- Prevent pushing broken docs to main ([#719](https://github.com/deephaven/deephaven-plugins/pull/719)) - (86fb7aa) - jnumainville
- color type ([#647](https://github.com/deephaven/deephaven-plugins/pull/647)) - (0e4f193) - ethanalvizo

#### Documentation

- ui.slider ([#753](https://github.com/deephaven/deephaven-plugins/pull/753)) - (35b3068) - Akshat Jawne
- ui.radio_group ([#758](https://github.com/deephaven/deephaven-plugins/pull/758)) - (c9b682a) - Akshat Jawne
- ui.range_slider ([#755](https://github.com/deephaven/deephaven-plugins/pull/755)) - (ddf6597) - Akshat Jawne
- Add docs for deephaven.ui installation ([#725](https://github.com/deephaven/deephaven-plugins/pull/725)) - (753eb38) - mofojed
- ui.illustrated_message ([#739](https://github.com/deephaven/deephaven-plugins/pull/739)) - (04f0a9b) - Akshat Jawne
- Fix context menu example ([#743](https://github.com/deephaven/deephaven-plugins/pull/743)) - (efae3f3) - mattrunyon
- ui.checkbox ([#722](https://github.com/deephaven/deephaven-plugins/pull/722)) - (0cb525e) - Akshat Jawne
- ui.combo_box ([#718](https://github.com/deephaven/deephaven-plugins/pull/718)) - (563504c) - Akshat Jawne
- ui.picker ([#705](https://github.com/deephaven/deephaven-plugins/pull/705)) - (8d95ec7) - Akshat Jawne
- ui.view ([#723](https://github.com/deephaven/deephaven-plugins/pull/723)) - (55aa6cc) - Akshat Jawne
- ui.text_area ([#683](https://github.com/deephaven/deephaven-plugins/pull/683)) - (4df5ba3) - Akshat Jawne
- fix use_state sidebar docs links ([#712](https://github.com/deephaven/deephaven-plugins/pull/712)) - (32bd311) - dsmmcken
- Add docs for use_state hook ([#675](https://github.com/deephaven/deephaven-plugins/pull/675)) - (101af33) - mofojed
- Fix casing in the ui.table examples ([#691](https://github.com/deephaven/deephaven-plugins/pull/691)) - (8771122) - mofojed

- - -

## ui-v0.19.0 - 2024-07-29

#### Features

- UI.Table density prop ([#634](https://github.com/deephaven/deephaven-plugins/pull/634)) - (ec0794b) - mattrunyon

#### Bug Fixes

- deephaven.ui panels disappearing in some cases ([#682](https://github.com/deephaven/deephaven-plugins/pull/682)) - (c3997d1) - mofojed
- ErrorBoundary small styling changes ([#669](https://github.com/deephaven/deephaven-plugins/pull/669)) - (d2ec9ed) - Akshat Jawne
- Revert clearing the build/dist directories ([#680](https://github.com/deephaven/deephaven-plugins/pull/680)) - (b2f09bb) - jnumainville
- Plotly express widgets don't work in deephaven.ui ([#644](https://github.com/deephaven/deephaven-plugins/pull/644)) - (14555ab) - jnumainville
- invalid ui.panel usage should result in clear error ([#641](https://github.com/deephaven/deephaven-plugins/pull/641)) - (31b1f17) - Akshat Jawne

#### Documentation

- add sidebar to UI docs and adjust readme ([#633](https://github.com/deephaven/deephaven-plugins/pull/633)) - (e690c1b) - dsmmcken
- switch and text ([#639](https://github.com/deephaven/deephaven-plugins/pull/639)) - (b6ebab4) - ethanalvizo

#### Refactoring

- example dataset column names to PascalCase ([#666](https://github.com/deephaven/deephaven-plugins/pull/666)) - (def7069) - Alex Peters

#### Build system

- UI docs and add plugin_builder.py ([#630](https://github.com/deephaven/deephaven-plugins/pull/630)) - (7281eec) - jnumainville

- - -

## ui-v0.18.0 - 2024-07-17

#### Breaking Changes

- better deephaven ui button defaults ([#613](https://github.com/deephaven/deephaven-plugins/pull/613)) - (351f3a5) - dsmmcken

#### Features

- Add ui.table reverse prop ([#629](https://github.com/deephaven/deephaven-plugins/pull/629)) - (e56424c) - mattrunyon
- better deephaven ui button defaults ([#613](https://github.com/deephaven/deephaven-plugins/pull/613)) - (351f3a5) - dsmmcken
- delete unused ui.icon_wrapper ([#621](https://github.com/deephaven/deephaven-plugins/pull/621)) - (4b92021) - dsmmcken

#### Bug Fixes

- add default styling to tabs component ([#611](https://github.com/deephaven/deephaven-plugins/pull/611)) - (2b8ea23) - Akshat Jawne

#### Documentation

- form ([#602](https://github.com/deephaven/deephaven-plugins/pull/602)) - (7b8802d) - ethanalvizo
- picker ([#603](https://github.com/deephaven/deephaven-plugins/pull/603)) - (9942ab9) - ethanalvizo
- radio_group and radio ([#619](https://github.com/deephaven/deephaven-plugins/pull/619)) - (393aa17) - ethanalvizo
- tab_panels ([#624](https://github.com/deephaven/deephaven-plugins/pull/624)) - (e45c509) - Akshat Jawne
- ui.button doc page ([#615](https://github.com/deephaven/deephaven-plugins/pull/615)) - (0a3f710) - dsmmcken

#### Build system

- Clean the build directory before building the wheel ([#599](https://github.com/deephaven/deephaven-plugins/pull/599)) - (a2459bd) - mofojed

- - -

## ui-v0.17.0 - 2024-07-09

#### Breaking Changes

- make ui.panel flex align-items start by default ([#604](https://github.com/deephaven/deephaven-plugins/pull/604)) - (be97ad8) - dsmmcken
- Remove row and column indexes from table press handlers ([#592](https://github.com/deephaven/deephaven-plugins/pull/592)) - (05fc8f0) - mattrunyon

#### Features

- UI table layout hints ([#587](https://github.com/deephaven/deephaven-plugins/pull/587)) - (5e3c5e2) - mattrunyon
- UI ComboBox component ([#588](https://github.com/deephaven/deephaven-plugins/pull/588)) - (0564299) - bmingles
- make ui.panel flex align-items start by default ([#604](https://github.com/deephaven/deephaven-plugins/pull/604)) - (be97ad8) - dsmmcken
- UI Tabs Improvement ([#489](https://github.com/deephaven/deephaven-plugins/pull/489)) - (145493a) - Akshat Jawne
- Replace shortid with nanoid ([#591](https://github.com/deephaven/deephaven-plugins/pull/591)) - (ad8aad9) - Akshat Jawne
- ui.table context menu items ([#522](https://github.com/deephaven/deephaven-plugins/pull/522)) - (32d09e8) - mattrunyon

#### Bug Fixes

- Remove type imports from @react-types/shared ([#610](https://github.com/deephaven/deephaven-plugins/pull/610)) - (66dc4bf) - Akshat Jawne
- ui.table cell and row press event data can be wrong ([#593](https://github.com/deephaven/deephaven-plugins/pull/593)) - (c4a2fe7) - mattrunyon
- icons in illustrated message ([#575](https://github.com/deephaven/deephaven-plugins/pull/575)) - (1623ff5) - ethanalvizo
- remove Number type and replace with float/int ([#590](https://github.com/deephaven/deephaven-plugins/pull/590)) - (d0e24f4) - Akshat Jawne
- Don't render objects/children of panels if there's a widget error ([#585](https://github.com/deephaven/deephaven-plugins/pull/585)) - (bd8cca9) - mofojed
- Don't use a key for the ErrorBoundary in a Panel ([#574](https://github.com/deephaven/deephaven-plugins/pull/574)) - (4a25715) - mofojed
- Wrap the children of ReactPanel with an ErrorBoundary ([#565](https://github.com/deephaven/deephaven-plugins/pull/565)) - (8cbee84) - mofojed

#### Documentation

- icon ([#594](https://github.com/deephaven/deephaven-plugins/pull/594)) - (20fe042) - ethanalvizo
- item ([#531](https://github.com/deephaven/deephaven-plugins/pull/531)) - (21fe131) - ethanalvizo
- illustrated message ([#532](https://github.com/deephaven/deephaven-plugins/pull/532)) - (137c1ea) - ethanalvizo
- heading ([#553](https://github.com/deephaven/deephaven-plugins/pull/553)) - (00875f9) - ethanalvizo
- grid ([#552](https://github.com/deephaven/deephaven-plugins/pull/552)) - (5bf53e6) - ethanalvizo

#### Refactoring

- Remove row and column indexes from table press handlers ([#592](https://github.com/deephaven/deephaven-plugins/pull/592)) - (05fc8f0) - mattrunyon

#### Build system

- Update DHC packages to ^0.85.0 ([#605](https://github.com/deephaven/deephaven-plugins/pull/605)) - (df6786a) - bmingles

- - -

## ui-v0.16.1 - 2024-06-21

#### Bug Fixes

- Wrap the children of ReactPanel with an ErrorBoundary ([#569](https://github.com/deephaven/deephaven-plugins/pull/569)) - (dbebdd2) - mofojed

- - -

## ui-v0.16.0 - 2024-06-19

#### Features

- Return callables from callables in Deephaven UI ([#540](https://github.com/deephaven/deephaven-plugins/pull/540)) - (8322c2d) - mattrunyon
- Use `useWidget` hook to load widgets ([#502](https://github.com/deephaven/deephaven-plugins/pull/502)) - (d9d1e5e) - mofojed

#### Documentation

- view ([#506](https://github.com/deephaven/deephaven-plugins/pull/506)) - (e4b7137) - ethanalvizo

#### Refactoring

- Cleanup js mappings for ui components + utils ([#530](https://github.com/deephaven/deephaven-plugins/pull/530)) - (bbce797) - bmingles

#### Revert

- "revert: Revert some changes that are not compatible with v0.78 ([#551](https://github.com/deephaven/deephaven-plugins/pull/551)) - (3502f02) - mofojed

- - -

## ui-v0.15.4 - 2024-06-26

#### Bug Fixes

- Don't render objects/children of panels if there's a widget error ([#577](https://github.com/deephaven/deephaven-plugins/pull/577)) - (3a74dcc) - mofojed

- - -

## ui-v0.15.3 - 2024-06-24

#### Bug Fixes

- Don't use a key for the ErrorBoundary in a Panel ([#576](https://github.com/deephaven/deephaven-plugins/pull/576)) - (e7bfdec) - mofojed
- deephaven-plugin-ui is compatible with deephaven-core 0.33.5 ([#572](https://github.com/deephaven/deephaven-plugins/pull/572)) - (9b4611a) - mofojed

- - -

## ui-v0.15.2 - 2024-06-21

#### Bug Fixes

- Wrap the children of ReactPanel with an ErrorBoundary ([#569](https://github.com/deephaven/deephaven-plugins/pull/569)) - (dbebdd2) - mofojed

- - -

## ui-v0.15.1 - 2024-06-14

#### Features

- Use `useWidget` hook to load widgets ([#555](https://github.com/deephaven/deephaven-plugins/pull/555)) - (d70eea9) - mofojed

- - -

## ui-v0.15.0 - 2024-06-13

#### Features

- Make RadioGroup orientation prop case insensitive ([#536](https://github.com/deephaven/deephaven-plugins/pull/536)) - (9b0b498) - bmingles
- ui.checkbox, ui.button, ui.button_group, ui.radio, ui.radio_group, ui.icon ([#512](https://github.com/deephaven/deephaven-plugins/pull/512)) - (6b1dbeb) - bmingles
- Add show_search and show_quick_filters to ui.table ([#461](https://github.com/deephaven/deephaven-plugins/pull/461)) - (4923017) - mattrunyon
- ListView actions ([#448](https://github.com/deephaven/deephaven-plugins/pull/448)) - (ca65b69) - bmingles

#### Bug Fixes

- UI plotting doc typo ([#542](https://github.com/deephaven/deephaven-plugins/pull/542)) - (df6c9b9) - mattrunyon
- Clean up positioning and headers of components in DESIGN.md ([#518](https://github.com/deephaven/deephaven-plugins/pull/518)) - (5d4a131) - Akshat Jawne
- Don't send back undefined cell data ([#516](https://github.com/deephaven/deephaven-plugins/pull/516)) - (469eb1d) - mofojed
- ui.text_field value not changing with use_state ([#498](https://github.com/deephaven/deephaven-plugins/pull/498)) - (7d41072) - Akshat Jawne
- Reset state when new instance of widget created ([#486](https://github.com/deephaven/deephaven-plugins/pull/486)) - (df587a8) - mofojed
- fix use_callback hook ([#468](https://github.com/deephaven/deephaven-plugins/pull/468)) - (f267572) - jnumainville

#### Documentation

- add plotting sidebar and plotting docs edits ([#519](https://github.com/deephaven/deephaven-plugins/pull/519)) - (a9840cb) - dsmmcken
- number field ([#505](https://github.com/deephaven/deephaven-plugins/pull/505)) - (691d190) - ethanalvizo
- slider, range slider, checkbox, and content ([#439](https://github.com/deephaven/deephaven-plugins/pull/439)) - (9ba1a04) - ethanalvizo
- list_action_group ([#493](https://github.com/deephaven/deephaven-plugins/pull/493)) - (6732ad6) - Akshat Jawne
- list_action_menu ([#492](https://github.com/deephaven/deephaven-plugins/pull/492)) - (727d5f2) - Akshat Jawne
- action_group ([#485](https://github.com/deephaven/deephaven-plugins/pull/485)) - (ef115c9) - Akshat Jawne
- action_menu ([#490](https://github.com/deephaven/deephaven-plugins/pull/490)) - (071d645) - Akshat Jawne
- contextual_help ([#480](https://github.com/deephaven/deephaven-plugins/pull/480)) - (94ef543) - Akshat Jawne

#### Refactoring

- Cleanup component mappings and utils (python side) ([#523](https://github.com/deephaven/deephaven-plugins/pull/523)) - (195f334) - bmingles
- Refactored ui.tabs component design ([#504](https://github.com/deephaven/deephaven-plugins/pull/504)) - (f012eaa) - Akshat Jawne

#### Revert

- Revert some changes that are not compatible with v0.78 ([#550](https://github.com/deephaven/deephaven-plugins/pull/550)) - (27414e1) - mofojed

#### Build system

- Fix package-lock changes ([#472](https://github.com/deephaven/deephaven-plugins/pull/472)) - (39a883e) - mofojed

- - -

## ui-v0.14.0 - 2024-05-17

#### Breaking Changes

- Table data hooks allow None ([#463](https://github.com/deephaven/deephaven-plugins/pull/463)) - (910a57c) - jnumainville

#### Features

- Python combo box implementation ([#460](https://github.com/deephaven/deephaven-plugins/pull/460)) - (b87a5c6) - jnumainville
- Table data hooks allow None ([#463](https://github.com/deephaven/deephaven-plugins/pull/463)) - (910a57c) - jnumainville
- Implement python item_table_source ([#415](https://github.com/deephaven/deephaven-plugins/pull/415)) - (ce1a019) - jnumainville
- Display deephaven.ui widget errors in a panel so user can see them ([#436](https://github.com/deephaven/deephaven-plugins/pull/436)) - (b23b571) - mofojed
- ListView - ui plugins ([#408](https://github.com/deephaven/deephaven-plugins/pull/408)) - (ff7f769) - bmingles

#### Bug Fixes

- Do not expost combo_box or date_picker yet ([#464](https://github.com/deephaven/deephaven-plugins/pull/464)) - (cd63e20) - mofojed
- Exit on communication failure ([#429](https://github.com/deephaven/deephaven-plugins/pull/429)) - (0e96ef4) - jnumainville
- Memoize use_table_data listener ([#428](https://github.com/deephaven/deephaven-plugins/pull/428)) - (f342dad) - jnumainville

#### Documentation

- start plotting docs including one-click behaviour ([#431](https://github.com/deephaven/deephaven-plugins/pull/431)) - (b0574c2) - dsmmcken

#### Refactoring

- Updated spectrum imports to use dh components ([#424](https://github.com/deephaven/deephaven-plugins/pull/424)) - (db97c9a) - bmingles

#### Build system

- Update requirements to require a newer version of core ([#457](https://github.com/deephaven/deephaven-plugins/pull/457)) - (3e04cf2) - mofojed

- - -

## ui-v0.13.1 - 2024-04-22

#### Bug Fixes

- toggle_button was not passing through `on_change` ([#427](https://github.com/deephaven/deephaven-plugins/pull/427)) - (d452a00) - mofojed

- - -

## ui-v0.13.0 - 2024-04-18

#### Features

- python date picker implementation ([#409](https://github.com/deephaven/deephaven-plugins/pull/409)) - (5ed66a7) - jnumainville

#### Bug Fixes

- Fix conditional use_effect in use_table_listener ([#422](https://github.com/deephaven/deephaven-plugins/pull/422)) - (5f4f238) - jnumainville
- add on_change to toggle_button ([#426](https://github.com/deephaven/deephaven-plugins/pull/426)) - (6ead733) - jnumainville
- buttons not working due to extra prop ([#423](https://github.com/deephaven/deephaven-plugins/pull/423)) - (b10f67c) - dsmmcken

- - -

## ui-v0.12.0 - 2024-04-17

#### Features

- improve default dh.ui layouts ([#411](https://github.com/deephaven/deephaven-plugins/pull/411)) - (67f82e3) - dsmmcken
- Picker - format settings ([#394](https://github.com/deephaven/deephaven-plugins/pull/394)) - (f9a0e34) - bmingles

#### Documentation

- Combo box spec ([#392](https://github.com/deephaven/deephaven-plugins/pull/392)) - (da1076a) - jnumainville
- toggle button ([#402](https://github.com/deephaven/deephaven-plugins/pull/402)) - (702ad2a) - ethanalvizo
- date picker spec ([#388](https://github.com/deephaven/deephaven-plugins/pull/388)) - (e1a135d) - jnumainville

#### Tests

- bump ts, eslint and prettier configs ([#416](https://github.com/deephaven/deephaven-plugins/pull/416)) - (a4761cc) - dsmmcken

- - -

## ui-v0.11.0 - 2024-04-03

#### Features

- Picker table support ([#382](https://github.com/deephaven/deephaven-plugins/pull/382)) - (2f84c96) - bmingles
- Add Python list_view implementation  ([#359](https://github.com/deephaven/deephaven-plugins/pull/359)) - (f0b8759) - jnumainville
- only require typing_extension for python < 3.11 ([#397](https://github.com/deephaven/deephaven-plugins/pull/397)) - (e31dc6f) - devinrsmith
- sets the default flex gap to "size-100" ([#347](https://github.com/deephaven/deephaven-plugins/pull/347)) - (5898502) - dsmmcken

#### Bug Fixes

- Re-opening widgets after re-hydrated ([#379](https://github.com/deephaven/deephaven-plugins/pull/379)) - (42242a5) - mofojed
- Wrap primitive Item children in Text ([#370](https://github.com/deephaven/deephaven-plugins/pull/370)) - (c733932) - bmingles

#### Documentation

- Updating examples for consistency ([#378](https://github.com/deephaven/deephaven-plugins/pull/378)) - (6292b3a) - mofojed
- pydocs for ui.text_field ([#357](https://github.com/deephaven/deephaven-plugins/pull/357)) - (d795c8d) - ethanalvizo

- - -

## ui-v0.10.0 - 2024-03-15

#### Features

- Store server-side state for rehydration ([#338](https://github.com/deephaven/deephaven-plugins/pull/338)) - (bb28df3) - mofojed
- Package matplotlib and ui JS with wheel ([#343](https://github.com/deephaven/deephaven-plugins/pull/343)) - (7724e55) - jnumainville

#### Bug Fixes

- Tighten use_memo dependency types ([#356](https://github.com/deephaven/deephaven-plugins/pull/356)) - (48dea18) - jnumainville

#### Documentation

- list_view spec ([#352](https://github.com/deephaven/deephaven-plugins/pull/352)) - (bca3880) - jnumainville
- Fix the demo script ([#354](https://github.com/deephaven/deephaven-plugins/pull/354)) - (7e7302e) - mofojed

#### Build system

- Fix npm package update ([#361](https://github.com/deephaven/deephaven-plugins/pull/361)) - (cabbcab) - mofojed

- - -

## ui-v0.9.0 - 2024-03-08

#### Features

- Add ui.table press event listener support ([#346](https://github.com/deephaven/deephaven-plugins/pull/346)) - (b805683) - mofojed
- UI Picker JS ([#333](https://github.com/deephaven/deephaven-plugins/pull/333)) - (e3af9f5) - bmingles

#### Bug Fixes

- Tab Panels contents should take up the full height ([#340](https://github.com/deephaven/deephaven-plugins/pull/340)) - (6028195) - mofojed
- Remove tooltip prop ([#334](https://github.com/deephaven/deephaven-plugins/pull/334)) - (cbe2140) - jnumainville
- add missing dependencies params for liveness scope and table listener hooks ([#291](https://github.com/deephaven/deephaven-plugins/pull/291)) - (9d6b7de) - niloc132
- added missing picker imports ([#332](https://github.com/deephaven/deephaven-plugins/pull/332)) - (272cdf9) - jnumainville

#### Build system

- Update dh ui packages to ^0.66.1 ([#330](https://github.com/deephaven/deephaven-plugins/pull/330)) - (9433a98) - bmingles

- - -

## ui-v0.8.0 - 2024-02-28

#### Features

- Widget re-hydration ([#288](https://github.com/deephaven/deephaven-plugins/pull/288)) - (13bb5ea) - mofojed
- Add python picker ([#311](https://github.com/deephaven/deephaven-plugins/pull/311)) - (05d1c4a) - jnumainville

#### Bug Fixes

- Use correct formatting settings for ui.table ([#326](https://github.com/deephaven/deephaven-plugins/pull/326)) - (4762053) - mofojed
- Call listener when do_replay is True for use_table_listener_hook ([#313](https://github.com/deephaven/deephaven-plugins/pull/313)) - (86d2572) - jnumainville
- Type fixes and require pyright ([#302](https://github.com/deephaven/deephaven-plugins/pull/302)) - (d5d003d) - jnumainville
- Could not assign built-in Callables as callbacks ([#305](https://github.com/deephaven/deephaven-plugins/pull/305)) - (5334e4d) - mofojed

#### Documentation

- button_group ([#306](https://github.com/deephaven/deephaven-plugins/pull/306)) - (fee31f8) - ethanalvizo
- Picker spec ([#247](https://github.com/deephaven/deephaven-plugins/pull/247)) - (07f2cf5) - jnumainville
- Remove the warning about using the plugin at your own risk ([#303](https://github.com/deephaven/deephaven-plugins/pull/303)) - (e342341) - mofojed

#### Tests

- Bumping test listener timeout from 1 to 2 seconds ([#312](https://github.com/deephaven/deephaven-plugins/pull/312)) - (43ddf75) - jnumainville

- - -

## ui-v0.7.0 - 2024-02-21

#### Features

- Support column and row within a panel ([#272](https://github.com/deephaven/deephaven-plugins/pull/272)) - (0413443) - mattrunyon
- Support for dropping extra callback args ([#271](https://github.com/deephaven/deephaven-plugins/pull/271)) - (34ddfcd) - jnumainville
- Auto-wrap layout components when possible ([#249](https://github.com/deephaven/deephaven-plugins/pull/249)) - (d93dc9c) - mattrunyon

#### Bug Fixes

- Hooks accepting liveness objects and functions should manage their lifetime ([#258](https://github.com/deephaven/deephaven-plugins/pull/258)) - (8d2a945) - niloc132
- Initial set of type fixes ([#217](https://github.com/deephaven/deephaven-plugins/pull/217)) - (5c52488) - jnumainville
- Stock rollup example was not working ([#268](https://github.com/deephaven/deephaven-plugins/pull/268)) - (5d6205c) - mofojed
- Version bump + loading spinner fixes ([#243](https://github.com/deephaven/deephaven-plugins/pull/243)) - (aeb7796) - bmingles

#### Documentation

- More specs for ui.table functionality ([#198](https://github.com/deephaven/deephaven-plugins/pull/198)) - (8d4255c) - jnumainville
- button  ([#266](https://github.com/deephaven/deephaven-plugins/pull/266)) - (7ce4e75) - ethanalvizo

#### Refactoring

- Re-organize some code into subfolders ([#284](https://github.com/deephaven/deephaven-plugins/pull/284)) - (dbff1ab) - mofojed

- - -

## ui-v0.6.0 - 2024-02-05

#### Breaking Changes

- Serialize press events for press event callbacks ([#236](https://github.com/deephaven/deephaven-plugins/pull/236)) - (38b202f) - mofojed

#### Features

- **(ui)** Add error boundary to prevent UI crashing due to rendering errors ([#245](https://github.com/deephaven/deephaven-plugins/pull/245)) - (74d3007) - mattrunyon
- Add accessibility props to action_button ([#248](https://github.com/deephaven/deephaven-plugins/pull/248)) - (39cf7db) - mofojed
- Serialize press events for press event callbacks ([#236](https://github.com/deephaven/deephaven-plugins/pull/236)) - (38b202f) - mofojed
- Send all set hooks to render queue ([#246](https://github.com/deephaven/deephaven-plugins/pull/246)) - (f5cbb8f) - jnumainville

#### Bug Fixes

- **(ui)** Default placement of newly opened components is inconsistent ([#244](https://github.com/deephaven/deephaven-plugins/pull/244)) - (8b17e85) - mattrunyon
- Use ObjectFetcher to retrieve objects ([#234](https://github.com/deephaven/deephaven-plugins/pull/234)) - (728be7b) - mofojed
- Better render error handling ([#242](https://github.com/deephaven/deephaven-plugins/pull/242)) - (c312d43) - jnumainville
- use_execution_context does not return None ([#232](https://github.com/deephaven/deephaven-plugins/pull/232)) - (0d5c3ce) - niloc132

#### Documentation

- Add Dashboard examples ([#229](https://github.com/deephaven/deephaven-plugins/pull/229)) - (e7b94a9) - mofojed

- - -

## ui-v0.5.0 - 2024-01-26

#### Features

- UI dashboard ([#176](https://github.com/deephaven/deephaven-plugins/pull/176)) - (6adef9c) - mattrunyon
- use_execution_context hook ([#205](https://github.com/deephaven/deephaven-plugins/pull/205)) - (76cd7ab) - jnumainville
- Queue render state updates on a thread ([#182](https://github.com/deephaven/deephaven-plugins/pull/182)) - (79a1002) - mofojed
- Support lerna scopes in npm start ([#203](https://github.com/deephaven/deephaven-plugins/pull/203)) - (aab9591) - bmingles

#### Bug Fixes

- Use deferred API to get the API ([#226](https://github.com/deephaven/deephaven-plugins/pull/226)) - (b0e2162) - mofojed
- Move the renderer's LivenessScope into the context ([#222](https://github.com/deephaven/deephaven-plugins/pull/222)) - (672aa43) - niloc132
- ExecutionContext must be opened before running code on a thread ([#225](https://github.com/deephaven/deephaven-plugins/pull/225)) - (6508fd0) - niloc132

- - -

## ui-v0.1.0 - 2024-01-08

#### Breaking Changes

- Only send new exported objects ([#129](https://github.com/deephaven/deephaven-plugins/pull/129)) - (be85375) - mofojed

#### Features

- **(ui)** Only send new exported objects ([#129](https://github.com/deephaven/deephaven-plugins/pull/129)) - (be85375) - mofojed
- ui.table functionality ([#145](https://github.com/deephaven/deephaven-plugins/pull/145)) - (df04f29) - jnumainville
- Table hooks ([#168](https://github.com/deephaven/deephaven-plugins/pull/168)) - (54f152d) - jnumainville
- ui.fragment, ui.tabs, ui.tab_list, ui.tab_panels ([#138](https://github.com/deephaven/deephaven-plugins/pull/138)) - (cedcd3c) - mofojed
- Add ui.form, ui.number_field elements ([#142](https://github.com/deephaven/deephaven-plugins/pull/142)) - (b5d099d) - mofojed
- add use_table_listener hook ([#115](https://github.com/deephaven/deephaven-plugins/pull/115)) - (bbb0a65) - jnumainville
- Load widgets from plugin context ([#114](https://github.com/deephaven/deephaven-plugins/pull/114)) - (6c1fec8) - mattrunyon
- Add `ui.range_slider` and `ui.button` components basic functionality ([#122](https://github.com/deephaven/deephaven-plugins/pull/122)) - (76fe7b8) - mofojed
- ui.panel and ui.table initial support implementation ([#88](https://github.com/deephaven/deephaven-plugins/pull/88)) - (8ac2192) - mofojed
- Wrap UI components in their own liveness scopes ([#103](https://github.com/deephaven/deephaven-plugins/pull/103)) - (46a77f0) - mattrunyon
- First pass of ui.table functionality ([#95](https://github.com/deephaven/deephaven-plugins/pull/95)) - (09136a5) - mofojed
- deephaven.ui plugin prototype initial checkin ([#47](https://github.com/deephaven/deephaven-plugins/pull/47)) - (f753470) - mofojed

#### Bug Fixes

- **(ui)** Wrap renderer in liveness scope instead of function element ([#125](https://github.com/deephaven/deephaven-plugins/pull/125)) - (c0fb504) - mattrunyon
- Don't use the API in the DashboardPlugin ([#190](https://github.com/deephaven/deephaven-plugins/pull/190)) - (3208d19) - mofojed
- Close panels when object is nulled out ([#170](https://github.com/deephaven/deephaven-plugins/pull/170)) - (48dcca3) - mofojed

#### Documentation

- added `description` on ui.dashboard ([#146](https://github.com/deephaven/deephaven-plugins/pull/146)) - (229280d) - dsmmcken
- use_viewport_data hook spec ([#118](https://github.com/deephaven/deephaven-plugins/pull/118)) - (0f6bf62) - jnumainville
- Add the ui.dashboard spec ([#110](https://github.com/deephaven/deephaven-plugins/pull/110)) - (9acb671) - mofojed
- Spec for use_table_listener ([#106](https://github.com/deephaven/deephaven-plugins/pull/106)) - (0c0cf41) - jnumainville
- Add the `ui.table` spec ([#82](https://github.com/deephaven/deephaven-plugins/pull/82)) - (f885ea0) - mofojed
- ui.panel spec ([#91](https://github.com/deephaven/deephaven-plugins/pull/91)) - (fa23ede) - mofojed

#### Build system

- Version bump deephaven-plugin-ui to 0.1.0 ([#195](https://github.com/deephaven/deephaven-plugins/pull/195)) - (7065be9) - mofojed
- Version bump ui to 0.0.1.dev2 ([#135](https://github.com/deephaven/deephaven-plugins/pull/135)) - (c5848e0) - mofojed

- - -

