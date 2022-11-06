# jlog-facade

## What?

This is a simple logger façade that focusing on creating a JSON output for typescript projects.

### Logger

A [LoggerFactory](https://fp8.github.io/jlog-facade/classes/LoggerFactory.html) is used to create a new instance of a [JLogger](https://fp8.github.io/jlog-facade/classes/JLogger.html) which doesn't output any log until a log destination is set:

```ts
const logger = LoggerFactory.create('my-logger');
```

To write a log entry, it works like any other logger:

```ts
logger.debug('This is a debug message');
logger.info(`Process started at port $PORT`);
logger.error('Failed to processing incoming request', err);
```

### Creating JSON Entry

[JLogger](https://fp8.github.io/jlog-facade/classes/JLogger.html) accept [IJson](https://fp8.github.io/jlog-facade/interfaces/IJson.html) as additional attribute to be added to the output:

```ts
logger.info('The process has started', {processId: 123456});
```

#### AbstractLoggable and KV

Logger method also accept an [AbstractLoggable](https://fp8.github.io/jlog-facade/classes/AbstractLoggable.html) which exposes `.toJson` method which allow any custom object to be written to the log.  By default, any duplicated keys are resolved by first entry having priority over any subsquent keys.

[KV](https://fp8.github.io/jlog-facade/classes/KV.html) is an implementation of [AbstractLoggable](https://fp8.github.io/jlog-facade/classes/AbstractLoggable.html) that allows creation of simple key/value pair objects to be written to log where value can be another instance of [AbstractLoggable](https://fp8.github.io/jlog-facade/classes/AbstractLoggable.html):

```ts
logger.info('The process has started', new KV('processId', 123456), new KV('processId', 888));
```

The value of the `processId` is `123456` as it's the first value passed.

#### Label

Another built-in [AbstractLoggable](https://fp8.github.io/jlog-facade/classes/AbstractLoggable.html) is [Label](https://fp8.github.io/jlog-facade/classes/Label.html) that allow caller to pass a key and one or more values.  Please note that value of the [Label](https://fp8.github.io/jlog-facade/classes/Label.html) is always a list, even if only one value is passed to constructor.  The duplicate keys of [Label](https://fp8.github.io/jlog-facade/classes/Label.html) passed are merged:

```ts
logger.info('The process has started', new Label('processId', 123456), new Label('processId', 888));
```

The value of the `processId` is `[123456, 888]`.

### Log Destination

There are 3 possible type of log destination:

1. A synchronous class that extends [AbstractLogDestination](https://fp8.github.io/jlog-facade/classes/AbstractLogDestination.html)
1. An asynchronous class that extends [AbstractAsyncLogDestination](https://fp8.github.io/jlog-facade/classes/AbstractAsyncLogDestination.html)
1. An instance of [Writable](https://nodejs.org/api/stream.html#class-streamwritable) stream

If one must ensure that last async log has been written, the following promise can be used: 

```ts
await logger.hasLogCompleted();
```

## Why?

Working with project in both Kotlin and Typescript, I have come to miss the abstraction allowed by [slf4j](https://www.slf4j.org/) in the JVM world.  Another challenge I face is the need to produce a JSON based output for cloud service provider.

The problem above is simple to address on a project by project basis but it becomes an complicated mess when trying to create reusable components.

The objectives of `jlog-facade` are therefore:

1. A focus on creating a JSON log without requiring all log entry to be a JSON
1. A simple way to create a log destination without need to change the core library
1. Typescript centric implementation
