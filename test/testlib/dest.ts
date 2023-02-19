import {
    IJLogEntry, ISimpleJsonOutput,
    SimpleTextDestination, SimpleJsonDestination
} from "@fp8proj";

export let logCollector: string[] = [];

export function clearLogCollector(): void {
    logCollector = []
}

export class TestSimpleTextDestination extends SimpleTextDestination {
    override write(entry: IJLogEntry): void {
        const result = this.formatOutput(entry);
        console.log(result);

        // Delete the timestamp from collected log as it can't be tested
        const splitAt = result.indexOf('|');
        if (splitAt) {
            logCollector.push(result.substring(splitAt));
        } else {
            logCollector.push(result);
        }
    }
}

export class TestSimpleJsonDestination extends SimpleJsonDestination {
    override write(entry: IJLogEntry): void {
        const result = this.formatOutput(entry);
        console.log(JSON.stringify(result));

        // Delete the timestamp from collected log as it can't be tested
        const collect: Omit<ISimpleJsonOutput, 't'> = result;
        delete collect.t;
        logCollector.push(JSON.stringify(collect));
    }
}
