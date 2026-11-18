import type {Caption} from '@remotion/captions';

export declare const rebaseCaptions: (captions: Caption[], startMs: number, endMs: number) => Caption[];
export declare const paginateCaptions: (captions: Caption[]) => Caption[][];
export declare const pageAt: (pages: Caption[][], nowMs: number) => Caption[] | null;
