# 360Vision: turning panoramas into connected property tours

A local authoring workspace, an immersive viewer, and a product film built
from the working application.

<!-- Upload images/blog-cover.png as the cover. This comment is not article copy. -->

A panorama shows a room. A property tour needs to connect rooms, give people
context, and make the next step easy to understand.

I've been building 360Vision around that idea. It is a local studio for
interactive real-estate tours, combining panorama scenes, hotspots, and optional
multi-floor plans.

## A viewer that keeps the property in focus

The viewer puts the panorama first. A compact room strip and a separate map
panel provide complementary ways to move through a property. Scene hotspots,
room buttons, and map points connect the experience.

The Cedar House demo contains three spaces and a ground-floor plan. The
recorded navigation shows the room and current map point changing together.

<!-- Upload gifs/tour-navigation.gif here. Alt: Recorded room and map navigation in the Cedar House demo. -->

## A practical authoring workflow

Studio lets the owner add panoramas, set the opening view, and place hotspots
for scene transitions, information, text, links, and media. Floor plans are
optional and can be organized into multiple floors.

The interface keeps Edit/View on one toolbar row and saving actions on another.
Shared action components provide consistent buttons, including floor selectors.

<!-- Upload gifs/studio-overview.gif here. Alt: Panorama exploration, map navigation, and the 360Vision authoring Studio. -->

## Simple ownership, explicit data

The project runs locally for one owner. There are no accounts or publication
states. Tours autosave as readable JSON, and uploaded images stay on the same
machine. Atomic writes protect the save operation from partial-file updates.

The stack uses Next.js, React, TypeScript, Three.js, Photo Sphere Viewer,
Sharp, and Zod. Panorama coordinates are yaw/pitch angles; map coordinates
are percentages, so the two navigation systems do not depend on screen pixels.

JSON export is useful, but it does not bundle media. A complete backup includes
the JSON files and uploaded assets. Complete media-package import/export,
scene reordering, and wider accessibility coverage are still on the roadmap.

## Showing the product in motion

For the visual campaign, I recorded the working demo and captured the app at
desktop and mobile widths. A repeatable rendering workflow adds moving titles,
floating product windows, and gentle transitions, then exports MP4 and GIF.

The lifestyle and hardware photographs are AI-generated campaign illustrations.
The feature demonstrations use real application captures. Portrait feature
cards use an app-store-inspired composition for the current web product.

[Source code](https://github.com/sanfor2004/360vesion)

[My portfolio](https://sanfor2004.github.io)
