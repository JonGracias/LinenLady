// src/app/api/customers/me/addresses/[addressId]/route.ts
import { proxyFetch, forwardJson, forwardNoContent, serverError } from "@/lib/proxy";

type Context = { params: Promise<{ addressId: string }> };

export async function PUT(req: Request, { params }: Context) {
  try {
    const { addressId } = await params;
    const upstream = await proxyFetch(`/api/customers/me/addresses/${addressId}`, {
      method: "PUT",
      body: await req.text(),
    });
    return forwardJson(upstream);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  try {
    const { addressId } = await params;
    return forwardNoContent(
      await proxyFetch(`/api/customers/me/addresses/${addressId}`, { method: "DELETE" })
    );
  } catch (err) {
    return serverError(err);
  }
}
