import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { Coords } from "../types";

type Props = {
  coords: Coords;
  onMapClick: (lat: number, lng: number) => void;
};

function Map({ coords, onMapClick }: Props) {
  const { lat, lng } = coords;
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={5}
      className="relative z-0 h-125 w-full"
    >
      <MapController coords={coords} onMapClick={onMapClick} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
        <Popup>
          {lat.toFixed(2)}, {lng.toFixed(2)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}

function MapController({ coords, onMapClick }: Props) {
  const map = useMap();
  const { lat, lng } = coords;
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  useEffect(() => {
    map.setView([lat, lng]);
  }, [map, lat, lng]);

  return null;
}

export default Map;
