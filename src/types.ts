export type CanvasColor = string;

export type NodeType = 'text' | 'file' | 'link' | 'group';

export type NodeSide = 'top' | 'right' | 'bottom' | 'left';

export type EdgeEnd = 'none' | 'arrow';

export type BackgroundStyle = 'cover' | 'ratio' | 'repeat';

export interface CanvasNodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: CanvasColor;
}

export interface CanvasTextData extends CanvasNodeData {
  type: 'text';
  text: string;
}

export interface CanvasFileData extends CanvasNodeData {
  type: 'file';
  file: string;
  subpath?: string;
  fileContent?: string;
  imageUrl?: string;
  isImage?: boolean;
  isVideo?: boolean;
  isAudio?: boolean;
  isPdf?: boolean;
  isError?: boolean;
}

export interface CanvasLinkData extends CanvasNodeData {
  type: 'link';
  url: string;
}

export interface CanvasGroupData extends CanvasNodeData {
  type: 'group';
  label?: string;
  background?: string;
  backgroundStyle?: BackgroundStyle;
}

export type CanvasNode = CanvasTextData | CanvasFileData | CanvasLinkData | CanvasGroupData;

export interface CanvasEdgeData {
  id: string;
  fromNode: string;
  fromSide?: NodeSide;
  fromEnd?: EdgeEnd;
  toNode: string;
  toSide?: NodeSide;
  toEnd?: EdgeEnd;
  color?: CanvasColor;
  label?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdgeData[];
}

export interface CanvasPluginOptions {
  vaultRoot?: string;
  routePrefix?: string;
  include?: string[];
  exclude?: string[];
  fileRoutePrefix?: string;
  linkPreview?: boolean;
}
