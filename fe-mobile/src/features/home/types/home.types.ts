export interface HomeStats {
  livesTouchedToday: number;
  volunteersOnline: number;
}

export interface NearbyVolunteer {
  id: string;
  name: string;
  accent: string;
}

export interface ImpactPreview {
  id: string;
  emoji: string;
  soft: string;
}

export interface HomeData {
  stats: HomeStats;
  volunteers: NearbyVolunteer[];
  volunteersExtra: number;
  nearbyRadiusKm: number;
  impact: ImpactPreview[];
}
