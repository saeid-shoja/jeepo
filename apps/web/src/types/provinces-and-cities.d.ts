declare module "provinces-and-cities" {
  export interface Province {
    id: number;
    name: string;
    tel_prefix: string;
    cities: string[];
  }

  export const Iran: {
    main: Province[];
  };
}
