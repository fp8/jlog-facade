import { LogLevel, LoggerFactory } from "@fp8proj";

import { SimpleTextDestination, SimpleJsonDestination } from "@fp8proj/dest";

import { LogWriter } from "@fp8proj/writer";

import {
  expect,
  logEntryInterceptor,
  entryCollector,
  clearEntryCollector,
} from "./testlib";

describe("logger-simple", () => {
  const writer = LogWriter.getInstance();
  const logger = LoggerFactory.create("logger-Lq0KwjXKBr");

  beforeEach(() => {
    LoggerFactory.clearLogDestination();
    clearEntryCollector();
  });

  it("SimpleTextDestination - no config", () => {
    SimpleTextDestination.use(LogLevel.OFF).setLogInterceptor(
      logEntryInterceptor,
    );
    logger.info("info dfqET5Igee");
    expect(entryCollector.length).to.eql(0);
  });

  it("SimpleTextDestination - text-on", () => {
    SimpleTextDestination.use(LogLevel.OFF).setLogInterceptor(
      logEntryInterceptor,
    );
    writer._reloadConfig("text-on");
    logger.info("info eTBmqp3q6U");
    expect(entryCollector.length).to.eql(1);
    expect(entryCollector[0].message).to.eql("info eTBmqp3q6U");
  });

  it("SimpleJsonDestination - json-on info", () => {
    SimpleJsonDestination.use(LogLevel.OFF).setLogInterceptor(
      logEntryInterceptor,
    );
    writer._reloadConfig("json-on");
    logger.info("info SYumRXjrLy");
    expect(entryCollector.length).to.eql(0);
  });

  it("SimpleJsonDestination - json-on error", () => {
    SimpleJsonDestination.use(LogLevel.OFF).setLogInterceptor(
      logEntryInterceptor,
    );
    writer._reloadConfig("json-on");
    logger.error("error gxyFoQFCO0");
    console.log(entryCollector);

    expect(entryCollector.length).to.eql(1);
    expect(entryCollector[0].message).to.eql("error gxyFoQFCO0");
  });
});
