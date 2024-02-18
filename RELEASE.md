# jlog-facade Release Note

## 0.9.0 [2024-02-18]

* Added support for log interceptor with `AbstractBaseDestination.setLogInterceptor` and `AbstractBaseDestination.clearLogInterceptor`
* Log destination now must call `AbstractBaseDestination._write` in order for log interceptor to work
* [BREAKING] Renamed `LogWriter.hasDestination` to `LogWriter.hasDestinations`

## 0.8.0 [2023-06-24]

* Added support to pass message as callback for all log methods
* Added support for a `defaultPayload` in `logger.json` where content are added to logger write
* Added `LoggerFactory.loadedConfig` with content of `logger.json`
* [BREAKING] `buildOutputDataForDestination` now accept `defaultPayload` as 3rd param, pushing `values`
  to 4th position.

## 0.7.0 [2023-03-24]

* Added `Loggable` with support for any data type

## 0.6.0 [2023-02-18]

* Added support to set `LogLevel` on logger and desitination
* Added support to set logger name filter on logger destination
* Added support for configuring logger using `logger.json` file
* Added `.getLogger` to `LoggerFactory` as an alias to `.create`
* Added `LogLevel.OFF` to turn off the logger
* Added `.use` to logger destination to internally add itself to `LoggerFactory`
