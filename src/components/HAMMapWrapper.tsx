'use client';

import { Map, MapControls, MapMarker, MarkerContent } from './ui/map';

export default function HAMMapWrapper() {
  return (
    <Map center={[112.4414, -7.2185]} zoom={15} className="h-full w-full text-[#0c0a08]">
      <MapControls />
      <MapMarker longitude={112.4414} latitude={-7.2185}>
        <MarkerContent>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-[#0c0a08] text-[16px] shadow-lg">
            🏟️
          </div>
        </MarkerContent>
      </MapMarker>
    </Map>
  );
}
