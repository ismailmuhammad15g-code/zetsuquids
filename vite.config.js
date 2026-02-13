import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function apiMiddleware() {
  return {
    name: "api-middleware",
    configureServer(server) {
      // Load environment variables once when server starts
      const env = loadEnv(server.config.mode, process.cwd(), "");
      const apiKey = env.VITE_AI_API_KEY || env.ROUTEWAY_API_KEY;
      const apiUrl =
        env.VITE_AI_API_URL || "https://api.routeway.ai/v1/chat/completions";
      const apiModel = env.VITE_AI_MODEL || "kimi-k2-0905:free";

      // Supabase config for daily credits
      const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

      console.log("[API Middleware] Initialized");
      console.log("[API Middleware] API Key present:", !!apiKey);
      console.log("[API Middleware] API URL:", apiUrl);
      console.log("[API Middleware] Model:", apiModel);
      console.log("[API Middleware] Supabase URL present:", !!supabaseUrl);
      console.log(
        "[API Middleware] Supabase Service Key present:",
        !!supabaseServiceKey,
      );

      server.middlewares.use(async (req, res, next) => {
        // Handle CORS for all API routes
        if (req.url?.startsWith("/api/")) {
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          );
          res.setHeader(
            "Access-Control-Allow-Headers",
            "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          );

          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }
        }

        // Handle register API
        if (req.url === "/api/register" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);

              // Inject env vars
              process.env.VITE_SUPABASE_URL =
                env.VITE_SUPABASE_URL || env.SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
              process.env.MAIL_USERNAME = env.MAIL_USERNAME;
              process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
              process.env.VITE_APP_URL = "http://localhost:3000";

              const mockReq = {
                method: "POST",
                body: data,
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
              };

              const { default: registerUser } =
                await import("./api/register.js");
              await registerUser(mockReq, mockRes);
            } catch (error) {
              console.error("Register API Error:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }

        // Handle claim_referral API
        if (req.url === "/api/claim_referral" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);

              // Inject env vars
              process.env.VITE_SUPABASE_URL =
                env.VITE_SUPABASE_URL || env.SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

              const mockReq = {
                method: "POST",
                body: data,
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
              };

              const { default: claimReferral } =
                await import("./api/claim_referral.js");
              await claimReferral(mockReq, mockRes);
            } catch (error) {
              console.error("Claim Referral API Error:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }

        // Handle daily_credits API
        if (req.url === "/api/daily_credits" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);

              // Inject env vars
              process.env.VITE_SUPABASE_URL =
                env.VITE_SUPABASE_URL || env.SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

              const mockReq = {
                method: "POST",
                body: data,
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
              };

              const { default: dailyCredits } =
                await import("./api/daily_credits.js");
              await dailyCredits(mockReq, mockRes);
            } catch (error) {
              console.error("Daily Credits API Error:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }

        // Handle create_payment API
        if (req.url === "/api/create_payment" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);

              // Set Paymob environment variables for the API handler
              process.env.VITE_PAYMOB_API_KEY = env.VITE_PAYMOB_API_KEY;
              process.env.VITE_PAYMOB_INTEGRATION_ID =
                env.VITE_PAYMOB_INTEGRATION_ID;
              process.env.VITE_PAYMOB_IFRAME_ID = env.VITE_PAYMOB_IFRAME_ID;

              // Create a mock request object with parsed body
              const mockReq = {
                method: "POST",
                body: data,
                headers: req.headers,
              };

              // Create a mock response object
              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(key, value) {
                  this.headers[key] = value;
                  res.setHeader(key, value);
                },
                status(code) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data) {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
                end(data) {
                  res.end(data);
                },
              };

              const { default: createPayment } =
                await import("./api/create_payment.js");
              await createPayment(mockReq, mockRes);
            } catch (error) {
              console.error("[API Middleware] Error in create_payment:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Internal server error",
                  details: error.message,
                }),
              );
            }
          });
          return;
        }

        // Handle unified payment_handler API (both GET and POST)
        if (
          req.url === "/api/payment_callback" ||
          req.url === "/api/payment_status" ||
          req.url?.startsWith("/api/payment_status")
        ) {
          // For POST requests (callbacks), parse body
          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);

                // Set Supabase environment variables
                process.env.SUPABASE_URL =
                  env.VITE_SUPABASE_URL || env.SUPABASE_URL;
                process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

                const mockReq = {
                  method: "POST",
                  body: data,
                  headers: req.headers,
                  url: req.url,
                };

                const mockRes = {
                  statusCode: 200,
                  headers: {},
                  setHeader(key, value) {
                    this.headers[key] = value;
                    res.setHeader(key, value);
                  },
                  status(code) {
                    this.statusCode = code;
                    res.statusCode = code;
                    return this;
                  },
                  json(data) {
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify(data));
                  },
                  end(data) {
                    res.end(data);
                  },
                  send(data) {
                    res.end(data);
                  },
                };

                const { default: paymentHandler } =
                  await import("./api/payment_handler.js");
                await paymentHandler(mockReq, mockRes);
              } catch (error) {
                console.error(
                  "[API Middleware] Error in payment_handler:",
                  error,
                );
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error: "Internal server error",
                    details: error.message,
                  }),
                );
              }
            });
            return;
          }

          // For GET requests (status page)
          const { default: paymentHandler } =
            await import("./api/payment_handler.js");
          const mockRes = {
            statusCode: 200,
            headers: {},
            setHeader(key, value) {
              this.headers[key] = value;
              res.setHeader(key, value);
            },
            status(code) {
              this.statusCode = code;
              res.statusCode = code;
              return this;
            },
            json(data) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            },
            end(data) {
              res.end(data);
            },
            send(data) {
              res.end(data);
            },
          };
          await paymentHandler(req, mockRes);
          return;
        }

        // Handle submit_bug API
        if (req.url === "/api/submit_bug" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = body ? JSON.parse(body) : {};

              // Inject env vars safely
              process.env.VITE_SUPABASE_URL =
                env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY =
                env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
              process.env.MAIL_USERNAME =
                env.MAIL_USERNAME || process.env.MAIL_USERNAME;
              process.env.MAIL_PASSWORD =
                env.MAIL_PASSWORD || process.env.MAIL_PASSWORD;

              // Only set if defined to avoid "undefined" string
              if (env.ADMIN_APPROVAL_TOKEN)
                process.env.ADMIN_APPROVAL_TOKEN = env.ADMIN_APPROVAL_TOKEN;

              process.env.VITE_APP_URL = "http://localhost:3001";

              const mockReq = {
                method: "POST",
                body: data,
                headers: req.headers,
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
              };

              const { default: submitBug } =
                await import("./api/submit_bug.js");
              await submitBug(mockReq, mockRes);
            } catch (error) {
              console.error("Bug API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }

        // Handle approve_bug_reward API
        if (req.url?.startsWith("/api/approve_bug_reward")) {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const query = Object.fromEntries(url.searchParams);

            process.env.VITE_SUPABASE_URL =
              env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY =
              env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
            if (env.ADMIN_APPROVAL_TOKEN)
              process.env.ADMIN_APPROVAL_TOKEN = env.ADMIN_APPROVAL_TOKEN;

            const mockReq = {
              method: "GET",
              query,
            };
            const mockRes = {
              statusCode: 200,
              setHeader: (key, value) => res.setHeader(key, value),
              status: (code) => {
                res.statusCode = code;
                return mockRes;
              },
              send: (data) => res.end(data),
              json: (data) => {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(data));
              },
            };

            const { default: approveBug } =
              await import("./api/approve_bug_reward.js");
            await approveBug(mockReq, mockRes);
          } catch (error) {
            console.error("Approve API Error:", error);
            res.statusCode = 500;
            res.end(error.message);
          }
          return;
        }

        // Handle mark_notification_read API
        if (
          req.url === "/api/mark_notification_read" &&
          req.method === "POST"
        ) {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = body ? JSON.parse(body) : {};

              // Inject env vars safely
              process.env.VITE_SUPABASE_URL =
                env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY =
                env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

              const mockReq = {
                method: "POST",
                body: data,
              };
              const mockRes = {
                statusCode: 200,
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
              };

              const { default: markRead } =
                await import("./api/mark_notification_read.js");
              await markRead(mockReq, mockRes);
            } catch (error) {
              console.error("Mark Read API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }

        // Handle support_ticket API
        if (
          (req.url === "/api/support_ticket" ||
            req.url === "/api/submit_support") &&
          req.method === "POST"
        ) {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);

              // Set Gmail credentials for nodemailer
              process.env.MAIL_USERNAME = env.MAIL_USERNAME;
              process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
              process.env.SUPPORT_EMAIL = "zetsuserv@gmail.com";

              const mockReq = {
                method: "POST",
                body: data,
                headers: req.headers,
              };

              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(key, value) {
                  this.headers[key] = value;
                  res.setHeader(key, value);
                },
                status(code) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data) {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
                end(data) {
                  res.end(data);
                },
              };

              const { default: supportTicket } =
                await import("./api/support_ticket.js");
              await supportTicket(mockReq, mockRes);
            } catch (error) {
              console.error("[API Middleware] Error in support_ticket:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  success: false,
                  error: "Internal server error",
                  details: error.message,
                }),
              );
            }
          });
          return;
        }

        if (req.url === "/api/ai" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              console.log(
                "[API Middleware] Received request for model:",
                data.model || apiModel,
              );

              // Inject env vars safely
              process.env.VITE_AI_API_KEY =
                env.VITE_AI_API_KEY || env.ROUTEWAY_API_KEY;
              process.env.VITE_AI_API_URL =
                env.VITE_AI_API_URL ||
                "https://api.routeway.ai/v1/chat/completions";
              process.env.VITE_SUPABASE_URL =
                env.VITE_SUPABASE_URL || env.SUPABASE_URL;
              process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

              const mockReq = {
                method: "POST",
                body: data,
                headers: req.headers,
              };
              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(key, value) {
                  this.headers[key] = value;
                  res.setHeader(key, value);
                },
                status(code) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                write(data) {
                  return res.write(data);
                },
                json(data) {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
                end(data) {
                  res.end(data);
                },
              };

              const { default: aiHandler } = await import("./api/ai.js");
              await aiHandler(mockReq, mockRes);
            } catch (error) {
              console.error("[API Middleware] Error in ai handler:", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: error.message,
                  type: error.name,
                }),
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react(), apiMiddleware()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
  },
});
