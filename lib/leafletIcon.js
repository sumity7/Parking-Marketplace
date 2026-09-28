import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Webpack rewrites Leaflet's default marker image URLs to something that doesn't
// exist in a Next.js build; this re-points them at the bundled, hashed asset URLs.
let patched = false;
export function patchLeafletIcon() {
  if (patched) return;
  patched = true;
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src || markerIcon2x,
    iconUrl: markerIcon.src || markerIcon,
    shadowUrl: markerShadow.src || markerShadow,
  });
}
