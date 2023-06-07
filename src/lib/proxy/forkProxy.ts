import { ChildProcess, fork } from "child_process";
import proxyRequest, { ProxyOptions } from "./proxy";
import { join } from "path";
import { createServer } from "net";

export default function createChildProxy(options: ProxyOptions) {
  const child: ChildProcess = fork(join(__dirname, "./proxy.js"), {
    env: { options: JSON.stringify(options) },
  });
  child.stdout?.pipe(process.stdout);
  return child;
}

export async function findLocalUnusedPort(
  port: number,
  maxPort: number
): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
      .listen(port)
      .on("listening", () => {
        server.close();
        resolve(port);
      })
      .on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          port++;
          if (port > maxPort) {
            reject(-1);
          } else {
            server.listen(port);
          }
          return;
        }
        reject(-1);
      });
  });
}
