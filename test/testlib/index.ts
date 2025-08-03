// tslint:disable-next-line
import "mocha";

import chai = require("chai");
import sinon = require("sinon");
import sinonChai = require("sinon-chai");
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.use(sinonChai);

export const { expect } = chai;
export { sinon, chai };

export * from "./test-dests";
export * from "./test-classes";
