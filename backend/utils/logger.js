// utils/logger.js

/**
 * Simple Winston logger with console and rotating file transports.
 * Logs structured JSON for easy ingestion.
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, printf, colorize } = format;
const path = require('path');

const logDir = path.join(__dirname, 'logs');

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), printf(({ level, message, timestamp, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
      })),
    }),
    new transports.File({
      filename: path.join(logDir, 'app-%DATE%.log'),
      // Use daily rotate via winston-daily-rotate-file if installed; fallback to simple file.
      maxsize: 5 * 1024 * 1024, // 5MB per file
      maxFiles: '14d',
    }),
  ],
});

module.exports = logger;
