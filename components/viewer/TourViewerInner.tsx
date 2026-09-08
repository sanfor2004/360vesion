"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import { StereoPlugin } from "@photo-sphere-viewer/stereo-plugin";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { DEFAULT_FOV, type FloorPlanFloor, type Hotspot, type Scene, type Tour } from "@/lib/types";
import { actionForHotspot, isImageUrl, markerForHotspot } from "./hotspot-handlers";
import { ActionButton } from "@/components/ui";
import styles from "./TourViewer.module.css";

export interface TourViewerInnerProps { tour: Tour }

interface MarkersPluginLike {
  addEventListener(type: "select-marker", cb: (e: { marker: { id: string } }) => void): void;
  setMarkers(markers: unknown[]): void;
}
interface ViewerLike {
  getPlugin(plugin: unknown): MarkersPluginLike | null;
  addEventListener(type: "position-updated", cb: (e: { position: { yaw: number } }) => void): void;
  setPanorama(path: string, options?: { position?: { yaw: string; pitch: string }; zoom?: number }): Promise<unknown>;
  animate?: (options: { yaw: string; pitch: string; speed: string }) => Promise<unknown>;
}

export default function TourViewerInner({ tour }: TourViewerInnerProps) {
  const startScene = tour.scenes.find((scene) => scene.id === tour.startSceneId) ?? tour.scenes[0];
  const [currentId, setCurrentId] = useState(startScene.id);
  const [panel, setPanel] = useState<Hotspot | null>(null);
  const [mapOpen, setMapOpen] = useState(true);
  const [compass, setCompass] = useState(startScene.initialYaw);
  const [floorId, setFloorId] = useState(startScene.floorId ?? tour.floorPlan?.floors[0]?.id ?? "");
  const [autoTour, setAutoTour] = useState(false);
  const viewerRef = useRef<ViewerLike | null>(null);
  const markersRef = useRef<MarkersPluginLike | null>(null);
  const firstRender = useRef(true);
  const autoTourTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentScene = tour.scenes.find((scene) => scene.id === currentId) ?? startScene;
  const floors = tour.floorPlan?.floors ?? [];
  const floor: FloorPlanFloor | undefined = floors.find((item) => item.id === floorId) ?? floors[0];
  const mapAvailable = Boolean(tour.floorPlan?.enabled && floors.length);

  const navigate = useCallback((sceneId: string) => {
    const destination = tour.scenes.find((scene) => scene.id === sceneId);
    if (!destination) return;
    setPanel(null);
    setCurrentId(destination.id);
    if (destination.floorId) setFloorId(destination.floorId);
  }, [tour.scenes]);

  const sceneBefore = tour.scenes[(tour.scenes.findIndex((scene) => scene.id === currentId) - 1 + tour.scenes.length) % tour.scenes.length];
  const sceneAfter = tour.scenes[(tour.scenes.findIndex((scene) => scene.id === currentId) + 1) % tour.scenes.length];
  const autoDestination = useMemo(() => {
    const connectedId = currentScene.hotspots.find((hotspot) => hotspot.type === "scene" && hotspot.targetSceneId)?.targetSceneId;
    return tour.scenes.find((scene) => scene.id === connectedId) ?? sceneAfter;
  }, [currentScene.hotspots, sceneAfter, tour.scenes]);

  const selectRef = useRef<(markerId: string) => void>(() => {});
  selectRef.current = (markerId: string) => {
    const hotspot = currentScene.hotspots.find((item) => item.id === markerId);
    if (!hotspot) return;
    const action = actionForHotspot(hotspot);
    if (action.kind === "link") window.open(action.url, "_blank", "noopener,noreferrer");
    if (action.kind === "panel") setPanel(action.hotspot);
    if (action.kind === "scene") navigate(action.targetSceneId);
  };

  const pickUrl = useCallback((scene: Scene) => {
    if (typeof window !== "undefined" && window.innerWidth <= 768 && scene.image.mobileUrl) return scene.image.mobileUrl;
    return scene.image.url;
  }, []);

  const startMarkers = useMemo(() => startScene.hotspots.map(markerForHotspot), [startScene.hotspots]);
  const plugins = useMemo(() => [
    GyroscopePlugin,
    StereoPlugin,
    [MarkersPlugin, { markers: startMarkers }] as [typeof MarkersPlugin, Record<string, unknown>],
  ] as Array<typeof GyroscopePlugin | typeof StereoPlugin | [typeof MarkersPlugin, Record<string, unknown>]>, [startMarkers]);

  const onReady = useCallback((instance: unknown) => {
    const viewer = instance as ViewerLike;
    viewerRef.current = viewer;
    const markers = viewer.getPlugin(MarkersPlugin);
    markersRef.current = markers;
    markers?.addEventListener("select-marker", (event) => selectRef.current(event.marker.id));
    viewer.addEventListener("position-updated", (event) => setCompass((event.position.yaw * 180) / Math.PI));
  }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const viewer = viewerRef.current;
    const markers = markersRef.current;
    if (!viewer || !markers) return;
    viewer.setPanorama(pickUrl(currentScene), {
      position: { yaw: `${currentScene.initialYaw}deg`, pitch: `${currentScene.initialPitch}deg` },
      zoom: fovToZoom(currentScene.initialFov || DEFAULT_FOV),
    }).then(() => markers.setMarkers(currentScene.hotspots.map(markerForHotspot)));
  }, [currentScene, pickUrl]);

  useEffect(() => {
    if (autoTourTimer.current) clearTimeout(autoTourTimer.current);
    if (!autoTour || !autoDestination || tour.scenes.length < 2) return;

    // Photo Sphere Viewer supplies this animation method at runtime. If a device/browser
    // cannot animate it, the timed room-to-room progression remains available.
    try {
      const animation = viewerRef.current?.animate?.({
        yaw: `${currentScene.initialYaw + 330}deg`,
        pitch: `${currentScene.initialPitch}deg`,
        speed: "4rpm",
      });
      if (animation && typeof (animation as Promise<unknown>).catch === "function") {
        void (animation as Promise<unknown>).catch(() => undefined);
      }
    } catch {
      // Keep the timed scene progression available if the viewer cannot animate.
    }
    autoTourTimer.current = setTimeout(() => navigate(autoDestination.id), 8000);
    return () => { if (autoTourTimer.current) clearTimeout(autoTourTimer.current); };
  }, [autoDestination, autoTour, currentScene.initialPitch, currentScene.initialYaw, navigate, tour.scenes.length]);

  const currentPoint = floors.flatMap((item) => item.points.map((point) => ({ ...point, floorId: item.id })))
    .find((point) => point.sceneId === currentScene.id);

  return (
    <div className={styles.wrap} data-theme="luxury">
      <ReactPhotoSphereViewer src={pickUrl(startScene)} defaultYaw={`${startScene.initialYaw}deg`} defaultPitch={`${startScene.initialPitch}deg`} defaultZoomLvl={fovToZoom(startScene.initialFov || DEFAULT_FOV)} navbar={false} plugins={plugins} onReady={onReady} height="100vh" width="100%" />

      <div className={styles.topBar}>
        <div className={styles.brandText} aria-label="360Vision"><span>360</span>Vision</div>
        <div className={styles.tourTitle}><small>INTERACTIVE PROPERTY TOUR</small><strong>{tour.title}</strong></div>
        <div className={styles.topActions}>
          {mapAvailable && <ActionButton className={styles.viewerAction} size="sm" onClick={() => setMapOpen((open) => !open)} aria-pressed={mapOpen}>{mapOpen ? "Hide map" : "Show map"}</ActionButton>}
          {tour.scenes.length > 1 && <ActionButton className={`${styles.viewerAction} ${styles.iconAction}`} size="sm" onClick={() => navigate(sceneBefore.id)} aria-label={`Previous room: ${sceneBefore.name}`} title="Previous room">←</ActionButton>}
          {tour.scenes.length > 1 && <ActionButton className={styles.viewerAction} size="sm" tone={autoTour ? "primary" : "default"} onClick={() => setAutoTour((playing) => !playing)} aria-pressed={autoTour}>{autoTour ? "Stop tour" : "Auto tour"}</ActionButton>}
          {tour.scenes.length > 1 && <ActionButton className={`${styles.viewerAction} ${styles.iconAction}`} size="sm" onClick={() => navigate(sceneAfter.id)} aria-label={`Next room: ${sceneAfter.name}`} title="Next room">→</ActionButton>}
          <ActionButton className={`${styles.viewerAction} ${styles.iconAction}`} size="sm" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Enter fullscreen"><ExpandIcon /></ActionButton>
        </div>
      </div>

      <div className={styles.roomBadge}><span className={styles.liveDot} /><div><small>{autoTour ? "AUTO TOUR PLAYING" : "YOU ARE HERE"}</small><strong>{currentScene.name}</strong></div></div>
      <div className={styles.compass} aria-label={`View direction ${cardinal(compass)}`}><span>{cardinal(compass)}</span><i style={{ transform: `rotate(${compass}deg)` }}>↑</i></div>

      {mapAvailable && mapOpen && floor && (
        <section className={`${styles.mapCard} card card-sm`} aria-label="Property floor plan">
          <div className={styles.mapHeader}>
            <div><small>PROPERTY MAP</small><strong>{floor.name}</strong></div>
            {floors.length > 1 && <div role="tablist" className={styles.floorTabs}>{floors.map((item) => <ActionButton key={item.id} role="tab" className={styles.floorTab} size="xs" tone={item.id === floor.id ? "primary" : "ghost"} aria-selected={item.id === floor.id} onClick={() => setFloorId(item.id)}>{item.name}</ActionButton>)}</div>}
          </div>
          <div className={styles.mapCanvas}>
            {floor.imageUrl ? <img src={floor.imageUrl} alt={`${floor.name} floor plan`} /> : <EmptyPlan />}
            {floor.points.map((point) => {
              const active = point.sceneId === currentScene.id;
              return <button key={point.id} className={`${styles.mapPoint} ${active ? styles.mapPointActive : ""}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={() => navigate(point.sceneId)} aria-label={`Go to ${point.label}`} title={point.label}><span>{active ? <RadarIcon /> : ""}</span><em>{point.label}</em></button>;
            })}
          </div>
          <div className={styles.mapFooter}><span className={styles.currentKey}><i /> Current location</span><span>{currentPoint ? `${currentPoint.label} · ${floor.name}` : "Choose a room below"}</span></div>
        </section>
      )}

      <nav className={styles.sceneRail} aria-label="Rooms and spaces">
        <div className={styles.railLabel}><small>EXPLORE</small><strong>{tour.scenes.length} spaces</strong></div>
        <div className={styles.sceneScroller}>{tour.scenes.map((scene) => (
          <button key={scene.id} className={`${styles.sceneCard} ${scene.id === currentScene.id ? styles.sceneCardActive : ""}`} onClick={() => navigate(scene.id)}>
            <img src={scene.image.thumbnailUrl ?? scene.image.mobileUrl ?? scene.image.url} alt="" /><span>{scene.name}</span>{scene.floorId && <small>{floors.find((item) => item.id === scene.floorId)?.name}</small>}
          </button>
        ))}</div>
      </nav>

      {panel && <div className={`${styles.panel} card card-sm`} role="dialog" aria-label={panel.label}>
        <ActionButton className={styles.panelClose} tone="ghost" size="xs" onClick={() => setPanel(null)} aria-label="Close">×</ActionButton>
        <h3 className="card-title">{panel.label || "Untitled"}</h3>
        {panel.type === "media" && panel.url && isImageUrl(panel.url) && <img className={styles.media} src={panel.url} alt={panel.label} />}
        {panel.content && <p>{panel.content}</p>}
        {panel.url && !isImageUrl(panel.url) && <a href={panel.url} target="_blank" rel="noopener noreferrer">Open link ↗</a>}
      </div>}
    </div>
  );
}

function fovToZoom(fov: number) { const clamped = Math.max(30, Math.min(90, fov)); return Math.round(((90 - clamped) / 60) * 100); }
function cardinal(degrees: number) { const normalized = ((degrees % 360) + 360) % 360; return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(normalized / 45) % 8]; }
function ExpandIcon() { return <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg>; }
function RadarIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" opacity=".55" /></svg>; }
function EmptyPlan() { return <div className={styles.emptyPlan}><div className={styles.blueprintGrid} /><span>Floor plan not uploaded</span></div>; }
