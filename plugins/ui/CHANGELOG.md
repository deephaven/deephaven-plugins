# Changelog
All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

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