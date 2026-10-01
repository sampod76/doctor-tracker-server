import { IJwtAuthUser } from "./common";
type customData = {
  downloadType: any;
};

export type GeoLocation = {
  range: [number, number];
  country: string;
  region: string;
  city: string;
  ll: [number, number]; // [latitude, longitude]
  metro?: number;
  zip?: string;
};

declare global {
  namespace Express {
    interface Request {
      user: IJwtAuthUser | null;
      clientIp: string | null | undefined;
      requestId: string | null | undefined;
      apiKey: string | null | undefined;
      timeZone: string | null | undefined;
      auditInfo?: {
        ip_address: string;
        user_agent: string;
        geo_location: GeoLocation | null;
      };
      customData: customData | null | undefined;
    }
  }
}
