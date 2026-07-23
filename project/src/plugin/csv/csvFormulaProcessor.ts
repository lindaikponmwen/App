// src/plugin/csv/csvFormulaProcessor.ts

const colLetterToNum = (col: string): number => {
    let num = 0;
    for (let i = 0; i < col.length; i++) {
        num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num - 1;
};

export const cellToCoords = (cellRef: string): { row: number; col: number } | null => {
    const match = cellRef.match(/^([A-Z]+)(\d+)$/i);
    if (!match) return null;
    const col = colLetterToNum(match[1].toUpperCase());
    const row = parseInt(match[2], 10) - 1;
    if (row < 0 || col < 0) return null;
    return { row, col };
};

export class FormulaEvaluator {
    private getCellValue: (row: number, col: number) => string | number;
    private callStack: Set<string> = new Set();

    constructor(getCellValue: (row: number, col: number) => string | number) {
        this.getCellValue = getCellValue;
    }

    evaluate(expression: string, currentCellKey: string): string | number {
        if (this.callStack.has(currentCellKey)) {
            return '#CIRC!';
        }
        this.callStack.add(currentCellKey);

        let result: string | number;
        try {
            const funcMatch = expression.match(/^([A-Z]+)\((.*)\)$/i);
            if (funcMatch) {
                const funcName = funcMatch[1].toUpperCase();
                const argsStr = funcMatch[2];
                result = this.evaluateFunction(funcName, argsStr);
            } else {
                result = this.evaluateArithmetic(expression);
            }
        } catch (e) {
            result = '#ERROR!';
        }
        
        this.callStack.delete(currentCellKey);
        return result;
    }

    private resolveToken(token: string): string | number {
        token = token.trim();
        if (token === '') return 0;
        if (!isNaN(Number(token))) return Number(token);

        const coords = cellToCoords(token);
        if (coords) {
            const val = this.getCellValue(coords.row, coords.col);
            if (typeof val === 'string' && val.startsWith('#')) return val;
            return isNaN(Number(val)) ? 0 : Number(val);
        }

        return '#REF!';
    }
    
    private evaluateArithmetic(expression: string): string | number {
        // This is a simple left-to-right evaluator without operator precedence.
        const tokens = expression.split(/([+\-*/])/).map(t => t.trim()).filter(t => t);
        if (tokens.length === 0) return 0;
        if (tokens.length === 1) return this.resolveToken(tokens[0]);

        let result = this.resolveToken(tokens[0]);
        if (typeof result === 'string') return result;

        for (let i = 1; i < tokens.length; i += 2) {
            const operator = tokens[i];
            const nextToken = tokens[i + 1];
            if (!nextToken) return '#ERROR!';
            
            const nextValue = this.resolveToken(nextToken);
            if (typeof nextValue === 'string') return nextValue;
            
            switch (operator) {
                case '+': result += nextValue; break;
                case '-': result -= nextValue; break;
                case '*': result *= nextValue; break;
                case '/':
                    if (nextValue === 0) return '#DIV/0!';
                    result /= nextValue;
                    break;
                default: return '#ERROR!';
            }
        }
        return result;
    }

    private evaluateFunction(funcName: string, argsStr: string): string | number {
        const rawArgs = this.parseArgs(argsStr).flat();
        const numbers = rawArgs.map(val => {
            const num = Number(val);
            return isNaN(num) ? null : num;
        }).filter(n => n !== null) as number[];

        if (numbers.length === 0 && !['COUNT', 'COUNTA'].includes(funcName)) return 0;

        switch (funcName) {
            case 'SUM':
                return numbers.reduce((acc, val) => acc + val, 0);
            case 'AVERAGE':
            case 'MEAN':
                return numbers.length > 0 ? numbers.reduce((acc, val) => acc + val, 0) / numbers.length : '#DIV/0!';
            case 'COUNT':
                return numbers.length;
            case 'COUNTA':
                return rawArgs.filter(v => v !== null && v !== undefined && v !== '').length;
            case 'MEDIAN':
                if (numbers.length === 0) return '#NUM!';
                const sorted = [...numbers].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
            case 'STDEV':
                if (numbers.length < 2) return '#DIV/0!';
                const mean = numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
                const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (numbers.length - 1);
                return Math.sqrt(variance);
            case 'MIN':
                return Math.min(...numbers);
            case 'MAX':
                return Math.max(...numbers);
            default:
                return '#NAME?';
        }
    }

    private parseArgs(argsStr: string): (string | number | (string | number)[])[] {
        const argParts = argsStr.split(',');
        return argParts.map(part => {
            part = part.trim();
            const rangeMatch = part.match(/^([A-Z]+\d+):([A-Z]+\d+)$/i);
            if (rangeMatch) {
                return this.getRangeValues(rangeMatch[1], rangeMatch[2]);
            }
            const cellMatch = part.match(/^[A-Z]+\d+$/i);
            if (cellMatch) {
                const coords = cellToCoords(part);
                if (coords) return this.getCellValue(coords.row, coords.col);
            }
            if (part.trim() !== '' && !isNaN(Number(part))) return Number(part);

            return part; // Return as string if it's not a number or valid ref
        });
    }

    private getRangeValues(startRef: string, endRef: string): (string | number)[] {
        const start = cellToCoords(startRef);
        const end = cellToCoords(endRef);
        if (!start || !end) return ['#REF!'];

        const values: (string | number)[] = [];
        const r1 = Math.min(start.row, end.row);
        const r2 = Math.max(start.row, end.row);
        const c1 = Math.min(start.col, end.col);
        const c2 = Math.max(start.col, end.col);

        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                values.push(this.getCellValue(r, c));
            }
        }
        return values;
    }
}