import fs from "node:fs";
import path from "node:path";

import pino from "pino";
import { createStream } from "rotating-file-stream";

import { config } from "../config";

const logDirectory = "/var/log/makyn";

function ensureLogDirectory(): void {
  try {
    fs.mkdirSync(logDirectory, { recursive: true });
  } catch {
    // Directory creation may fail during local development without elevated permissions.
  }
}

ensureLogDirectory();

function buildRotatingStream(filename: string) {
  return createStream(filename, {
    interval: "1d",
    path: logDirectory,
    maxFiles: 30
  });
}

const streams = [
  { stream: process.stdout },
  { stream: buildRotatingStream("app.log") }
];

export const logger = pino(
  {
    level: config.LOG_LEVEL,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime
  },
  pino.multistream(streams)
);

