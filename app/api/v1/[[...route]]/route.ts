import { NextRequest } from "next/server";
import { dispatchApiRequest } from "@/server/dispatcher";

type RouteParams = {
  params: Promise<{ route?: string[] }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { route = [] } = await params;
  return dispatchApiRequest(req, route);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { route = [] } = await params;
  return dispatchApiRequest(req, route);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { route = [] } = await params;
  return dispatchApiRequest(req, route);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { route = [] } = await params;
  return dispatchApiRequest(req, route);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { route = [] } = await params;
  return dispatchApiRequest(req, route);
}
