export type Language = 'python' | 'r';

export interface ConsoleOutput {
  type: 'input' | 'stdout' | 'stderr' | 'system';
  message: string;
  id: number;
}

export interface PythonEnvironment {
    [key: string]: {
        type: string;
        repr: string;
        is_dataframe: boolean;
        is_figure: boolean;
    };
}

export interface TableData {
    name: string;
    columns: string[];
    data: Record<string, any>[];
}

export interface PlotData {
    id: string;
    dataUrl: string;
}

// For R
export interface Environment {
    [key: string]: {
        objectType: 'function' | 'variable';
        class: string[];
        str: string;
    };
}