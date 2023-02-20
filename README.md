# jlog-facade

This is a simple logger façade that focusing on creating a JSON output for typescript projects.

## Usage

A [LoggerFactory](https://fp8.github.io/jlog-facade/classes/LoggerFactory.html) is used to create a new instance of a [JLogger](https://fp8.github.io/jlog-facade/classes/JLogger.html) which doesn't output any log until a log destination is set:

```ts
const logger = LoggerFactory.create('my-logger');

// or alternatively
const logger = LoggerFactory.getLogger('my-logger');
```

Note that `.getLogger` was created for compatibility with other logger classes but it is not strictly correct.  Every call to `.getLogger` will create a new instance of [JLogger](https://fp8.github.io/jlog-facade/classes/JLogger.html).  

To write a log entry, it works like any other logger:

```ts
logger.debug('This is a debug message');
logger.info(`Process started at port $PORT`);
logger.error('Failed to processing incoming request', err);
```

### Install

```
npm i jlog-facade
```

### Creating JSON Entry

To facilitate generation of JSON output, [JLogger](https://fp8.github.io/jlog-facade/classes/JLogger.html) accept [IJson](https://fp8.github.io/jlog-facade/interfaces/IJson.html) as additional attributes to be added to the output:

```ts
logger.info('The process has started', {processId: 123456});
```

#### AbstractLoggable and AbstractKeyValue

Logger methods also accept an [AbstractLoggable](https://fp8.github.io/jlog-facade/classes/AbstractLoggable.html) which exposes `.toJson` method allowing any custom object to be written to the log.  All the entries are merged before the log and by default, duplicated keys are resolved by first key having priority over any subsquent keys.

[AbstractKeyValue](https://fp8.github.io/jlog-facade/classes/AbstractKeyValue.html) is an implementation of [AbstractLoggable](https://fp8.github.io/jlog-facade/classes/AbstractLoggable.html) creates a simple key/value pair object where value can be another instance of [AbstractLoggable](https://fp8.github.io/jlog-facade/classes/AbstractLoggable.html).  A sample implementation is [KV](https://fp8.github.io/jlog-facade/classes/KV.html):

```ts
logger.info('The process has started', new KV('processId', 123456), new KV('processId', 888));
```

The value of the `processId` key in above example is `123456` as it's the first value set.

#### Label

Another built-in [AbstractLoggable](https://fp8.github.io/jlog-facade/classes/AbstractLoggable.html) is [Label](https://fp8.github.io/jlog-facade/classes/Label.html) that allow caller to pass a key and one or more values.  Please note that value of the [Label](https://fp8.github.io/jlog-facade/classes/Label.html) is always a list, even if only one value is passed to the constructor.  The duplicate keys of [Label](https://fp8.github.io/jlog-facade/classes/Label.html) passed are merged instead of overwriten:

```ts
logger.info('The process has started', new Label('processId', 123456), new Label('processId', 888));
```

The value of the `processId` key in above example is `[123456, 888]`.

### Log Destination

2 simple destination is available in this package:

1. [SimpleJsonDestination](https://fp8.github.io/jlog-facade/classes/SimpleJsonDestination.html)
1. [SimpleTextDestination](https://fp8.github.io/jlog-facade/classes/SimpleTextDestination.html)

The class above serve mostly for debug or test purposes.  It is expected that a separate platform specific destination is used in an actual project.  A log destination really is just a formatter for a [IJLogEntry](https://fp8.github.io/jlog-facade/interfaces/IJLogEntry.html) and [LoggerFactory](https://fp8.github.io/jlog-facade/classes/LoggerFactory.html) accepts 3 type of log destination:

1. A synchronous class that extends [AbstractLogDestination](https://fp8.github.io/jlog-facade/classes/AbstractLogDestination.html)
1. An asynchronous class that extends [AbstractAsyncLogDestination](https://fp8.github.io/jlog-facade/classes/AbstractAsyncLogDestination.html)
1. An instance of [Writable](https://nodejs.org/api/stream.html#class-streamwritable) stream

If one must ensure that last async log has been written, the following promise can be used: 

```ts
await logger.logWritten();
```

#### Usage

At starting point of your application, add desire destinations using A [LoggerFactory](https://fp8.github.io/jlog-facade/classes/LoggerFactory.html):

```ts
SimpleJsonDestination.use();

// or

LoggerFactory.addLogDestination(new SimpleJsonDestination());
```

## Documentation

* [jlog-facade](https://fp8.github.io/jlog-facade/)


#### Configuration

A `logger.json` can be placed under `./etc/${FP8_ENV}/logger.json` or `./config/${FP8_ENV}/logger.json` with the following content:

```json
{
  // This is default logger level
  "severity": "info",

  // This overrides the log level for a specific loggerName
  "logger": {
    "my-logger": "debug"
  },

  // This overrides the logger name filter for a destination
  "destination": {
    "TestSimpleTextDestination": {
      "severity": "warn",
      "filters": ["test-zEd7efJ0Pr"]
    }
  }
}
```

The configuration set in `logger.json` override what's done in code.  The next level of setting is using destination:

```typescript
// Only write .warn logs
SimpleJsonDestination.use(LogLevel.WARNING);

// Only output log if logger is 'my-logger-A' or 'logger-B'
SimpleJsonDestination.use('my-logger-A', 'logger-B');

// Only output log if logger is 'my-logger' and if level is ERROR or above
SimpleJsonDestination.use(LogLevel.ERROR, 'my-logger');
```

The level can also be set by upon logger creation but this is not recommended as it should really be set in the `logger.json` or in a destination.

```typescript
const logger = LoggerFactory.create('my-logger', LogLevel.ERROR);
```

## Why Another Facade?

Working with project in both Kotlin and Typescript, I have come to miss the abstraction allowed by [slf4j](https://www.slf4j.org/) in the JVM world.  Another challenge I face is the need to produce a JSON based output for cloud service provider.

The problem above is simple to address on a project by project basis but it becomes an complicated mess when trying to create reusable components.

The objectives of `jlog-facade` are therefore:

1. A focus on creating a JSON log without requiring all log entry to be a JSON
1. A simple way to create a log destination without need to change the core library
1. Typescript centric implementation
