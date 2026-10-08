export declare function attachGlassRange(root: HTMLElement, options?: {
  refresh?: () => void;
  onInput?: (value: string) => void;
}): {update(): void; destroy(): void};
