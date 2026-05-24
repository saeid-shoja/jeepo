declare module 'provinces-and-cities' {
  export type IranProvinceRow = {
    id: number;
    name: string;
    tel_prefix: string;
    cities: string[];
  };

  export const Iran: {
    main: IranProvinceRow[];
    all: IranProvinceRow[];
  };
}
