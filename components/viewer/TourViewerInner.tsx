"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import { StereoPlugin } from "@photo-sphere-viewer/stereo-plugin";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { DEFAULT_FOV, type Hotspot, type Scene, type Tour } from "@/lib/types";
import {
  actionForHotspot,
  isImageUrl,
  markerForHotspot,
} from "./hotspot-handlers";
import styles from "./TourViewer.module.css";

export interface TourViewerInnerProps {
  tour: Tour;
}

// Minimal shapes we rely on from PSV (the wrapper's types are loose).
interface MarkersPluginLike {
  addEventListener(
    type: "select-marker",
    cb: (e: { marker: { id: string } }) => void
  ): void;
  setMarkers(markers: unknown[]): void;
}
interface ViewerLike {
  getPlugin(plugin: unknown): MarkersPluginLike | null;
  setPanorama(
    path: string,
    options?: { position?: { yaw: string; pitch: string }; zoom?: number }
  ): Promise<unknown>;
}

export default function TourViewerInner({ tour }: TourViewerInnerProps) {
  const startScene =
    tour.scenes.find((s) => s.id === tour.startSceneId) ?? tour.scenes[0];

  const [currentId, setCurrentId] = useState(startScene.id);
  const [panel, setPanel] = useState<Hotspot | null>(null);

  const viewerRef = useRef<ViewerLike | null>(null);
  const markersRef = useRef<MarkersPluginLike | null>(null);
  const firstRender = useRef(true);

  const currentScene: Scene =
    tour.scenes.find((s) => s.id === currentId) ?? startScene;

  // What a selected marker does — kept in a ref so the (once-attached) PSV
  // listener always sees the current scene's hotspots.
  const selectRef = useRef<(markerId: string) => void>(() => {});
  selectRef.current = (markerId: string) => {
    const h = currentScene.hotspots.find((x) => x.id === markerId);
    if (!h) return;
    const action = actionForHotspot(h);
    switch (action.kind) {
      case "link":
        window.open(action.url, "_blank", "noopener,noreferrer");
        break;
      case "panel":
        setPanel(action.hotspot);
        break;
      case "scene":
        if (tour.scenes.some((s) => s.id === action.targetSceneId)) {
          setPanel(null);
          setCurrentId(action.targetSceneId);
        }
        break;
    }
  };

  // On phones, prefer the smaller mobile image variant for faster loads.
  const pickUrl = useCallback((s: Scene) => {
    if (
      typeof window !== "undefined" &&
      window.innerWidth <= 768 &&
      s.image.mobileUrl
    ) {
      return s.image.mobileUrl;
    }
    return s.image.url;
  }, []);

  const startMarkers = useMemo(
    () => startScene.hotspots.map(markerForHotspot),
    [startScene.hotspots]
  );

  const plugins = useMemo(
    () =>
      [
        GyroscopePlugin,
        StereoPlugin,
        [MarkersPlugin, { markers: startMarkers }] as [
          typeof MarkersPlugin,
          Record<string, unknown>
        ],
      ] as Array<
        | typeof GyroscopePlugin
        | typeof StereoPlugin
        | [typeof MarkersPlugin, Record<string, unknown>]
      >,
    [startMarkers]
  );

  const onReady = useCallback((instance: unknown) => {
    const viewer = instance as ViewerLike;
    viewerRef.current = viewer;
    const markers = viewer.getPlugin(MarkersPlugin);
    markersRef.current = markers;
    markers?.addEventListener("select-marker", (e) =>
      selectRef.current(e.marker.id)
    );
  }, []);

  // Navigate when the current scene changes (skip the initial mount, which the
  // <ReactPhotoSphereViewer src/plugins> props already render).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const viewer = viewerRef.current;
    const markers = markersRef.current;
    if (!viewer || !markers) return;
    viewer
      .setPanorama(pickUrl(currentScene), {
        position: {
          yaw: `${currentScene.initialYaw}deg`,
          pitch: `${currentScene.initialPitch}deg`,
        },
        // Apply the scene's starting zoom too, so the full starting view is
        // restored on every entry — not just yaw/pitch the first time.
        zoom: fovToZoom(currentScene.initialFov || DEFAULT_FOV),
      })
      .then(() => {
        markers.setMarkers(currentScene.hotspots.map(markerForHotspot));
      });
  }, [currentScene, pickUrl]);

  return (
    <div className={styles.wrap}>
      <ReactPhotoSphereViewer
        src={pickUrl(startScene)}
        defaultYaw={`${startScene.initialYaw}deg`}
        defaultPitch={`${startScene.initialPitch}deg`}
        defaultZoomLvl={fovToZoom(startScene.initialFov || DEFAULT_FOV)}
        // 'gyroscope' enables device-orientation look; 'stereo' is the VR/cardboard mode.
        navbar={["zoom", "move", "gyroscope", "stereo", "fullscreen"]}
        plugins={plugins}
        onReady={onReady}
        height="100vh"
        width="100%"
      />

      {tour.scenes.length > 1 && (
        <div className={styles.sceneLabel}>{currentScene.name}</div>
      )}

      {panel && (
        <div className={styles.panel} role="dialog" aria-label={panel.label}>
          <button
            className={styles.close}
            onClick={() => setPanel(null)}
            aria-label="Close"
          >
            ×
          </button>
          <h3>{panel.label || "Untitled"}</h3>
          {panel.type === "media" && panel.url && isImageUrl(panel.url) && (
            <img className={styles.media} src={panel.url} alt={panel.label} />
          )}
          {panel.content && <p>{panel.content}</p>}
          {panel.url && !isImageUrl(panel.url) && (
            <a href={panel.url} target="_blank" rel="noopener noreferrer">
              Open link ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * PSV uses a 0–100 zoom level rather than an FOV in degrees:
 * fov 90° → zoom 0 (widest), fov 30° → zoom 100 (tightest).
 */
function fovToZoom(fov: number): number {
  const clamped = Math.max(30, Math.min(90, fov));
  return Math.round(((90 - clamped) / (90 - 30)) * 100);
}
