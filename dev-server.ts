import app from "./api/_src/app.js";
import { logger } from "./api/_src/lib/logger.js";

const port = Number(process.env["PORT"] ?? 5000);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

// Express's listen callback never received an error argument, so real bind
// failures (like the port being taken) needed the server's own error event.
const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
