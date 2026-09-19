declare module "provinces-and-cities" {
  export type Province = {
    name: string;
    cities: string[];
  };

  export const Iran: {
    main: Province[];
  };
}
