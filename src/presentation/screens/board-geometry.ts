import type { Position } from '../../game/board/board';

export interface BoardGeometry {
  originX: number;
  originY: number;
  size: number;
  inset: number;
  logicalSize: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export function boardSpacing(geometry: BoardGeometry): number {
  const intersections = Math.max(2, geometry.logicalSize);
  return (geometry.size - geometry.inset * 2) / (intersections - 1);
}

export function boardPoint(geometry: BoardGeometry, at: Position): ScreenPoint {
  const spacing = boardSpacing(geometry);
  return {
    x: geometry.originX + geometry.inset + at.col * spacing,
    y: geometry.originY + geometry.inset + at.row * spacing,
  };
}

export function boardLineBounds(geometry: BoardGeometry): { left: number; top: number; right: number; bottom: number } {
  return {
    left: geometry.originX + geometry.inset,
    top: geometry.originY + geometry.inset,
    right: geometry.originX + geometry.size - geometry.inset,
    bottom: geometry.originY + geometry.size - geometry.inset,
  };
}
