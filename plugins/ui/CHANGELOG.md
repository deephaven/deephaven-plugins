# Changelog
All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

- - -
## ui-v0.19.0 - 2024-07-29
#### Bug Fixes
- deephaven.ui panels disappearing in some cases (#682) - (c3997d1) - mofojed
- ErrorBoundary small styling changes (#669) - (d2ec9ed) - Akshat Jawne
- Revert clearing the build/dist directories (#680) - (b2f09bb) - Joe
- Plotly express widgets don't work in deephaven.ui (#644) - (14555ab) - Joe
- invalid ui.panel usage should result in clear error (#641) - (31b1f17) - Akshat Jawne
#### Build system
- UI docs and add plugin_builder.py (#630) - (7281eec) - Joe
#### Documentation
- add sidebar to UI docs and adjust readme (#633) - (e690c1b) - Don
- switch and text (#639) - (b6ebab4) - ethanalvizo
#### Features
- UI.Table density prop (#634) - (ec0794b) - Matthew Runyon
#### Refactoring
- example dataset column names to PascalCase (#666) - (def7069) - Alex Peters

- - -

## ui-v0.18.0 - 2024-07-17
#### Bug Fixes
- add default styling to tabs component (#611) - (2b8ea23) - Akshat Jawne
#### Build system
- Clean the build directory before building the wheel (#599) - (a2459bd) - mofojed
#### Documentation
- form (#602) - (7b8802d) - ethanalvizo
- picker (#603) - (9942ab9) - ethanalvizo
- radio_group and radio (#619) - (393aa17) - ethanalvizo
- tab_panels (#624) - (e45c509) - Akshat Jawne
- ui.button doc page (#615) - (0a3f710) - Don
#### Features
- Add ui.table reverse prop (#629) - (e56424c) - Matthew Runyon
- better deephaven ui button defaults (#613) - (351f3a5) - Don
- delete unused ui.icon_wrapper (#621) - (4b92021) - Don

- - -

## ui-v0.17.0 - 2024-07-09
#### Bug Fixes
- Remove type imports from @react-types/shared (#610) - (66dc4bf) - Akshat Jawne
- ui.table cell and row press event data can be wrong (#593) - (c4a2fe7) - Matthew Runyon
- icons in illustrated message (#575) - (1623ff5) - ethanalvizo
- remove Number type and replace with float/int (#590) - (d0e24f4) - Akshat Jawne
- Don't render objects/children of panels if there's a widget error (#577) (#585) - (bd8cca9) - mofojed
- Don't use a key for the ErrorBoundary in a Panel (#574) - (4a25715) - mofojed
- Wrap the children of ReactPanel with an ErrorBoundary (#565) - (8cbee84) - mofojed
#### Build system
- Update DHC packages to ^0.85.0 (#605) - (df6786a) - bmingles
#### Documentation
- icon (#594) - (20fe042) - ethanalvizo
- item (#531) - (21fe131) - ethanalvizo
- illustrated message (#532) - (137c1ea) - ethanalvizo
- heading (#553) - (00875f9) - ethanalvizo
- grid (#552) - (5bf53e6) - ethanalvizo
#### Features
- UI table layout hints (#587) - (5e3c5e2) - Matthew Runyon
- UI ComboBox component (#588) - (0564299) - bmingles
- make ui.panel flex align-items start by default (#604) - (be97ad8) - Don
- UI Tabs Improvement (#489) - (145493a) - Akshat Jawne
- Replace shortid with nanoid (#591) - (ad8aad9) - Akshat Jawne
- ui.table context menu items (#522) - (32d09e8) - Matthew Runyon
#### Refactoring
- Remove row and column indexes from table press handlers (#592) - (05fc8f0) - Matthew Runyon

- - -

## ui-v0.16.0 - 2024-07-09
#### Documentation
- view (#506) - (e4b7137) - ethanalvizo
#### Features
- Return callables from callables in Deephaven UI (#540) - (8322c2d) - Matthew Runyon
- Use `useWidget` hook to load widgets (#502) - (d9d1e5e) - mofojed
#### Refactoring
- Cleanup js mappings for ui components + utils (#530) - (bbce797) - bmingles
#### Revert
- "revert: Revert some changes that are not compatible with v0.78 (#550)" (#551) - (3502f02) - mofojed

- - -

## ui-v0.16.0 - 2024-06-19
#### Documentation
- view (#506) - (e4b7137) - ethanalvizo
#### Features
- Return callables from callables in Deephaven UI (#540) - (8322c2d) - Matthew Runyon
- Use `useWidget` hook to load widgets (#502) - (d9d1e5e) - mofojed
#### Refactoring
- Cleanup js mappings for ui components + utils (#530) - (bbce797) - bmingles
#### Revert
- "revert: Revert some changes that are not compatible with v0.78 (#550)" (#551) - (3502f02) - mofojed

- - -

## ui-v0.15.0 - 2024-06-13
#### Bug Fixes
- UI plotting doc typo (#542) - (df6c9b9) - Matthew Runyon
- Clean up positioning and headers of components in DESIGN.md (#518) - (5d4a131) - Akshat Jawne
- Don't send back undefined cell data (#516) - (469eb1d) - mofojed
- ui.text_field value not changing with use_state (#498) - (7d41072) - Akshat Jawne
- Reset state when new instance of widget created (#486) - (df587a8) - mofojed
- fix use_callback hook (#468) - (f267572) - Joe
#### Build system
- Fix package-lock changes (#472) - (39a883e) - mofojed
#### Documentation
- add plotting sidebar and plotting docs edits (#519) - (a9840cb) - Don
- number field (#505) - (691d190) - ethanalvizo
- slider, range slider, checkbox, and content (#439) - (9ba1a04) - ethanalvizo
- list_action_group (#493) - (6732ad6) - Akshat Jawne
- list_action_menu (#492) - (727d5f2) - Akshat Jawne
- action_group (#485) - (ef115c9) - Akshat Jawne
- action_menu (#490) - (071d645) - Akshat Jawne
- contextual_help (#480) - (94ef543) - Akshat Jawne
#### Features
- Make RadioGroup orientation prop case insensitive (#536) - (9b0b498) - bmingles
- ui.checkbox, ui.button, ui.button_group, ui.radio, ui.radio_group, ui.icon (#512) - (6b1dbeb) - bmingles
- Add show_search and show_quick_filters to ui.table (#461) - (4923017) - Matthew Runyon
- ListView actions (#448) - (ca65b69) - bmingles
#### Refactoring
- Cleanup component mappings and utils (python side) (#523) - (195f334) - bmingles
- Refactored ui.tabs component design (#504) - (f012eaa) - Akshat Jawne
#### Revert
- Revert some changes that are not compatible with v0.78 (#550) - (27414e1) - mofojed

- - -

## ui-v0.14.0 - 2024-05-17
#### Bug Fixes
- Do not expost combo_box or date_picker yet (#464) - (cd63e20) - mofojed
- Exit on communication failure (#429) - (0e96ef4) - Joe
- Memoize use_table_data listener (#428) - (f342dad) - Joe
#### Build system
- Update requirements to require a newer version of core (#457) - (3e04cf2) - mofojed
#### Documentation
- start plotting docs including one-click behaviour (#431) - (b0574c2) - Don
#### Features
- Python combo box implementation (#460) - (b87a5c6) - Joe
- Table data hooks allow None (#463) - (910a57c) - Joe
- Implement python item_table_source (#415) - (ce1a019) - Joe
- Display deephaven.ui widget errors in a panel so user can see them (#436) - (b23b571) - mofojed
- ListView - ui plugins (#408) - (ff7f769) - bmingles
#### Refactoring
- Updated spectrum imports to use dh components (#424) - (db97c9a) - bmingles

- - -

## ui-v0.13.1 - 2024-04-22
#### Bug Fixes
- toggle_button was not passing through `on_change` (#427) - (d452a00) - mofojed

- - -

## ui-v0.13.0 - 2024-04-18
#### Bug Fixes
- Fix conditional use_effect in use_table_listener (#422) - (5f4f238) - Joe
- add on_change to toggle_button (#426) - (6ead733) - Joe
- buttons not working due to extra prop (#423) - (b10f67c) - Don
#### Features
- python date picker implementation (#409) - (5ed66a7) - Joe

- - -

## ui-v0.12.0 - 2024-04-17
#### Documentation
- Combo box spec (#392) - (da1076a) - Joe
- toggle button (#402) - (702ad2a) - ethanalvizo
- date picker spec (#388) - (e1a135d) - Joe
#### Features
- improve default dh.ui layouts (#411) - (67f82e3) - Don
- Picker - format settings (#394) - (f9a0e34) - bmingles
#### Tests
- bump ts, eslint and prettier configs (#416) - (a4761cc) - Don

- - -

## ui-v0.11.0 - 2024-04-03
#### Bug Fixes
- Re-opening widgets after re-hydrated (#379) - (42242a5) - mofojed
- Wrap primitive Item children in Text (#370) - (c733932) - bmingles
#### Documentation
- Updating examples for consistency (#378) - (6292b3a) - mofojed
- pydocs for ui.text_field (#357) - (d795c8d) - ethanalvizo
#### Features
- Picker table support (#382) - (2f84c96) - bmingles
- Add Python list_view implementation  (#359) - (f0b8759) - Joe
- only require typing_extension for python < 3.11 (#397) - (e31dc6f) - devinrsmith
- sets the default flex gap to "size-100" (#347) - (5898502) - Don

- - -

## ui-v0.10.0 - 2024-03-15
#### Bug Fixes
- Tighten use_memo dependency types (#356) - (48dea18) - Joe
#### Build system
- Fix npm package update (#361) - (cabbcab) - mofojed
#### Documentation
- list_view spec (#352) - (bca3880) - Joe
- Fix the demo script (#354) - (7e7302e) - mofojed
#### Features
- Store server-side state for rehydration (#338) - (bb28df3) - mofojed
- Package matplotlib and ui JS with wheel (#343) - (7724e55) - Joe

- - -

## ui-v0.9.0 - 2024-03-09
#### Bug Fixes
- Tab Panels contents should take up the full height (#340) - (6028195) - mofojed
- Remove tooltip prop (#334) - (cbe2140) - Joe
- add missing dependencies params for liveness scope and table listener hooks (#291) - (9d6b7de) - niloc132
- added missing picker imports (#332) - (272cdf9) - Joe
#### Build system
- Update dh ui packages to ^0.66.1 (#330) - (9433a98) - bmingles
#### Features
- Add ui.table press event listener support (#346) - (b805683) - mofojed
- UI Picker JS (#333) - (e3af9f5) - bmingles

- - -

## ui-v0.8.0 - 2024-02-28
#### Bug Fixes
- Use correct formatting settings for ui.table (#326) - (4762053) - mofojed
- Call listener when do_replay is True for use_table_listener_hook (#313) - (86d2572) - Joe
- Type fixes and require pyright (#302) - (d5d003d) - Joe
- Could not assign built-in Callables as callbacks (#305) - (5334e4d) - mofojed
#### Documentation
- button_group (#306) - (fee31f8) - ethanalvizo
- Picker spec (#247) - (07f2cf5) - Joe
- Remove the warning about using the plugin at your own risk (#303) - (e342341) - mofojed
#### Features
- Widget re-hydration (#288) - (13bb5ea) - mofojed
- Add python picker (#311) - (05d1c4a) - Joe
#### Tests
- Bumping test listener timeout from 1 to 2 seconds (#312) - (43ddf75) - Joe

- - -

## ui-v0.7.0 - 2024-02-21
#### Bug Fixes
- Hooks accepting liveness objects and functions should manage their lifetime (#258) - (8d2a945) - niloc132
- Initial set of type fixes (#217) - (5c52488) - Joe
- Stock rollup example was not working (#268) - (5d6205c) - mofojed
- Version bump + loading spinner fixes (#243) - (aeb7796) - bmingles
#### Documentation
- More specs for ui.table functionality (#198) - (8d4255c) - Joe
- button  (#266) - (7ce4e75) - ethanalvizo
#### Features
- Support column and row within a panel (#272) - (0413443) - Matthew Runyon
- Support for dropping extra callback args (#271) - (34ddfcd) - Joe
- Auto-wrap layout components when possible (#249) - (d93dc9c) - Matthew Runyon
#### Refactoring
- Re-organize some code into subfolders (#284) - (dbff1ab) - mofojed

- - -

## ui-v0.6.0 - 2024-02-05
#### Bug Fixes
- **(ui)** Default placement of newly opened components is inconsistent (#244) - (8b17e85) - Matthew Runyon
- Use ObjectFetcher to retrieve objects (#234) - (728be7b) - mofojed
- Better render error handling (#242) - (c312d43) - Joe
- use_execution_context does not return None (#232) - (0d5c3ce) - niloc132
#### Documentation
- Add Dashboard examples (#229) - (e7b94a9) - mofojed
#### Features
- **(ui)** Add error boundary to prevent UI crashing due to rendering errors (#245) - (74d3007) - Matthew Runyon
- Add accessibility props to action_button (#248) - (39cf7db) - mofojed
- Serialize press events for press event callbacks (#236) - (38b202f) - mofojed
- Send all set hooks to render queue (#246) - (f5cbb8f) - Joe

- - -

## ui-v0.5.0 - 2024-01-26
#### Bug Fixes
- Use deferred API to get the API (#226) - (b0e2162) - mofojed
- Move the renderer's LivenessScope into the context (#222) - (672aa43) - niloc132
- ExecutionContext must be opened before running code on a thread (#225) - (6508fd0) - niloc132
#### Features
- UI dashboard (#176) - (6adef9c) - Matthew Runyon
- use_execution_context hook (#205) - (76cd7ab) - Joe

- - -

Changelog generated by [cocogitto](https://github.com/cocogitto/cocogitto).