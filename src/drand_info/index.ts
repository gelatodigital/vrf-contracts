import { ChainInfo } from "drand-client";
import * as _fastnet from "./assets/fastnet.json" assert { type: "json" };
import * as _quicknet from "./assets/quicknet.json" assert { type: "json" };

export const fastnet: ChainInfo = _fastnet.default;
export const quicknet: ChainInfo = _quicknet.default;
