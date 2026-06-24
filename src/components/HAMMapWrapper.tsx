'use client';

import { Map, MapControls, MapMarker, MarkerContent } from './ui/map';

export default function HAMMapWrapper() {
  return (
    <Map center={[106.788556, -6.375833]} zoom={15} className="h-full w-full text-[#0c0a08]">
      <MapControls />
      <MapMarker longitude={106.788556} latitude={-6.375833}>
        <MarkerContent>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-[#0c0a08] text-[16px] shadow-lg">
            🏟️
          </div>
        </MarkerContent>
      </MapMarker>
    </Map>
  );
}
