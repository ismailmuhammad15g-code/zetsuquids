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
      const apiModel = env.VITE_AI_MODEL || "google/gemini-2.0-flash-exp:free";

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
            "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          );

          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }
        }

        // Helper to parse body
        const parseBody = (req) =>
          new Promise((resolve, reject) => {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (e) {
                resolve({});
              }
            });
            req.on("error", reject);
          });

        // Helper to create mock objects for Vercel functions
        const createMocks = (req, res, body, query = {}) => {
          const mockReq = {
            method: req.method,
            body: body,
            query: query,
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
              return mockRes;
            },
            json(data) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            },
            send(data) {
              res.end(data);
            },
            end(data) {
              res.end(data);
            },
            write(data) {
              return res.write(data);
            },
          };
          return { mockReq, mockRes };
        };

        // --- USERS API (Register) ---
        if (req.url === "/api/register" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "register",
          });

          // Environment variables
          process.env.VITE_SUPABASE_URL =
            env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
          process.env.MAIL_USERNAME = env.MAIL_USERNAME;
          process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
          process.env.VITE_APP_URL = "http://localhost:3000";

          try {
            const { default: usersHandler } = await import("./api/users.js");
            await usersHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Register API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        // --- PAYMENTS API (Create Payment, Claim Referral, Daily Credits, etc.) ---
        if (req.url === "/api/claim_referral" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "claim_referral",
          });

          process.env.VITE_SUPABASE_URL =
            env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

          try {
            const { default: paymentsHandler } =
              await import("./api/payments.js");
            await paymentsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Claim Referral API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        if (req.url === "/api/daily_credits" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "daily_credits",
          });

          process.env.VITE_SUPABASE_URL =
            env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

          try {
            const { default: paymentsHandler } =
              await import("./api/payments.js");
            await paymentsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Daily Credits API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        if (req.url === "/api/create_payment" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "create",
          });

          process.env.VITE_PAYMOB_API_KEY = env.VITE_PAYMOB_API_KEY;
          process.env.VITE_PAYMOB_INTEGRATION_ID =
            env.VITE_PAYMOB_INTEGRATION_ID;
          process.env.VITE_PAYMOB_IFRAME_ID = env.VITE_PAYMOB_IFRAME_ID;

          try {
            const { default: paymentsHandler } =
              await import("./api/payments.js");
            await paymentsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Create Payment API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        if (req.url?.startsWith("/api/approve_bug_reward")) {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const query = Object.fromEntries(url.searchParams);
            query.type = "approve_reward"; // Add type for router

            // Environment
            process.env.VITE_SUPABASE_URL =
              env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY =
              env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
            if (env.ADMIN_APPROVAL_TOKEN)
              process.env.ADMIN_APPROVAL_TOKEN = env.ADMIN_APPROVAL_TOKEN;

            const { mockReq, mockRes } = createMocks(req, res, {}, query);

            const { default: paymentsHandler } =
              await import("./api/payments.js");
            await paymentsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Approve API Error:", error);
            res.statusCode = 500;
            res.end(error.message);
          }
          return;
        }

        if (
          req.url === "/api/payment_callback" ||
          req.url?.startsWith("/api/payment_status")
        ) {
          // For simplicity, verify this logic again if needed.
          // But for now, routing to payments.js with type 'webhook'
          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, {
              type: "webhook",
            });

            process.env.SUPABASE_URL =
              env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

            try {
              const { default: paymentsHandler } =
                await import("./api/payments.js");
              await paymentsHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Payment Handler Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
            return;
          }
          // Get request (status) - skipping for now or map to webhook
          // The old payment_handler handled both. 'webhook' type in payments.js handles POST.
          // If there's a GET, it likely rendered HTML or JSON status.
        }

        // --- INTERACTIONS API (Follow, Record, Mark Read) ---
        if (req.url === "/api/follow_user" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "follow",
          });

          process.env.VITE_SUPABASE_URL =
            env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

          try {
            const { default: interactionsHandler } =
              await import("./api/interactions.js");
            await interactionsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Follow User API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        if (
          req.url === "/api/mark_notification_read" &&
          req.method === "POST"
        ) {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "mark_read",
          });

          process.env.VITE_SUPABASE_URL =
            env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY =
            env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

          try {
            const { default: interactionsHandler } =
              await import("./api/interactions.js");
            await interactionsHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Mark Read API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        // --- CONTENT API (Submit Bug, Support, Recommendations) ---
        if (req.url === "/api/submit_bug" && req.method === "POST") {
          const body = await parseBody(req);
          // Frontend might send headers, usually sends issueType etc.
          // Map to content.js expected structure if needed, or just pass body
          // content.js expects 'type' in query to be 'submission'
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "submission",
          });
          // content.js expects 'type' in BODY to be 'bug' or 'support'
          mockReq.body.type = "bug";

          process.env.VITE_SUPABASE_URL =
            env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY =
            env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
          process.env.MAIL_USERNAME =
            env.MAIL_USERNAME || process.env.MAIL_USERNAME;
          process.env.MAIL_PASSWORD =
            env.MAIL_PASSWORD || process.env.MAIL_PASSWORD;
          if (env.ADMIN_APPROVAL_TOKEN)
            process.env.ADMIN_APPROVAL_TOKEN = env.ADMIN_APPROVAL_TOKEN;
          process.env.VITE_APP_URL = "http://localhost:3001";

          try {
            const { default: contentHandler } =
              await import("./api/content.js");
            await contentHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Bug API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        if (
          (req.url === "/api/support_ticket" ||
            req.url === "/api/submit_support") &&
          req.method === "POST"
        ) {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {
            type: "submission",
          });
          mockReq.body.type = "support";

          process.env.MAIL_USERNAME = env.MAIL_USERNAME;
          process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
          process.env.SUPPORT_EMAIL = "zetsuserv@gmail.com";

          try {
            const { default: contentHandler } =
              await import("./api/content.js");
            await contentHandler(mockReq, mockRes);
          } catch (error) {
            console.error("Support API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        // --- OLD AI HANDLER ---
        if (req.url === "/api/ai" && req.method === "POST") {
          const body = await parseBody(req);
          const { mockReq, mockRes } = createMocks(req, res, body, {});

          process.env.VITE_AI_API_KEY =
            env.VITE_AI_API_KEY || env.ROUTEWAY_API_KEY;
          process.env.VITE_AI_API_URL =
            env.VITE_AI_API_URL ||
            "https://api.routeway.ai/v1/chat/completions";
          process.env.VITE_SUPABASE_URL =
            env.VITE_SUPABASE_URL || env.SUPABASE_URL;
          process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

          try {
            const { default: aiHandler } = await import("./api/ai.js");
            await aiHandler(mockReq, mockRes);
          } catch (error) {
            console.error("AI API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        // --- NEW CONSOLIDATED ROUTES (Direct calls to new structure) ---
        // Verify if frontend is calling /api/payments?type=... directly
        if (req.url?.startsWith("/api/payments")) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(url.searchParams);

          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, query);
            // Inject necessary envs (superset of all)
            process.env.VITE_SUPABASE_URL =
              env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
            // + Paymob envs
            process.env.VITE_PAYMOB_API_KEY = env.VITE_PAYMOB_API_KEY;
            process.env.VITE_PAYMOB_INTEGRATION_ID =
              env.VITE_PAYMOB_INTEGRATION_ID;
            process.env.VITE_PAYMOB_IFRAME_ID = env.VITE_PAYMOB_IFRAME_ID;

            try {
              const { default: paymentsHandler } =
                await import("./api/payments.js");
              await paymentsHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Payments API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          } else if (req.method === "GET") {
            const { mockReq, mockRes } = createMocks(req, res, {}, query);
            // Inject necessary envs
            process.env.VITE_SUPABASE_URL =
              env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

            try {
              const { default: paymentsHandler } =
                await import("./api/payments.js");
              await paymentsHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Payments API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          }
          return;
        }

        if (req.url?.startsWith("/api/interactions")) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(url.searchParams);

          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, query);

            process.env.VITE_SUPABASE_URL =
              env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

            try {
              const { default: interactionsHandler } =
                await import("./api/interactions.js");
              await interactionsHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Interactions API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          }
          return;
        }

        if (req.url?.startsWith("/api/content")) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(url.searchParams);

          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, query);

            process.env.VITE_SUPABASE_URL =
              env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
            process.env.MAIL_USERNAME = env.MAIL_USERNAME;
            process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;

            try {
              const { default: contentHandler } =
                await import("./api/content.js");
              await contentHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Content API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          } else if (req.method === "GET") {
            // Handle GET requests if needed
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Method not allowed" }));
          }
          return;
        }

        if (req.url?.startsWith("/api/users")) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(url.searchParams);

          if (req.method === "POST") {
            const body = await parseBody(req);
            const { mockReq, mockRes } = createMocks(req, res, body, query);

            process.env.VITE_SUPABASE_URL =
              env.VITE_SUPABASE_URL || env.SUPABASE_URL;
            process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
            process.env.MAIL_USERNAME = env.MAIL_USERNAME;
            process.env.MAIL_PASSWORD = env.MAIL_PASSWORD;
            process.env.VITE_APP_URL = "http://localhost:3000"; // Dev URL

            try {
              const { default: usersHandler } = await import("./api/users.js");
              await usersHandler(mockReq, mockRes);
            } catch (error) {
              console.error("Users API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          }
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
    strictPort: true,
    open: true,
    hmr: {
      port: 3000,
    },
  },
  optimizeDeps: {
    include: [
      "html2canvas",
      "jspdf",
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "@tanstack/react-query",
    ],
    force: true, // Forces dependency pre-bundling
  },
});
