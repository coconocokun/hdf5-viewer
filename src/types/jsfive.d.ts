// src/types/jsfive.d.ts
declare module "jsfive" {
  export class File {
    constructor(buffer: ArrayBuffer, filename: string);
    keys: string[];
    get(name: string): any;
    attrs: Record<string, any>;
  }

  export class Group {
    keys: string[];
    get(name: string): any;
    attrs: Record<string, any>;
  }

  export class Dataset {
    value: any;
    dtype: any;
    shape: number[];
    attrs: Record<string, any>;
  }
}
