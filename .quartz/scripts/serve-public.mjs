import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import handler from "serve-handler"

const quartzDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const publicDir = path.join(quartzDir, "public")
const port = Number(process.env.PORT ?? "4173")

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: publicDir,
    cleanUrls: true,
  })
})

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${publicDir} on http://127.0.0.1:${port}`)
})
