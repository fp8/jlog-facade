import * as fs from "fs";
import * as nodePath from "path";

import {
  IJson,
  TJsonValue,
  LogLevel,
  IJLogEntry,
  DEFAULT_LOG_LEVEL,
  convertSeverityToLevel,
  loadJsonFile,
} from "./core";

import { isArray, isObject, localDebug } from "./helper";

interface IDestinationOverride {
  level?: LogLevel;
  filters?: string[];
}

type TConfigLoggerOverride = { [loggerName: string]: LogLevel };
type TConfigDestinationOverride = {
  [destinationName: string]: IDestinationOverride;
};

export interface IisWriteNeededParams {
  loggerLevel?: LogLevel;

  destinationName: string;
  destinationLevel?: LogLevel;
  destinationFilters?: string[];
}

/**
 * Logger configuration generated from a logger.json file.  The expected `logger.json` is:
 *
 * ```json
 * {
 *   // This is default logger level
 *   "severity": "info",
 *
 *   // This overrides the log level for a specific loggerName
 *   "logger": {
 *     "my-logger": "debug"
 *   },
 *
 *   // This overrides the logger name filter for a destination
 *   "destination": {
 *     "TestSimpleTextDestination": {
 *       "severity": "warn",
 *       "filters": ["test-zEd7efJ0Pr"]
 *     }
 *   }
 * }
 * ```
 */
export class LoggerConfig {
  #config: IJson; // Private field

  level: LogLevel = DEFAULT_LOG_LEVEL;
  loggerOverride: TConfigLoggerOverride = {};
  destinationOverride: TConfigDestinationOverride = {};
  defaultPayload: IJson | undefined;

  constructor(
    input?: IJson,
    public readonly configDir?: string,
  ) {
    if (isObject(input)) {
      this.level = this.parseSeverity(input.severity) ?? DEFAULT_LOG_LEVEL;
      this.loggerOverride = this.parseLoggerOverride(input.logger);
      this.destinationOverride = this.parseDestination(input.destination);
      this.defaultPayload = this.parseDefaultPayload(input.defaultPayload);
      this.#config = input;
    } else {
      this.level = DEFAULT_LOG_LEVEL;
      this.#config = {};
    }
    localDebug(`LoggerConfig loaded with configDir ${configDir}`);
    localDebug(
      `LoggerConfig loaded with loggerOverride ${this.loggerOverride}`,
    );
    localDebug(
      `LoggerConfig loaded with destinationOverride ${this.destinationOverride}`,
    );
  }

  /**
   * Implement logs needed to return level and filters
   * @param entry
   * @param params
   * @returns
   */
  private getLevelAndFilter(
    entry: IJLogEntry,
    params: IisWriteNeededParams,
  ): { level: LogLevel; filters: string[] } {
    let level: LogLevel | undefined = undefined;
    let filters: string[] | undefined = undefined;

    // Process logger level info
    if (params.loggerLevel) {
      level = params.loggerLevel;
    }

    // Process destination level info, override level set by logger
    if (params.destinationLevel) {
      level = params.destinationLevel;
    }

    // Process destination level info, override level set by logger
    if (params.destinationFilters?.length) {
      filters = params.destinationFilters;
    }

    // Process config level info.  Override level from loggerOverride
    if (entry.name in this.loggerOverride) {
      level = this.loggerOverride[entry.name];
    }

    // Process config level info.  Override level and filters from destinationOverrde
    if (params.destinationName in this.destinationOverride) {
      const destinationConfig =
        this.destinationOverride[params.destinationName];

      if (destinationConfig.level) {
        level = destinationConfig.level;
      }

      if (destinationConfig.filters) {
        filters = destinationConfig.filters;
      }
    }

    // Process config level.  Only set root level from root if level is not yet set
    if (level === undefined) {
      level = this.level;
    }

    if (filters === undefined) {
      filters = [];
    }

    localDebug(`LoggerConfig.getLevelAndFilter level ${level}`);
    localDebug(`LoggerConfig.getLevelAndFilter filters ${filters}`);

    // result
    return { level, filters };
  }

  /**
   * Parse .severity as a string from config read as IJson
   *
   * @param configSeverity
   * @returns LogLevel or default to undefined
   */
  private parseSeverity(
    configSeverity: TJsonValue | TJsonValue[],
  ): LogLevel | undefined {
    let level: LogLevel | undefined;

    if (typeof configSeverity === "string") {
      level = convertSeverityToLevel(configSeverity);
    }

    return level;
  }

  /**
   * Parse .filters as an array of string or string from config read as IJson
   *
   * @param configFilters
   * @returns array of string or default to empty array
   */
  private parseFilter(configFilters: TJsonValue | TJsonValue[]): string[] {
    const filters: string[] = [];

    if (isArray(configFilters)) {
      configFilters.forEach((entry) => {
        if (typeof entry === "string") {
          filters.push(entry);
        }
      });
    } else if (typeof configFilters === "string") {
      filters.push(configFilters);
    }

    return filters;
  }

