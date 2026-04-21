import aiHandler from "../../../../api/ai.js";

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
            "Access-Control-Allow-Headers":
                "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
        },
    });
}

export async function POST(request: Request) {
    const requestBody = await request.text();

    const req = {
        method: request.method,
        body: requestBody,
        headers: request.headers,
        url: request.url,
    } as const;

    let status = 200;
    const headers = new Headers();
    let body = "";
    let headersSent = false;

    const res = {
        setHeader(name: string, value: string) {
            if (!headersSent) {
                headers.set(name, value);
            }
            return res;
        },
        status(code: number) {
            status = code;
            return res;
        },
        json(data: unknown) {
            if (!headersSent) {
                headers.set("Content-Type", "application/json");
                body = JSON.stringify(data);
                headersSent = true;
            }
            return res;
        },
        write(chunk: string | Uint8Array) {
            if (!headersSent) {
                headersSent = true;
            }
            body += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
            return res;
        },
        end(data?: string) {
            if (typeof data === "string") {
                body += data;
            }
            return res;
        },
    };

    try {
        await aiHandler(req as any, res as any);
    } catch (error) {
        console.error("/api/ai wrapper error:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error", details: String(error) }),
            {
                status: 500,
                headers: new Headers({ "Content-Type": "application/json" }),
            },
        );
    }

    return new Response(body ?? "", {
        status,
        headers,
    });
}
