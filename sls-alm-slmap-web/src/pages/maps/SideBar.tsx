import type { LocationsResponse } from '@/services/location.service';
import { useState } from 'react';
// import { ControlPanel } from './panel/ControlPanel';
import { SearchPanel } from './panel/SearchPanel';
import { SearchResult } from './panel/SearchResult';

export const SideBar = () => {
  const [searchResults, setSearchResults] = useState<LocationsResponse>({
    data: { search: [], poi: [] },
    total: 0,
  });

  // const onLocationSelect = (locationId: string) => {
  //   // Handle location selection, e.g., fetch location details or update the map view
  //   console.log('Selected location ID:', locationId);
  // };

  const handleResult = (result: LocationsResponse | null) => {
    if (result) {
      setSearchResults(result);
    }
  };

  return (
    <>
      <SearchPanel onSearchResults={handleResult} closeFilterPanel={() => {}} />
      <SearchResult
        locations={searchResults}
        isLoading={false}
        onLocationSelect={() => {}}
      />
      {/*<ControlPanel
      locationData={location || null}
      selectInfoPanelComponent={selectInfoPanelComponent}
      />*/}
    </>
  );
};
