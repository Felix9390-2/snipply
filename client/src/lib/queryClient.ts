import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

function buildUrl(queryKey: unknown[]): string {
  let url = queryKey[0] as string;
  
  // Check if there's a second parameter that's an object (query params)
  if (queryKey.length > 1 && queryKey[1] && typeof queryKey[1] === 'object') {
    const params = new URLSearchParams();
    const queryParams = queryKey[1] as Record<string, any>;
    
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  } else if (queryKey.length > 1) {
    // If there are additional string parameters, join them with "/"
    const additionalParams = queryKey.slice(1).filter(param => typeof param === 'string');
    if (additionalParams.length > 0) {
      url += `/${additionalParams.join('/')}`;
    }
  }
  
  return url;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildUrl([...queryKey]);
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
