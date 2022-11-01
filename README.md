# jlog-facade

This is a simple logger façade that focusing on creating a JSON output for typescript projects.

When a `JLogger` is created, it doesn't output any log until a log destination is created.

## Logger

The creation of logger should be done via factory: 

```ts
const logger = LoggerFactory.create('my-logger');
```

An instance of `IJson` or `AbstractLoggable` such as `KV` can be passed to add a key to the log:

```ts
logger.info('The processing has started', new KV('processId', 123456));
```

## Log Destination

There are 3 possible type of log destination:

1. A synchronous class that extends `AbstractLogDestination`
1. An asynchronous class that extends `AbstractAsyncLogDestination`
1. An instance of `Writable` stream

If one must ensure that last async log has been written, the following promise can be used: 

```ts
await logger.waitProcessComplete();
```
