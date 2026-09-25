// Shapes of the generated hill data (src/data/hills.json). Kept free of runtime
// imports so the import script can load it under Node's type stripping.

export type ListId =
  | "munros"
  | "wainwrights"
  | "welsh-3000s"
  | "ethels"
  | "yorkshire-three-peaks"
  | "dales-30";

export type Hill = {
  /** The DoBIH hill number — stable across DoBIH releases. */
  id: number;
  name: string;
  metres: number;
  /** Ordnance Survey grid reference, e.g. "NN166712". */
  gridRef: string;
  lat: number;
  lng: number;
  /** DoBIH area (or region where no area is given), e.g. "Lake District - Southern Fells". */
  area: string;
};

export type DataSource = {
  name: string;
  version: string;
  url: string;
  licence: string;
  licenceUrl: string;
};

export type HillData = {
  source: DataSource;
  hills: Hill[];
  /** Each list's members as hill ids. Lists overlap; a hill appears in every list it belongs to. */
  lists: Record<ListId, number[]>;
};
