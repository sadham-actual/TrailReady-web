export interface SourceCatalogItem {
  slug: string;
  name: string;
  license: string;
  url?: string;
  attributionText: string;
  attributionRequired: boolean;
  shareAlike: boolean;
  termsNotes?: string;
}

export const SOURCE_CATALOG: Record<string, SourceCatalogItem> = {
  mvum: {
    slug: 'mvum',
    name: 'USFS MVUM',
    license: 'US Government Work',
    url: 'https://www.fs.usda.gov/main/landmanagement/gis',
    attributionText: 'US Forest Service Motor Vehicle Use Map data',
    attributionRequired: true,
    shareAlike: false,
  },
  ndt: {
    slug: 'ndt',
    name: 'USGS National Digital Trails',
    license: 'US Government Work',
    url: 'https://www.usgs.gov',
    attributionText: 'USGS National Digital Trails (supplemental)',
    attributionRequired: true,
    shareAlike: false,
  },
  osm: {
    slug: 'osm',
    name: 'OpenStreetMap',
    license: 'ODbL-1.0',
    url: 'https://www.openstreetmap.org/copyright',
    attributionText: '© OpenStreetMap contributors (ODbL)',
    attributionRequired: true,
    shareAlike: true,
    termsNotes: 'Derived databases may trigger share-alike obligations.',
  },
};
