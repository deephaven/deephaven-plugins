// Branded type helpers
declare const __brand: unique symbol;
export type Brand<T extends string, TBase = string> = TBase & {
  readonly [__brand]: T;
};

export type ModuleName = Brand<'ModuleName'>;

export interface PythonModuleSpecData {
  name: string;
  isPackage: boolean;
  origin?: string;
  subModuleSearchLocations?: string[];
}
