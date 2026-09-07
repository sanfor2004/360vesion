# Product Brief

## Product

360Vision is a local, single-owner studio for creating interactive 360° real-estate tours. A property owner or marketing team can upload panoramas, connect rooms, annotate views, attach an optional architectural floor plan, and preview the visitor experience without creating an account.

## Problem

Standard property galleries do not communicate spatial relationships well. Buyers need to understand both what a room looks like and where it sits inside the property. Existing virtual-tour tools can also be too complex, cloud-dependent, or expensive for a small local workflow.

## Primary users

- Real-estate photographers preparing client tours.
- Agents and brokers marketing homes, villas, apartments, and duplexes.
- Property owners assembling a self-managed tour.
- Internal teams reviewing tour content before publication.

## Core experience

### My work

- Open the local dashboard without login or signup.
- Create, view, edit, share, and delete local tours.
- See tour status, scene count, hotspot count, cover image, and views.

### Studio

- Upload 2:1 equirectangular panorama images.
- Add, rename, reorder, and remove scenes.
- Set the starting scene and starting camera direction.
- Place information, media, link, text, and scene-navigation hotspots.
- Enable or disable the property map.
- Create multiple floors and upload a plan for each floor.
- Assign scenes to floors and place their points by clicking the plan.
- Save changes automatically to SQLite.
- Keep the Edit/View toolbar fixed while the complete right-side authoring inspector scrolls as one screen-height panel. Expanded sections must use their natural height and never create competing nested scroll areas.

### Viewer

- Drag or use device motion to explore a panorama.
- Navigate through panorama hotspots, room thumbnails, or map points.
- Show the active room as the current location.
- Switch between property floors.
- Hide the map when it is not needed.
- Use a compact room strip that remains separate from the map.
- Enter fullscreen and view the current camera direction.
- Use previous/next room controls or start an Auto tour that slowly looks around before moving to the next connected room.

## Out of scope unless explicitly requested

- User accounts, passwords, OAuth, permissions, or multi-tenant workspaces.
- Payments, subscriptions, or hosted asset billing.
- Automatic generation of architectural plans from panoramas.
- Real-world GPS navigation.
- Collaborative simultaneous editing.

## Success criteria

- A new local tour can be created and opened without credentials.
- Uploaded panoramas and plan images survive an application restart.
- Map points reliably open their linked scenes.
- The active map marker and room name update after every navigation method.
- A duplex or multi-floor property can be represented clearly.
- Auto tour can be started and stopped at any time and follows a scene connection when one exists.
- Tours remain usable on common desktop and mobile viewports.
- The project passes its type and production-build checks.
