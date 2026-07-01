## Daily Preview Calendar 1.0.8

- Fix desktop hover preview stopping after the first show (pointer-through popover, hover recheck after dismiss).
- Narrow layout-change dismiss to when the calendar tab is no longer active.
- Requires Obsidian 1.13.0+.

## Daily Preview Calendar 1.0.7

- Same fixes as 1.0.8 for Obsidian 1.7.2 through 1.12.x.

## Daily Preview Calendar 1.0.6

- Fix hover preview on Windows PCs with touch screens (use pointer type instead of coarse-pointer media query).
- Mobile: long-press shows float preview only; context menu removed on touch devices.
- Mobile float preview includes open-note actions (labels follow UI language).
- Requires Obsidian 1.13.0+ (`getSettingDefinitions` settings API).

## Daily Preview Calendar 1.0.5

- Same fixes as 1.0.6 for Obsidian 1.7.2 through 1.12.x.

## Daily Preview Calendar 1.0.4

- Same mobile touch fixes as 1.0.3.
- Requires Obsidian 1.13.0+ (`getSettingDefinitions` settings API).

## Daily Preview Calendar 1.0.3

- Fix mobile long-press preview: dismiss on tap outside, navigation, and scroll.
- Improve tap vs long-press handling (movement threshold, longer press duration).
- Fix sticky cell highlight on touch devices.
- For Obsidian 1.7.2 through 1.12.x.

## Daily Preview Calendar 1.0.2

- Migrate settings tab to declarative `getSettingDefinitions()` API (Obsidian 1.13+).
- Requires Obsidian 1.13.0 or later.

## Daily Preview Calendar 1.0.1

- Pass Obsidian Community automated review (lint and release notes).

## Daily Preview Calendar 1.0.0

Initial public release.

- Week and month calendar views for Daily Notes.
- Markdown previews in each day cell (inline and block formatting).
- Section filters, keyword highlights, font settings, and hover/long-press preview.
- Japanese and English UI.
