export type GlassSurfaceOptions = {
  enabled?: boolean;
  strength?: number;
  /** Shoulder width multiplier (.75–1.25); approved default: 1.2. */
  edgeWidth?: number;
  /** Default: extended. Standard retains the earlier, narrow shoulder. */
  edgeProfile?: 'standard' | 'extended';
};
export type GlassStatus = { active: number; accessible: boolean; supported: boolean };
export type GlassSceneOptions = {
  stage: HTMLElement;
  source?: HTMLElement;
  themeRoot?: HTMLElement;
  renderBackdrop?: (target: HTMLElement) => void;
  /** Default: true. Diffuse photos and adapt tint to their sampled colors. */
  adaptToPhotos?: boolean;
  onStatus?: (status: GlassStatus) => void;
};
export declare function createGlassScene(options: GlassSceneOptions): {
  add(material: HTMLElement, options?: GlassSurfaceOptions): {
    update(options: GlassSurfaceOptions): void;
    destroy(): void;
  };
  refresh(background?: boolean): void;
  destroy(): void;
};
