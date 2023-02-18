import {
    IJLogEntry, KV, LoggerFactory,
    ISimpleJsonOutput, SimpleTextDestination, SimpleJsonDestination, LogLevel
} from "@fp8proj";
import { expect } from "chai";

let logCollector: string[] = [];
class TestSimpleTextDestination extends SimpleTextDestination {
    override _write(entry: IJLogEntry): void {
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


describe('dest-filter', () => {
    const loggerA = LoggerFactory.create('loggerA');
    const loggerB = LoggerFactory.create('loggerB');
    const loggerC = LoggerFactory.create('loggerB.extended');



});