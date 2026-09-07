import type { Metadata } from "next";
import TourViewer from "@/components/viewer/TourViewer";
import type { Tour } from "@/lib/types";

export const metadata: Metadata = {
  title: "Cedar House — Interactive Demo",
  description: "A sample real-estate experience built with 360Vision.",
};

const floorId = "ground";
const scenes: Tour["scenes"] = [
  {
    id: "living", name: "Grand Living Room", floorId,
    image: { url: "/demo/villa-living-room.png", width: 1776, height: 887, projection: "equirectangular", thumbnailUrl: "/demo/villa-living-room.png" },
    initialYaw: 0, initialPitch: 0, initialFov: 72,
    hotspots: [
      { id: "to-kitchen", type: "scene", label: "Kitchen & Dining", content: "Continue into the kitchen", yaw: -35, pitch: -7, targetSceneId: "kitchen", icon: "door" },
      { id: "fireplace", type: "info", label: "Natural stone fireplace", content: "A floor-to-ceiling stone hearth anchors the main entertaining space.", yaw: 48, pitch: 2, icon: "info" },
    ],
  },
  {
    id: "kitchen", name: "Kitchen & Dining", floorId,
    image: { url: "/demo/villa-kitchen.png", width: 1776, height: 887, projection: "equirectangular", thumbnailUrl: "/demo/villa-kitchen.png" },
    initialYaw: 0, initialPitch: 0, initialFov: 72,
    hotspots: [{ id: "to-living", type: "scene", label: "Grand Living Room", content: "Return to the living room", yaw: 58, pitch: -6, targetSceneId: "living", icon: "door" }],
  },
  {
    id: "bedroom", name: "Primary Suite", floorId,
    image: { url: "/demo/villa-bedroom.png", width: 1776, height: 887, projection: "equirectangular", thumbnailUrl: "/demo/villa-bedroom.png" },
    initialYaw: 15, initialPitch: 0, initialFov: 72,
    hotspots: [{ id: "suite-info", type: "info", label: "Private suite", content: "Garden views, a private lounge and direct access to the dressing room.", yaw: 8, pitch: 1, icon: "info" }],
  },
];

const demoTour: Tour = {
  id: "cedar-house-demo",
  title: "Cedar House",
  description: "Contemporary villa · 4 bedrooms · 5 bathrooms",
  visibility: "public",
  startSceneId: "living",
  scenes,
  floorPlan: {
    enabled: true,
    floors: [{
      id: floorId,
      name: "Ground floor",
      imageUrl: "/demo/villa-floor-plan.svg",
      points: [
        { id: "point-living", sceneId: "living", label: "Grand Living Room", x: 76, y: 35 },
        { id: "point-kitchen", sceneId: "kitchen", label: "Kitchen & Dining", x: 25, y: 34 },
        { id: "point-bedroom", sceneId: "bedroom", label: "Primary Suite", x: 45, y: 70 },
      ],
    }],
  },
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
};

export default function DemoPage() {
  return <main style={{ width: "100%", height: "100vh" }}><TourViewer tour={demoTour} /></main>;
}
