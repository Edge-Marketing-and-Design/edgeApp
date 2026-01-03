export type EdgeModuleDependencies =
  | Array<EdgeModuleDependency | string>
  | {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

export interface EdgeModuleDependency {
  name: string;
  version?: string;
  dev?: boolean;
}

export interface EdgeModuleTemplate {
  from: string;
  to: string;
  overwrite?: boolean;
}

export type EdgeModulePatch = EdgeModuleJsonMergePatch | EdgeModuleMarkerInsertPatch;

export interface EdgeModuleJsonMergePatch {
  type: "json-merge";
  target: string;
  merge: Record<string, unknown>;
  createIfMissing?: boolean;
}

export interface EdgeModuleMarkerInsertPatch {
  type: "marker-insert";
  target: string;
  marker: string;
  content?: string;
  source?: string;
  insertPosition?: "before" | "after";
  startMarker?: string;
  endMarker?: string;
}

export interface EdgeModuleManifest {
  id: string;
  version: string;
  description?: string;
  dependencies?: EdgeModuleDependencies;
  templates?: EdgeModuleTemplate[];
  files?: EdgeModuleTemplate[];
  patches?: EdgeModulePatch[];
  runtime?: {
    entry: string;
    target: string;
    export?: string;
  };
  receipt?: {
    path?: string;
  };
}
