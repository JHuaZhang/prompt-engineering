declare module 'mockjs' {
  const Mock: {
    Random: {
      integer(min: number, max: number): number;
      float(min: number, max: number, dmin?: number, dmax?: number): number;
      string(length?: number): string;
      pick<T>(arr: T[]): T;
      datetime(format?: string): string;
      cword(): string;
      cname(): string;
      ctitle(min?: number, max?: number): string;
      [key: string]: unknown;
    };
    mock(template: unknown): unknown;
  };
  export default Mock;
}