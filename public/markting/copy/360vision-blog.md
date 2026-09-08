---
title: "360Vision: turning panoramas into connected property tours"
description: "A look at the local tour studio, interactive floor plans, panorama viewer, and the workflow behind its product film."
pubDate: 2026-09-08
category: "Projects"
tags: ["Next.js", "TypeScript", "Three.js", "360Vision", "Build in Public"]
draft: true
---

![360Vision — Every space. A new perspective.](/markting/images/blog-cover.png)

A panorama lets you look around a room. A tour needs to explain how that room
connects to the rest of a property. That is the idea behind 360Vision, the
local real-estate tour studio I've been building.

The project brings panorama scenes, hotspots, and optional floor plans into a
single authoring workflow. It runs locally, and each tour is stored as a
human-readable JSON file.

## From one room to a connected experience

![Real recorded panorama exploration and property-map navigation](/markting/gifs/tour-navigation.gif)

The viewer keeps the panorama central. A compact room strip lets the viewer
choose a space, while a separate floor-plan panel shows their current location.
Room buttons, map points, and scene hotspots all provide ways to navigate.

Maps are optional. A property can also contain multiple floors, each with its
own plan and navigation points. The Cedar House sample shown here has three
spaces on one floor.

## The authoring workspace

![Tour exploration, map navigation, and the authoring Studio](/markting/gifs/studio-overview.gif)

In Studio, the owner adds 2:1 equirectangular panoramas, sets the opening camera
view, and places hotspots. Hotspots can connect scenes or present information,
text, links, and media. A two-row toolbar keeps Edit/View and saving actions
visible, and shared action components keep ordinary buttons consistent.

Panorama positions use angular yaw and pitch. Floor-plan points use percentages.
That distinction lets each kind of interaction remain independent of the
current screen size.

## Why the project is local

360Vision is a single-owner tool. The dashboard is a My work area, and the app
does not need accounts, visibility states, or a publication workflow. Autosave
persists changes through the local API, with atomic JSON writes behind it.

The stack combines Next.js, React, strict TypeScript, Three.js, Photo Sphere
Viewer, Sharp, and Zod. JSON download is available, but a complete backup must
include both the tour JSON and its uploaded images. Media-package import/export
is still future work.

## Giving the working product a visual story

<video controls playsinline preload="metadata" poster="/markting/images/hero.webp" style="width:100%;border-radius:16px">
  <source src="/markting/video/360vision-wide.mp4" type="video/mp4" />
  <a href="/markting/video/360vision-wide.mp4">Watch the 360Vision product film.</a>
</video>

The campaign uses actual desktop and mobile captures and recorded panorama
navigation, framed with motion typography and restrained cyan/orange lighting.
The lifestyle and laptop studio photographs are AI-generated illustrations.
The portrait feature cards borrow the composition of app-store campaigns while
describing the current web application.

The production loop is repeatable: capture the working demo, compose the
layouts, inspect the exports, correct readability problems, and render the
videos and GIFs. Temporary frames and diagnostics stay outside the final assets.

Next, I want to improve complete media-package portability, scene ordering,
and accessibility coverage while keeping the local authoring workflow simple.

[Explore the source on GitHub](https://github.com/sanfor2004/360vesion).
