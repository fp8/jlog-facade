# jlog-facade Release Note

## 0.7.0 [2023-03-24]

* Added `Loggable` with support for any data type

## 0.6.0 [2023-02-18]

* Added support to set `LogLevel` on logger and desitination
* Added support to set logger name filter on logger destination
* Added support for configuring logger using `logger.json` file
* Added `.getLogger` to `LoggerFactory` as an alias to `.create`
* Added `LogLevel.OFF` to turn off the logger
* Added `.use` to logger destination to internally add itself to `LoggerFactory`