  /**
   * Parse .logger as an Record<string, string> from config read as IJson
   *
   * @param configFilters
   * @returns
   */
  private parseLoggerOverride(
    configSeverity: TJsonValue | TJsonValue[],
  ): TConfigLoggerOverride {
    const loggerOverride: TConfigLoggerOverride = {};

    // Extract .logger
    if (isObject(configSeverity)) {
      for (const [loggerName, severity] of Object.entries(configSeverity)) {
        const level = this.parseSeverity(severity);
        // Don't set the loggerOverride if level is undefined
        if (level !== undefined) {
          loggerOverride[loggerName] = level;
        } else {
          localDebug(
            `parseLoggerOverride received an invalid severity of ${severity}.  Skipped override of ${loggerName} loggerName`,
          );
        }
      }
    }

    return loggerOverride;
  }

  /**
   * Parse .destination as an object with {severity, filters} format from config read as IJson
   *
   * @param configFilters
   * @returns instance of IDestinationOverride or undefined
   */
  private parseDestinationDetails(
    configDestinationOverride: TJsonValue | TJsonValue[],
  ): IDestinationOverride | undefined {
    let result: IDestinationOverride | undefined;
    if (isObject(configDestinationOverride)) {
      let destinationFound = false;

      const level = this.parseSeverity(configDestinationOverride.severity);
      if (level !== undefined) {
        destinationFound = true;
      }

      const filters = this.parseFilter(configDestinationOverride.filters);
      if (filters.length) {
        destinationFound = true;
      }

      if (destinationFound) {
        result = { level, filters };
      }
    }

    return result;
  }

  /**
   * Return destination if input passed in an object
   *
   * @param input
   * @returns
   */
  private parseDestination(
    configDestinationOverride: TJsonValue | TJsonValue[],
  ): TConfigDestinationOverride {
    const destinationOverride: TConfigDestinationOverride = {};

    // Extract .destination
    if (isObject(configDestinationOverride)) {
      for (const [destinationName, entry] of Object.entries(
        configDestinationOverride,
      )) {
        const destination = this.parseDestinationDetails(entry);

        if (destination !== undefined) {
          destinationOverride[destinationName] = destination;
        } else {
          // Can't afford to have JSON.stringy to fail here
          try {
            localDebug(
              `parseDestination received an invalid entry of ${JSON.stringify(entry)}.  Skipped override of ${destinationName} destination`,
            );
          } catch (e) {
            localDebug(
              `parseDestination received an invalid entry of ${entry}.  Skipped override of ${destinationName} destination`,
            );
            // do nothing
          }
        }
      }
    }

    return destinationOverride;
  }

  /**
   * Return defaultPayload if input passed is an object
   *
   * @param input
   * @returns
   */
  private parseDefaultPayload(
    input: TJsonValue | TJsonValue[],
  ): IJson | undefined {
    if (input === undefined) {
      return undefined;
    } else if (isObject(input)) {
      return input;
    } else {
      localDebug(() => `Default payload passed is not an object: ${input}`);
      return undefined;
    }
  }

  /**
   * Return if log is needed based on the following precedence:
   *
   * 1. Use info from LogConfig if exists, or
   * 2. Use info from Destination if exists, or
   * 3. Use info from Logger
   *
   * @param input
   */
  public isWriteNeeded(
    entry: IJLogEntry,
    params: IisWriteNeededParams,
  ): boolean {
    localDebug(
      `LoggerConfig.isWriteNeeded with params: ${JSON.stringify(params)}`,
    );
    const { level, filters } = this.getLevelAndFilter(entry, params);

    if (level === LogLevel.OFF) {
      return false;
    }

    // If write is needed based on logger
    let writeNeeded = entry.level >= level;

    // If filter exists, only output if loggerName is provided in filters
    if (writeNeeded && filters.length) {
      let filterMatch = false;
      for (const filter of filters) {
        // console.log(`### isWriteNeeded.match ${entry.name}`, filter);
        if (entry.name.startsWith(filter)) {
          filterMatch = true;
          break;
        }
      }
      // console.log('### isWriteNeeded.filterMatch', filterMatch);
      writeNeeded = filterMatch;
    }

    return writeNeeded;
  }

  /**
   * Return entire content of configuration file loaded
   *
   * @returns
   */
  public get loadedConfig(): IJson {
    return this.#config;
  }
}

/**
 * Find logger from ./etc or ./config directory starting from working directory.  This
 * method optionally accept and env variable that is created for testing purposes.
 *
 * It will check if a sub directory defined in $FP8_ENV environmental variable first under
 * ./etc or ./config
 *
 * @returns
 */
export function readLoggerConfig(env?: string): LoggerConfig {
  // Set paths to find the logger.json file
  const fp8env = env ?? process.env.FP8_ENV ?? "local";
  const paths = [
    `./etc/${fp8env}/logger.json`,
    "./etc/logger.json",
    `./config/${fp8env}/logger.json`,
    "./config/logger.json",
  ];

  // Return first config found from configured paths
  let configDir: string | undefined;
  let config: IJson = {};
  for (const path of paths) {
    localDebug(`Looking for logger.json at ${path}`);
    if (fs.existsSync(path)) {
      const jsonFile = loadJsonFile(path);
      if (jsonFile !== undefined) {
        config = jsonFile;
        configDir = nodePath.dirname(path);
        break;
      }
    }
  }

  // Return
  return new LoggerConfig(config, configDir);
}
