export type PipelineSceneItem = {label: string; detail?: string; icon?: 'chat' | 'web' | 'people' | 'list' | 'link' | 'check' | 'clock' | 'alert' | 'spark'};
export type PipelineScene = {id: string; type: 'flow' | 'cards' | 'comparison' | 'question'; startMs: number; endMs: number; heading: string; items: PipelineSceneItem[]};

export declare const rebaseScenes: <T extends PipelineScene>(scenes: T[] | undefined, startMs: number, endMs: number, titleMs?: number, minMs?: number) => T[];
