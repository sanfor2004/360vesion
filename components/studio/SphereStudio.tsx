"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { v4 as uuid } from "uuid";
import {
  DEFAULT_FOV,
  type Hotspot,
  type HotspotType,
  type ImageAsset,
  type Scene,
  type Tour,
  type Visibility,
} from "@/lib/types";
import { fetchTour, saveTour, uploadIcon, uploadImage } from "@/lib/api-client";
import {
  DEFAULT_PIN_COLOR,
  glyphKey,
  iconSrc,
  isBuiltinIcon,
  PIN_COLORS,
  PIN_GLYPHS,
  PIN_ICONS,
  pinDataUri,
} from "@/components/viewer/hotspot-handlers";
import { dirToWorld, lookTarget, ndcFromEvent, worldToDir } from "./raycast";
import styles from "./SphereStudio.module.css";

const R = 500; // sphere radius
const HOTSPOT_TYPES: HotspotType[] = ["info", "link", "scene", "media"];

/** A real, served URL so saved scenes are immediately viewable. */
const DEFAULT_IMAGE: ImageAsset = {
  url: "/panoramas/test-grid.jpg",
  width: 4096,
  height: 2048,
  projection: "equirectangular",
};

type Mode = "edit" | "view";

function makeScene(name: string): Scene {
  return {
    id: uuid(),
    name,
    image: DEFAULT_IMAGE,
    initialYaw: 0,
    initialPitch: 0,
    initialFov: DEFAULT_FOV,
    hotspots: [],
  };
}

export interface SphereStudioProps {
  /** Tour to load/save. */
  tourId: string;
}

