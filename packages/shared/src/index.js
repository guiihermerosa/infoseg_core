"use strict";
/**
 * @infoseg/shared
 * Tipos, DTOs, enums e constantes compartilhados entre apps do INFOSEG CORE.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOM_CONCIERGE = exports.ROOM_RESIDENT = exports.WS_ROOMS = exports.WS_EVENTS = void 0;
// Enums
__exportStar(require("./enums"), exports);
// DTOs
__exportStar(require("./dto"), exports);
// Events
var events_1 = require("./events");
Object.defineProperty(exports, "WS_EVENTS", { enumerable: true, get: function () { return events_1.WS_EVENTS; } });
Object.defineProperty(exports, "WS_ROOMS", { enumerable: true, get: function () { return events_1.WS_ROOMS; } });
Object.defineProperty(exports, "ROOM_RESIDENT", { enumerable: true, get: function () { return events_1.ROOM_RESIDENT; } });
Object.defineProperty(exports, "ROOM_CONCIERGE", { enumerable: true, get: function () { return events_1.ROOM_CONCIERGE; } });
// Constants
__exportStar(require("./constants"), exports);
//# sourceMappingURL=index.js.map