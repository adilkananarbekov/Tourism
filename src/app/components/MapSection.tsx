import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

type MapLocation = {
  name: string;
  lat: number;
  lng: number;
};

const DEFAULT_LAT = Number(import.meta.env.VITE_MAP_DEFAULT_LAT || 42.8746);
const DEFAULT_LNG = Number(import.meta.env.VITE_MAP_DEFAULT_LNG || 74.5698);
const DEFAULT_ZOOM = Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM || 6);

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -32],
});

export function MapSection({
  title,
  locations = [],
}: {
  title: string;
  locations?: MapLocation[];
}) {
  const center = locations.length
    ? [locations[0].lat, locations[0].lng]
    : [DEFAULT_LAT, DEFAULT_LNG];

  return (
    <div className="space-y-3">
      <h3 className="text-2xl text-foreground">Map Preview</h3>
      <p className="text-sm text-muted-foreground">
        Explore the route and key highlights for {title}.
      </p>
      <div className="h-64 w-full overflow-hidden rounded-lg border border-border sm:h-72">
        <MapContainer
          center={center as [number, number]}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.length > 0 ? (
            locations.map((location) => (
              <Marker
                key={`${location.name}-${location.lat}-${location.lng}`}
                position={[location.lat, location.lng]}
                icon={defaultIcon}
              >
                <Popup>{location.name}</Popup>
              </Marker>
            ))
          ) : (
            <Marker position={center as [number, number]} icon={defaultIcon} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
