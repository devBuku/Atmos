import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coords } from "../types";

type Props = {
  coords: Coords;
  onMapClick: (lat: number, lng: number) => void;
  locationName?: string;
};

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const createMarkerIcon = () =>
  L.divIcon({
    className: "custom-map-marker",
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" role="img" aria-label="Selected location marker">
        <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-sky-400 opacity-60"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white shadow-md"></span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -14],
  });

function Map({ coords, onMapClick, locationName }: Props) {
  const { lat, lng } = coords;

  const markerIcon = useMemo(() => createMarkerIcon(), []);

  return (
    <div className="relative w-full h-[260px] sm:h-[320px] lg:h-[350px] rounded-xl overflow-hidden shadow-md border border-border/60">
      <MapContainer
        center={[lat, lng]}
        zoom={5}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <MapController coords={coords} onMapClick={onMapClick} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url={TILE_URL}
          maxZoom={19}
        />
        <Marker position={[lat, lng]} icon={markerIcon}>
          <Popup className="custom-leaflet-popup">
            <div className="p-1 text-center font-sans">
              <p className="font-bold text-sm text-zinc-900 mb-0.5">
                {locationName || "Selected Location"}
              </p>
              <p className="text-xs text-zinc-600 font-mono">
                {lat.toFixed(2)}°, {lng.toFixed(2)}°
              </p>
              <p className="text-[10px] text-zinc-500 mt-1 italic">
                Click anywhere to move location
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

function MapController({
  coords,
  onMapClick,
}: {
  coords: Coords;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const { lat, lng } = coords;

  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    const currentCenter = map.getCenter();
    const distance = Math.hypot(
      currentCenter.lat - lat,
      currentCenter.lng - lng,
    );

    if (distance > 0.001) {
      map.flyTo([lat, lng], map.getZoom(), {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [map, lat, lng]);

  return null;
}

export default Map;