export default function SphereStudio({ tourId }: SphereStudioProps) {
  const firstScene = useMemo(() => makeScene("Scene 1"), []);

  // ---- tour-level state ----
  const [scenes, setScenes] = useState<Scene[]>([firstScene]);
  const [activeId, setActiveId] = useState(firstScene.id);
  const [startSceneId, setStartSceneId] = useState(firstScene.id);
  const [title, setTitle] = useState("Untitled tour");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("draft");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // ---- editing state ----
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("edit");
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // ---- collapsible right-panel sections ----
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    // Only "Tour info" (meta) is open by default; everything else minimized.
    scene: true,
    scenes: true,
    hotspots: true,
    editor: true,
  });
  const toggleSection = useCallback(
    (key: string) => setCollapsed((c) => ({ ...c, [key]: !c[key] })),
    []
  );

  const activeScene = scenes.find((s) => s.id === activeId) ?? scenes[0];
  const hotspots = activeScene.hotspots;
  const selected = hotspots.find((h) => h.id === selectedId) ?? null;

  // ---- refs the render loop / event handlers read (always current) ----
  const mountRef = useRef<HTMLDivElement>(null);
  const hudYawRef = useRef<HTMLSpanElement>(null);
  const hudPitchRef = useRef<HTMLSpanElement>(null);
  const markerEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const hotspotsRef = useRef(hotspots);
  const modeRef = useRef(mode);
  const activeIdRef = useRef(activeId);
  const previewUrlRef = useRef<string | null>(null);
  const fileImgRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);

  const three = useRef<{
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    sphere: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    raycaster: THREE.Raycaster;
    lon: number;
    lat: number;
    loadTextureUrl: (url: string) => void;
  } | null>(null);

  useEffect(() => {
    hotspotsRef.current = hotspots;
  }, [hotspots]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // ---- undo history (Ctrl/Cmd+Z) ----
  // We snapshot whole-`scenes` states. Most user edits flow through setScenes,
  // so recording every change to `scenes` (except programmatic ones we flag)
  // gives a faithful undo stack without threading a snapshot call through every
  // handler.
  const undoStack = useRef<Scene[][]>([]);
  const prevScenesRef = useRef<Scene[]>(scenes);
  const skipHistory = useRef(false);
  useEffect(() => {
    if (prevScenesRef.current === scenes) return;
    if (skipHistory.current) {
      skipHistory.current = false;
    } else {
      undoStack.current.push(prevScenesRef.current);
      if (undoStack.current.length > 100) undoStack.current.shift();
    }
    prevScenesRef.current = scenes;
  }, [scenes]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) {
      setStatus("Nothing to undo");
      return;
    }
    skipHistory.current = true;
    setScenes(prev);
    // The active scene may have been removed (undoing an add) or its image may
    // differ from what's currently rendered — re-anchor to a valid scene and
    // reload its texture so the preview matches the restored state.
    const active = prev.find((s) => s.id === activeIdRef.current) ?? prev[0];
    if (active) {
      setActiveId(active.id);
      three.current?.loadTextureUrl(active.image.url);
    }
    setSelectedId((cur) =>
      active && active.hotspots.some((h) => h.id === cur) ? cur : null
    );
    setOpenPopupId(null);
    setStatus("Undo");
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== "z") return;
      // Let inputs handle native text undo rather than reverting scene state.
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      e.preventDefault();
      undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo]);

  // ---- mutate the active scene's hotspots ----
  const setActiveHotspots = useCallback(
    (updater: (hs: Hotspot[]) => Hotspot[]) => {
      setScenes((prev) =>
        prev.map((s) =>
          s.id === activeIdRef.current
            ? { ...s, hotspots: updater(s.hotspots) }
            : s
        )
      );
    },
    []
  );

  const updateSelected = useCallback(
    (patch: Partial<Hotspot>) => {
      setActiveHotspots((hs) =>
        hs.map((h) => (h.id === selectedId ? { ...h, ...patch } : h))
      );
    },
    [selectedId, setActiveHotspots]
  );

  const deleteSelected = useCallback(() => {
    setActiveHotspots((hs) => hs.filter((h) => h.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setActiveHotspots]);

  const deleteHotspot = useCallback(
    (id: string) => {
      setActiveHotspots((hs) => hs.filter((h) => h.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
      setOpenPopupId((cur) => (cur === id ? null : cur));
    },
    [setActiveHotspots]
  );

  /** Snapshot the live camera into a scene's initial framing. */
  const captureFraming = useCallback(
    (list: Scene[], sceneId: string): Scene[] => {
      const cam = three.current;
      if (!cam) return list;
      return list.map((s) =>
        s.id === sceneId
          ? {
              ...s,
              initialYaw: +cam.lon.toFixed(2),
              initialPitch: +cam.lat.toFixed(2),
              initialFov: Math.round(cam.camera.fov),
            }
          : s
      );
    },
    []
  );

  const applyFraming = useCallback((s: Scene) => {
    const cam = three.current;
    if (!cam) return;
    cam.lon = s.initialYaw;
    cam.lat = s.initialPitch;
    cam.camera.fov = s.initialFov || DEFAULT_FOV;
    cam.camera.updateProjectionMatrix();
    cam.loadTextureUrl(s.image.url);
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------- three setup
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, 1, 0.1, 1100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.insertBefore(renderer.domElement, mount.firstChild);

    const geo = new THREE.SphereGeometry(R, 64, 48);
    const material = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    const sphere = new THREE.Mesh(geo, material);
    scene.add(sphere);

    const raycaster = new THREE.Raycaster();

    const applyTexture = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      tex.offset.x = 1;
      tex.minFilter = THREE.LinearFilter;
      if (material.map) material.map.dispose();
      material.map = tex;
      material.needsUpdate = true;
    };

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const loadTextureUrl = (url: string) => {
      setImgError(null);
      loader.load(
        url,
        (tex) => {
          applyTexture(tex);
          setImgError(null);
        },
        undefined,
        () => {
          applyTexture(buildTestPanorama());
          setImgError(
            "Couldn't load this panorama image — it may be corrupt, too large, or an unsupported format. Showing the test grid instead."
          );
        }
      );
    };

    const ctx = {
      renderer,
      camera,
      scene,
      sphere,
      material,
      raycaster,
      lon: 0,
      lat: 0,
      loadTextureUrl,
    };
    three.current = ctx;
    loadTextureUrl(DEFAULT_IMAGE.url);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const ptrs = new Map<number, { x: number; y: number }>();
    let moved = false;
    let startX = 0;
    let startY = 0;
    let pinchStart = 0;
    let fovStart = DEFAULT_FOV;
    let downOnMarker = false;

    const isMarkerTarget = (t: EventTarget | null) =>
      t instanceof HTMLElement && !!t.closest("[data-marker]");

    const onDown = (e: PointerEvent) => {
      downOnMarker = isMarkerTarget(e.target);
      if (downOnMarker) return;
      mount.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
      }
      if (ptrs.size === 2) {
        const a = [...ptrs.values()];
        pinchStart = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        fovStart = camera.fov;
      }
    };

    const onMove = (e: PointerEvent) => {
      const p = ptrs.get(e.pointerId);
      if (p) {
        p.x = e.clientX;
        p.y = e.clientY;
      }
      updateHud(e);
      if (ptrs.size === 2) {
        const a = [...ptrs.values()];
        const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        camera.fov = Math.max(30, Math.min(100, fovStart * (pinchStart / d)));
        camera.updateProjectionMatrix();
        return;
      }
      if (ptrs.size === 1 && (e.buttons !== 0 || e.pressure > 0)) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        ctx.lon -= (e.movementX || 0) * 0.09 * (camera.fov / 75);
        ctx.lat += (e.movementY || 0) * 0.09 * (camera.fov / 75);
      }
    };

    const onUp = (e: PointerEvent) => {
      const wasOne = ptrs.size === 1;
      ptrs.delete(e.pointerId);
      if (downOnMarker) {
        downOnMarker = false;
        return;
      }
      if (wasOne && !moved && modeRef.current === "edit") placeAt(e);
    };

    const onCancel = (e: PointerEvent) => ptrs.delete(e.pointerId);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.fov = Math.max(30, Math.min(100, camera.fov + e.deltaY * 0.05));
      camera.updateProjectionMatrix();
    };

    const updateHud = (e: PointerEvent) => {
      if (ptrs.size > 1) return;
      raycaster.setFromCamera(ndcFromEvent(e, renderer.domElement), camera);
      const hit = raycaster.intersectObject(sphere)[0];
      if (!hit) return;
      const d = worldToDir(hit.point);
      if (hudYawRef.current) hudYawRef.current.textContent = d.yaw.toFixed(1) + "°";
      if (hudPitchRef.current)
        hudPitchRef.current.textContent = d.pitch.toFixed(1) + "°";
    };

    const placeAt = (e: PointerEvent) => {
      raycaster.setFromCamera(ndcFromEvent(e, renderer.domElement), camera);
      const hit = raycaster.intersectObject(sphere)[0];
      if (!hit) return;
      const d = worldToDir(hit.point);
      const hs: Hotspot = {
        id: uuid(),
        type: "info",
        label: "",
        content: "",
        yaw: +d.yaw.toFixed(2),
        pitch: +d.pitch.toFixed(2),
      };
      setActiveHotspots((prev) => [...prev, hs]);
      setSelectedId(hs.id);
    };

    mount.addEventListener("pointerdown", onDown);
    mount.addEventListener("pointermove", onMove);
    mount.addEventListener("pointerup", onUp);
    mount.addEventListener("pointercancel", onCancel);
    mount.addEventListener("wheel", onWheel, { passive: false });

    const fwd = new THREE.Vector3();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      ctx.lat = Math.max(-85, Math.min(85, ctx.lat));
      camera.lookAt(lookTarget(R, ctx.lon, ctx.lat));
      renderer.render(scene, camera);
      positionMarkers();
    };
    const positionMarkers = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.getWorldDirection(fwd);
      for (const hs of hotspotsRef.current) {
        const el = markerEls.current.get(hs.id);
        if (!el) continue;
        const wp = dirToWorld(hs.yaw, hs.pitch, R - 6);
        const behind = wp.clone().normalize().dot(fwd) <= 0.02;
        if (behind) {
          el.style.display = "none";
          continue;
        }
        const v = wp.project(camera);
        el.style.display = "block";
        el.style.left = (v.x * 0.5 + 0.5) * w + "px";
        el.style.top = (-v.y * 0.5 + 0.5) * h + "px";
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeEventListener("pointerdown", onDown);
      mount.removeEventListener("pointermove", onMove);
      mount.removeEventListener("pointerup", onUp);
      mount.removeEventListener("pointercancel", onCancel);
      mount.removeEventListener("wheel", onWheel);
      renderer.domElement.remove();
      material.map?.dispose();
      material.dispose();
      geo.dispose();
      renderer.dispose();
      three.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------- load tour
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tour = await fetchTour(tourId);
        if (cancelled || !tour || tour.scenes.length === 0) return;
        setTitle(tour.title);
        setDescription(tour.description ?? "");
        setVisibility(tour.visibility ?? "draft");
        setCreatedAt(tour.createdAt);
        skipHistory.current = true; // loading a tour isn't an undoable edit
        setScenes(tour.scenes);
        setStartSceneId(tour.startSceneId || tour.scenes[0].id);
        const start =
          tour.scenes.find((s) => s.id === tour.startSceneId) ?? tour.scenes[0];
        setActiveId(start.id);
        applyFraming(start);
        setStatus(`Loaded "${tour.title}" (${tour.scenes.length} scene(s))`);
      } catch (err) {
        if (!cancelled) setStatus((err as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tourId, applyFraming]);

  useEffect(() => () => revokePreview(), [revokePreview]);

  // ---------------------------------------------------------------- scenes
  const switchScene = (id: string) => {
    if (id === activeId) return;
    revokePreview();
    // Snapshot the live camera into the OUTGOING scene NOW, before applyFraming
    // moves the camera to the incoming scene. (A setScenes updater would run
    // after applyFraming and capture the wrong orientation.)
    const captured = captureFraming(scenes, activeId);
    skipHistory.current = true; // a framing snapshot on switch isn't a discrete edit
    setScenes(captured);
    const incoming = captured.find((s) => s.id === id);
    setActiveId(id);
    setSelectedId(null);
    setOpenPopupId(null);
    if (incoming) applyFraming(incoming);
  };

  const addScene = () => {
    revokePreview();
    const sc = makeScene(`Scene ${scenes.length + 1}`);
    // Snapshot the current scene's framing BEFORE the camera moves to the new one.
    const captured = captureFraming(scenes, activeId);
    setScenes([...captured, sc]);
    setActiveId(sc.id);
    setSelectedId(null);
    setOpenPopupId(null);
    applyFraming(sc);
  };

  const deleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    revokePreview();
    // drop the scene and clear any hotspots that targeted it
    const remaining = scenes
      .filter((s) => s.id !== id)
      .map((s) => ({
        ...s,
        hotspots: s.hotspots.map((h) =>
          h.targetSceneId === id ? { ...h, targetSceneId: undefined } : h
        ),
      }));
    setScenes(remaining);
    if (startSceneId === id) setStartSceneId(remaining[0].id);
    if (activeId === id) {
      const incoming = remaining[0];
      setActiveId(incoming.id);
      setSelectedId(null);
      setOpenPopupId(null);
      applyFraming(incoming);
    }
  };

  const renameActiveScene = (name: string) =>
    setScenes((prev) =>
      prev.map((s) => (s.id === activeId ? { ...s, name } : s))
    );

  // ---------------------------------------------------------------- image load
  const onPickImage = () => fileImgRef.current?.click();
  const onImageChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !three.current) return;

    // Capture WHICH scene this upload is for now. Uploads are async (large
    // panoramas take seconds); if we read the active scene after `await`, a scene
    // switch mid-upload would store the image on the wrong scene and leave this
    // one on the default image.
    const targetSceneId = activeIdRef.current;

    revokePreview();
    const objectUrl = URL.createObjectURL(f);
    previewUrlRef.current = objectUrl;
    three.current.loadTextureUrl(objectUrl);

    setBusy(true);
    setStatus("Uploading image…");
    try {
      const res = await uploadImage(f);
      const asset: ImageAsset = {
        url: res.url,
        width: res.width,
        height: res.height,
        projection: "equirectangular",
        mobileUrl: res.mobileUrl,
        thumbnailUrl: res.thumbnailUrl,
      };
      setScenes((prev) =>
        prev.map((s) => (s.id === targetSceneId ? { ...s, image: asset } : s))
      );
      // If the user is still viewing the scene they uploaded for, swap the live
      // texture from the temporary blob preview to the stored URL.
      if (activeIdRef.current === targetSceneId) {
        three.current?.loadTextureUrl(res.url);
      }
      setStatus(`Uploaded (${res.width}×${res.height})`);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onTestGrid = () => {
    revokePreview();
    three.current?.loadTextureUrl(DEFAULT_IMAGE.url);
    setScenes((prev) =>
      prev.map((s) =>
        s.id === activeIdRef.current ? { ...s, image: DEFAULT_IMAGE } : s
      )
    );
  };

  // ---------------------------------------------------------------- custom pin icon
  const onPickIcon = () => iconFileRef.current?.click();
  const onIconChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !selectedId) return;
    const id = selectedId;
    setBusy(true);
    setStatus("Uploading icon…");
    try {
      const { url } = await uploadIcon(f);
      setActiveHotspots((hs) =>
        hs.map((h) => (h.id === id ? { ...h, icon: url } : h))
      );
      setStatus("Icon uploaded");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------- save/export
  const buildTour = useCallback((): Tour => {
    const captured = captureFraming(scenes, activeId);
    const now = new Date().toISOString();
    return {
      id: tourId,
      title,
      description,
      visibility,
      startSceneId: startSceneId || captured[0].id,
      scenes: captured,
      createdAt: createdAt ?? now,
      updatedAt: now,
    };
  }, [scenes, activeId, captureFraming, tourId, title, description, visibility, startSceneId, createdAt]);

  const onSave = async () => {
    setBusy(true);
    setStatus("Saving…");
    try {
      const saved = await saveTour(tourId, buildTour());
      setCreatedAt(saved.createdAt);
      setStatus(`Saved at ${new Date(saved.updatedAt).toLocaleTimeString()}`);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onExport = () => {
    download(
      `${tourId}.json`,
      JSON.stringify(buildTour(), null, 2),
      "application/json"
    );
  };

  // ---------------------------------------------------------------- mode + selection
  const select = (id: string) => {
    if (mode === "view") {
      // Preview tour behaviour: a "scene" hotspot transfers to its target scene.
      const h = hotspots.find((x) => x.id === id);
      if (h?.type === "scene" && h.targetSceneId) {
        switchScene(h.targetSceneId);
        return;
      }
      setSelectedId(id);
      setOpenPopupId((cur) => (cur === id ? null : id));
      return;
    }
    setSelectedId(id);
  };
  const switchMode = (m: Mode) => {
    setMode(m);
    setOpenPopupId(null);
    if (m === "view") setSelectedId(null);
  };

  const otherScenes = scenes.filter((s) => s.id !== activeId);

  // ---------------------------------------------------------------- render
  return (
    <div className={styles.app}>
      <main className={styles.main}>
        <div
          ref={mountRef}
          className={`${styles.stage} ${mode === "edit" ? styles.placing : ""}`}
        >
          <div className={styles.logo} aria-label="360Vision">
            360<span>Vision</span>
          </div>

          <div className={styles.markers}>
            {hotspots.map((hs, i) => {
              const customIcon = !!hs.icon && !isBuiltinIcon(hs.icon);
              const customSize = customIcon ? hs.iconSize ?? 40 : undefined;
              return (
              <div
                key={hs.id}
                data-marker
                ref={(el) => {
                  if (el) markerEls.current.set(hs.id, el);
                  else markerEls.current.delete(hs.id);
                }}
                className={styles.markerWrap}
              >
                <button
                  className={`${styles.marker} ${
                    hs.icon ? styles.markerImg : ""
                  } ${hs.id === selectedId ? styles.sel : ""}`}
                  style={
                    customSize
                      ? { width: customSize, height: customSize }
                      : !hs.icon && hs.id !== selectedId && hs.iconColor
                      ? { background: hs.iconColor }
                      : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    select(hs.id);
                  }}
                >
                  {hs.icon ? (
                    <img
                      className={styles.markerImgEl}
                      src={iconSrc(hs.icon, hs.iconColor)}
                      alt=""
                    />
                  ) : (
                    i + 1
                  )}
                </button>
                {mode === "view" && openPopupId === hs.id && (
                  <div className={styles.popup}>
                    <h4>{hs.label || "Untitled"}</h4>
                    {hs.type === "scene" && hs.targetSceneId && (
                      <p>
                        → {scenes.find((s) => s.id === hs.targetSceneId)?.name ??
                          "(missing scene)"}
                      </p>
                    )}
                    {hs.content && <p>{hs.content}</p>}
                    {hs.url && (
                      <p>
                        <a href={hs.url} target="_blank" rel="noreferrer">
                          {hs.url}
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>

          <div className={`${styles.hint} ${mode === "view" ? styles.hintView : ""}`}>
            {mode === "edit" ? (
              <>
                <b>Edit mode</b> — drag to look, click to place a hotspot
              </>
            ) : (
              <>
                <b>View mode</b> — drag to look, click a hotspot to read it
              </>
            )}
          </div>
          <div className={styles.hud}>
            <span className={styles.k}>yaw</span>{" "}
            <span ref={hudYawRef} className={styles.yaw}>
              —
            </span>{" "}
            <span className={styles.k}>pitch</span>{" "}
            <span ref={hudPitchRef} className={styles.pitch}>
              —
            </span>
          </div>

          {imgError && (
            <div className={styles.imgError} role="alert">
              <span className={styles.imgErrorIcon} aria-hidden>
                !
              </span>
              <span>{imgError}</span>
              <button
                type="button"
                className={styles.imgErrorClose}
                aria-label="Dismiss"
                onClick={() => setImgError(null)}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <aside className={styles.aside}>
          {/* ---- toolbar ---- */}
          <div className={styles.toolbar}>
            <div className={styles.seg}>
              <button
                className={mode === "edit" ? `${styles.on} ${styles.edit}` : ""}
                onClick={() => switchMode("edit")}
              >
                Edit
              </button>
              <button
                className={mode === "view" ? `${styles.on} ${styles.view}` : ""}
                onClick={() => switchMode("view")}
              >
                View
              </button>
            </div>
            <div className={styles.toolbarBtns}>
              <button className={styles.btn} onClick={onExport}>
                Export
              </button>
              <button
                className={`${styles.btn} ${styles.primary}`}
                onClick={onSave}
                disabled={busy}
              >
                Save
              </button>
            </div>
          </div>

          {/* ---- tour info ---- */}
          <div
            className={styles.ph}
            onClick={() => toggleSection("meta")}
            role="button"
          >
            <span>
              <span
                className={styles.chev}
                data-open={!collapsed.meta}
                aria-hidden
              >
                ▸
              </span>
              Tour info
            </span>
          </div>
          {!collapsed.meta && (
            <div className={styles.meta}>
              <label>Tour title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
              <label>Description</label>
              <textarea
                value={description}
                placeholder="What is this tour about?"
                onChange={(e) => setDescription(e.target.value)}
              />
              <label>Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
              >
                <option value="draft">Draft — only you</option>
                <option value="public">Public — shown in Explore</option>
                <option value="unlisted">Unlisted — anyone with the link</option>
              </select>
              {status && <div className={styles.status}>{status}</div>}
            </div>
          )}

          {/* ---- scenes ---- */}
          <div
            className={styles.ph}
            onClick={() => toggleSection("scenes")}
            role="button"
          >
            <span>
              <span
                className={styles.chev}
                data-open={!collapsed.scenes}
                aria-hidden
              >
                ▸
              </span>
              Scenes
            </span>
            <button
              className={styles.addScene}
              onClick={(e) => {
                e.stopPropagation();
                addScene();
              }}
            >
              + Add
            </button>
          </div>
          {!collapsed.scenes && (
          <div className={styles.sceneList}>
            {scenes.map((s) => (
              <div
                key={s.id}
                className={`${styles.sceneRow} ${
                  s.id === activeId ? styles.sceneRowActive : ""
                }`}
                onClick={() => switchScene(s.id)}
              >
                <button
                  className={styles.startBtn}
                  title={
                    s.id === startSceneId ? "Start scene" : "Set as start scene"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setStartSceneId(s.id);
                  }}
                >
                  {s.id === startSceneId ? "★" : "☆"}
                </button>
                <span className={styles.name}>{s.name}</span>
                <span className={styles.co}>{s.hotspots.length}</span>
                {scenes.length > 1 && (
                  <button
                    className={styles.sceneDel}
                    title="Delete scene"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScene(s.id);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          )}

          {/* ---- scene settings ---- */}
          <div
            className={styles.ph}
            onClick={() => toggleSection("scene")}
            role="button"
          >
            <span>
              <span
                className={styles.chev}
                data-open={!collapsed.scene}
                aria-hidden
              >
                ▸
              </span>
              Scene settings
            </span>
            <span className={styles.co}>{activeScene.name}</span>
          </div>
          {!collapsed.scene && (
            <div className={styles.meta}>
              <label>Scene name</label>
              <input
                value={activeScene.name}
                onChange={(e) => renameActiveScene(e.target.value)}
              />

              <label>Scene image</label>
              {activeScene.image.thumbnailUrl || activeScene.image.url ? (
                <img
                  className={styles.scenePreview}
                  src={activeScene.image.thumbnailUrl ?? activeScene.image.url}
                  alt=""
                />
              ) : null}
              <div className={styles.imageBtns}>
                <button
                  className={styles.btn}
                  onClick={onPickImage}
                  disabled={busy}
                >
                  Upload image
                </button>
                <button
                  className={`${styles.btn} ${styles.ghost}`}
                  onClick={onTestGrid}
                >
                  Test grid
                </button>
              </div>
            </div>
          )}

          {/* ---- hotspots ---- */}
          <div
            className={styles.ph}
            onClick={() => toggleSection("hotspots")}
            role="button"
          >
            <span>
              <span
                className={styles.chev}
                data-open={!collapsed.hotspots}
                aria-hidden
              >
                ▸
              </span>
              Hotspots
            </span>
            <span className={styles.count}>{hotspots.length}</span>
          </div>
          {!collapsed.hotspots && (
          <div className={styles.list}>
            {hotspots.length === 0 && (
              <div className={styles.empty}>
                No hotspots in this scene yet.
                <br />
                In Edit mode, click the panorama to drop one.
              </div>
            )}
            {hotspots.map((hs, i) => (
              <div
                key={hs.id}
                className={`${styles.row} ${
                  hs.id === selectedId ? styles.rowSel : ""
                }`}
                onClick={() => select(hs.id)}
              >
                <span className={styles.dot} />
                <span className={styles.name}>
                  {i + 1}. {hs.label || "Untitled"}
                </span>
                <span className={styles.co}>
                  {hs.yaw.toFixed(0)}°, {hs.pitch.toFixed(0)}°
                </span>
                <button
                  className={styles.rowDel}
                  title="Delete hotspot"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHotspot(hs.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          )}

          {selected && mode === "edit" && (
            <>
            <div
              className={styles.ph}
              onClick={() => toggleSection("editor")}
              role="button"
            >
              <span>
                <span
                  className={styles.chev}
                  data-open={!collapsed.editor}
                  aria-hidden
                >
                  ▸
                </span>
                Hotspot editor
              </span>
            </div>
            {!collapsed.editor && (
            <div className={styles.editor}>
              <label>Label</label>
              <input
                value={selected.label}
                placeholder="e.g. Front door"
                onChange={(e) => updateSelected({ label: e.target.value })}
              />

              <label>Type</label>
              <select
                value={selected.type}
                onChange={(e) =>
                  updateSelected({ type: e.target.value as HotspotType })
                }
              >
                {HOTSPOT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {selected.type === "scene" && (
                <>
                  <label>Target scene</label>
                  <select
                    value={selected.targetSceneId ?? ""}
                    onChange={(e) =>
                      updateSelected({ targetSceneId: e.target.value || undefined })
                    }
                  >
                    <option value="">— pick a scene —</option>
                    {otherScenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {otherScenes.length === 0 && (
                    <p className={styles.note}>Add another scene to link to.</p>
                  )}
                </>
              )}

              <label>Content (shown on click in View mode)</label>
              <textarea
                value={selected.content}
                placeholder="Description, caption, anything…"
                onChange={(e) => updateSelected({ content: e.target.value })}
              />

              {(selected.type === "link" || selected.type === "media") && (
                <>
                  <label>URL</label>
                  <input
                    value={selected.url ?? ""}
                    placeholder="https://…"
                    onChange={(e) => updateSelected({ url: e.target.value })}
                  />
                </>
              )}

              <label>Pin icon</label>
              {(() => {
                const color = selected.iconColor || DEFAULT_PIN_COLOR;
                const activeKey = selected.icon ? glyphKey(selected.icon) : null;
                const isCustom =
                  !!selected.icon && !isBuiltinIcon(selected.icon);
                return (
                  <>
                    <div className={styles.iconGrid}>
                      {/* numbered default */}
                      <button
                        type="button"
                        title="Number"
                        className={`${styles.iconTile} ${
                          !selected.icon ? styles.iconTileSel : ""
                        }`}
                        onClick={() => updateSelected({ icon: undefined })}
                      >
                        <span
                          className={styles.iconNumber}
                          style={{ background: color }}
                        >
                          #
                        </span>
                        <span className={styles.iconName}>Number</span>
                      </button>
                      {PIN_ICONS.map((key) => (
                        <button
                          type="button"
                          key={key}
                          title={PIN_GLYPHS[key].label}
                          className={`${styles.iconTile} ${
                            activeKey === key ? styles.iconTileSel : ""
                          }`}
                          onClick={() => updateSelected({ icon: key })}
                        >
                          <img
                            className={styles.iconTileImg}
                            src={pinDataUri(key, color)}
                            alt=""
                          />
                          <span className={styles.iconName}>
                            {PIN_GLYPHS[key].label}
                          </span>
                        </button>
                      ))}
                      {isCustom && (
                        <button
                          type="button"
                          title="Uploaded image"
                          className={`${styles.iconTile} ${styles.iconTileSel}`}
                        >
                          <img
                            className={styles.iconTileImg}
                            src={iconSrc(selected.icon!)}
                            alt=""
                          />
                          <span className={styles.iconName}>Custom</span>
                        </button>
                      )}
                    </div>

                    {!isCustom && (
                      <>
                        <label>Pin color</label>
                        <div className={styles.colorRow}>
                          {PIN_COLORS.map((c) => (
                            <button
                              type="button"
                              key={c}
                              title={c}
                              className={`${styles.swatch} ${
                                color.toLowerCase() === c.toLowerCase()
                                  ? styles.swatchSel
                                  : ""
                              }`}
                              style={{ background: c }}
                              onClick={() => updateSelected({ iconColor: c })}
                            />
                          ))}
                          <input
                            type="color"
                            className={styles.colorInput}
                            value={color}
                            onChange={(e) =>
                              updateSelected({ iconColor: e.target.value })
                            }
                          />
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
              <button
                className={`${styles.btn} ${styles.iconUpload}`}
                onClick={onPickIcon}
                disabled={busy}
              >
                Upload custom image…
              </button>

              {selected.icon && !isBuiltinIcon(selected.icon) && (
                <>
                  <label>Icon size — {selected.iconSize ?? 40}px</label>
                  <div className={styles.sizeRow}>
                    <input
                      type="range"
                      min={12}
                      max={160}
                      step={2}
                      value={selected.iconSize ?? 40}
                      onChange={(e) =>
                        updateSelected({ iconSize: parseInt(e.target.value, 10) })
                      }
                    />
                    <input
                      type="number"
                      min={12}
                      max={160}
                      value={selected.iconSize ?? 40}
                      onChange={(e) =>
                        updateSelected({
                          iconSize: Math.max(
                            12,
                            Math.min(160, parseInt(e.target.value, 10) || 40)
                          ),
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div className={styles.coords}>
                <div>
                  <label>Yaw°</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selected.yaw}
                    onChange={(e) =>
                      updateSelected({ yaw: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label>Pitch°</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selected.pitch}
                    onChange={(e) =>
                      updateSelected({
                        pitch: Math.max(
                          -89,
                          Math.min(89, parseFloat(e.target.value) || 0)
                        ),
                      })
                    }
                  />
                </div>
              </div>

              <button className={styles.del} onClick={deleteSelected}>
                Delete hotspot
              </button>
            </div>
            )}
            </>
          )}
        </aside>
      </main>

      <input
        ref={fileImgRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onImageChosen}
      />
      <input
        ref={iconFileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onIconChosen}
      />
    </div>
  );
}

/**
 * A self-contained equirectangular calibration grid drawn on a canvas — the
 * fallback texture if an image URL can't be loaded.
 */
function buildTestPanorama(): THREE.CanvasTexture {
  const w = 4096;
  const h = 2048;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#10243b");
  g.addColorStop(0.48, "#3b6ea5");
  g.addColorStop(0.5, "#cfe3f2");
  g.addColorStop(0.52, "#5a4632");
  g.addColorStop(1, "#1c140d");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "rgba(255,255,255,.18)";
  x.lineWidth = 2;
  for (let i = 0; i <= 12; i++) {
    const px = (i / 12) * w;
    x.beginPath();
    x.moveTo(px, 0);
    x.lineTo(px, h);
    x.stroke();
  }
  for (let j = 0; j <= 12; j++) {
    const py = (j / 12) * h;
    x.beginPath();
    x.moveTo(0, py);
    x.lineTo(w, py);
    x.stroke();
  }
  x.strokeStyle = "rgba(255,255,255,.5)";
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(0, h / 2);
  x.lineTo(w, h / 2);
  x.stroke();
  x.fillStyle = "#fff";
  x.font = "bold 130px sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  const card: [string, number][] = [
    ["N", 0.5],
    ["E", 0.75],
    ["S", 1.0],
    ["W", 0.25],
  ];
  for (const [t, u] of card) x.fillText(t, u * w, h / 2 - 110);
  x.font = "600 46px ui-monospace,monospace";
  x.fillStyle = "rgba(255,255,255,.7)";
  for (let i = 0; i < 12; i++) {
    x.fillText(i * 30 + "°", (i / 12) * w + 90, h / 2 + 70);
  }
  return new THREE.CanvasTexture(c);
}

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
