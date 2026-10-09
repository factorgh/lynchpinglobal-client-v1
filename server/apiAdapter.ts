import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";

export async function runHandlerChain(
  webReq: NextRequest,
  params: Record<string, string>,
  handlers: Array<(req: any, res: any, next: (err?: any) => void) => Promise<any> | any>
): Promise<NextResponse> {
  await connectDB();

  return new Promise(async (resolve) => {
    const responseHeaders = new Headers();
    let currentStatusCode = 200;
    let isEnded = false;

    // Helper to serialize cookies
    const serializeCookie = (name: string, val: string, opt: any = {}) => {
      let str = `${encodeURIComponent(name)}=${encodeURIComponent(val)}`;
      if (opt.maxAge || opt.maxAge === 0) str += `; Max-Age=${opt.maxAge}`;
      if (opt.domain) str += `; Domain=${opt.domain}`;
      if (opt.path) str += `; Path=${opt.path}`;
      else str += "; Path=/";
      if (opt.expires) str += `; Expires=${opt.expires.toUTCString()}`;
      if (opt.httpOnly) str += "; HttpOnly";
      if (opt.secure) str += "; Secure";
      if (opt.sameSite) {
        const sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        if (sameSite === true || sameSite === "strict") str += "; SameSite=Strict";
        else if (sameSite === "lax") str += "; SameSite=Lax";
        else if (sameSite === "none") str += "; SameSite=None";
      }
      return str;
    };

    const mockRes: any = {
      statusCode: 200,
      locals: {},
      status(code: number) {
        currentStatusCode = code;
        this.statusCode = code;
        return mockRes;
      },
      json(data: any) {
        if (isEnded) return;
        isEnded = true;
        resolve(NextResponse.json(data, { status: currentStatusCode, headers: responseHeaders }));
      },
      send(data: any) {
        if (isEnded) return;
        isEnded = true;
        if (typeof data === "object") {
          resolve(NextResponse.json(data, { status: currentStatusCode, headers: responseHeaders }));
        } else {
          resolve(new NextResponse(data, { status: currentStatusCode, headers: responseHeaders }));
        }
      },
      cookie(name: string, val: string, opt: any = {}) {
        responseHeaders.append("Set-Cookie", serializeCookie(name, val, opt));
        return mockRes;
      },
      setHeader(name: string, val: string) {
        responseHeaders.set(name, val);
        return mockRes;
      },
    };

    // Parse URL and Query
    const url = new URL(webReq.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      query[key] = val;
    });

    // Parse Headers
    const headers: Record<string, string> = {};
    webReq.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    // Parse Cookies
    const cookies: Record<string, string> = {};
    const cookieHeader = webReq.headers.get("cookie");
    if (cookieHeader) {
      cookieHeader.split(";").forEach((pair) => {
        const parts = pair.split("=");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = decodeURIComponent(parts.slice(1).join("=").trim());
          cookies[key] = val;
        }
      });
    }

    // Parse Body
    let body: any = {};
    let files: any[] = [];

    const method = webReq.method.toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const contentType = webReq.headers.get("content-type") || "";
      try {
        if (contentType.includes("application/json")) {
          body = await webReq.json();
        } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
          const formData = await webReq.formData();
          const parsedBody: Record<string, any> = {};

          for (const [key, val] of formData.entries()) {
            if (val instanceof File) {
              const arrayBuffer = await val.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const fileObj = {
                fieldname: key,
                originalname: val.name,
                mimetype: val.type,
                size: val.size,
                buffer,
              };
              files.push(fileObj);
            } else {
              parsedBody[key] = val;
            }
          }
          body = parsedBody;
        } else {
          const text = await webReq.text();
          if (text) {
            try {
              body = JSON.parse(text);
            } catch {
              body = text;
            }
          }
        }
      } catch (err) {
        console.warn("[apiAdapter] Error parsing request body:", err);
      }
    }

    const mockReq: any = {
      method,
      url: webReq.url,
      path: url.pathname,
      pathname: url.pathname,
      headers,
      cookies,
      query,
      params,
      body,
      files,
      file: files[0] || null,
      ip: webReq.headers.get("x-forwarded-for") || "127.0.0.1",
      user: null,
    };

    // Execute middleware / handler chain
    let index = 0;

    const next = async (err?: any) => {
      if (isEnded) return;

      if (err) {
        isEnded = true;
        console.error(`[apiAdapter] Error handling ${webReq.method} ${webReq.url}:`, err);
        const statusCode = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
        const message = err.message || "Internal Server Error";
        resolve(
          NextResponse.json(
            {
              status: statusCode >= 500 ? "error" : "fail",
              message,
              ...(process.env.NODE_ENV === "development" ? { stack: err.stack, error: err } : {}),
            },
            { status: statusCode, headers: responseHeaders }
          )
        );
        return;
      }

      if (index < handlers.length) {
        const currentHandler = handlers[index++];
        try {
          await currentHandler(mockReq, mockRes, next);
        } catch (handlerErr) {
          next(handlerErr);
        }
      } else {
        if (!isEnded) {
          isEnded = true;
          resolve(
            NextResponse.json(
              { status: "fail", message: `Route ${mockReq.method} ${mockReq.path} not found` },
              { status: 404, headers: responseHeaders }
            )
          );
        }
      }
    };

    await next();
  });
}
