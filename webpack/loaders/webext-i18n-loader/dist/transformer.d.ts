import { LoaderOptions } from './options';
import ts from 'typescript';
type TransformerOptions = {
    config: LoaderOptions;
};
export declare const transformer: (options: TransformerOptions) => ts.TransformerFactory<ts.SourceFile>;
export {};
