import type { LoaderContext } from 'webpack';
export type LoaderOptions = {
    expressions: string | RegExp | (RegExp | string)[];
};
export declare const getOptions: (loaderContext: LoaderContext<LoaderOptions>) => LoaderOptions;
