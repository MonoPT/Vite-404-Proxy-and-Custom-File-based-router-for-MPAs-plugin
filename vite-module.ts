import {createProxyMiddleware} from "http-proxy-middleware";
import fs from "fs";
import path from "path"

export default function logRequests({proxyServer, pagesFolder}: {proxyServer: string, pagesFolder: string}) {
  return {
    name: 'Proxy_and_reroute',
    configureServer(server) {
      const proxy = createProxyMiddleware({
        target: proxyServer,
        changeOrigin: true
      });

      server.middlewares.use((req, res, next) => {

        let url = req.originalUrl;

        if (url === "/") {
            url = "index.html";
        }
        
        const serve_file = (url: string) => {
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.write(fs.readFileSync(path.join(__dirname, url)));
            res.end();
        }

        //Use custom page MPA router
        fs.readFile(`./${pagesFolder}/${url}`, (err, data) => {
            if (!err && data) {
              serve_file(`${pagesFolder}/${url}`);
              next();
            }
            else {
              fs.readFile(`./${pagesFolder}/${url}/index.html`, (err, data) => {
                if (!err && data) {
                    serve_file(`${pagesFolder}/${url}/index.html`);
                    next();
                } else {
                  fs.readFile(`./${pagesFolder}/${url}.html`, (err, data) => {
                    if (!err && data) {
                      serve_file(`${pagesFolder}/${url}.html`);
                      next();
                    } else {
                      let file = url.split("/") as string[];
                      let file_to_serve = file[file.length - 1];

                      fs.readFile(`./${pagesFolder}/${url}/${file_to_serve}.html`, (err, data) => {
                        if (!err && data) {
                          serve_file(`./${pagesFolder}/${url}/${file_to_serve}.html`);
                          next();
                        }
                      })
                    }
                  })
                }
              })
            }
        })

        // Capture the original end method
        const originalEnd = res.end;

        res.end = function (...args) {

          if (res.statusCode === 404) {
            // Use the proxy for 404 responses
            proxy(req, res, next);
          } else {
            // Call the original end method for non-404 responses
            originalEnd.apply(res, args);
          }
        };

        next();
      });
    }
  };
};