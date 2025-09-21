import { HttpRequest, InvocationContext } from '@azure/functions';

export function createHttpRequest(method: string, url: string, body?: any, headers?: Record<string, string>, query?: Record<string, string>): HttpRequest {
    const searchParams = new URLSearchParams(query || {});
    const fullUrl = query ? `${url}?${searchParams.toString()}` : url;
    const hdrs = new Map<string, string>();
    Object.entries(headers || {}).forEach(([k, v]) => hdrs.set(k.toLowerCase(), v));

    return {
        method,
        url: fullUrl,
        headers: {
            get: (key: string) => hdrs.get(key.toLowerCase()) || null,
            has: (key: string) => hdrs.has(key.toLowerCase()),
        } as any,
        query: new URL(fullUrl).searchParams,
        text: async () => (body !== undefined ? JSON.stringify(body) : ''),
    } as unknown as HttpRequest;
}

export function createInvocationContext(): InvocationContext {
    return {
        functionName: 'test',
        invocationId: 'invocation-id',
        log: (..._args: any[]) => { /* no-op for tests */ },
        traceContext: {} as any,
        bindings: {} as any,
        bindingData: {} as any,
    } as unknown as InvocationContext;
}

export async function parseJsonBodyFromResponse(resp: any) {
    const json = typeof resp.body === 'string' ? JSON.parse(resp.body) : resp.body;
    return json;
}

