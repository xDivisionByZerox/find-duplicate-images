type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';

type RequestOptions = {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  queryParams?: URLSearchParams;
}

type RequestFactoryOptions = RequestOptions & {
  method: HttpMethod;
}

function requestOptionsFactory(options: RequestFactoryOptions): RequestInit {
  const result: RequestInit = {
    method: options.method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (options.body !== undefined) {
    result.body = JSON.stringify(options.body);
  }

  return result;
}

async function requestFactory(url: string, options: RequestFactoryOptions): Promise<Response> {
  if (options.queryParams) {
    url = `${url}?${options.queryParams.toString()}`;
  }
  const normalizedOptions = requestOptionsFactory(options);

  return fetch(url, normalizedOptions);
}

export async function getRequest<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await requestFactory(url, {
    ...options,
    method: 'GET',
  });
  const responseBody = await response.json();

  return responseBody;
}


export async function postRequest<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await requestFactory(url, {
    ...options,
    method: 'POST',
  });
  const responseBody = await response.json();

  return responseBody;
}

export async function deleteRequest<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await requestFactory(url, {
    ...options,
    method: 'DELETE',
  });
  const responseBody = await response.json();

  return responseBody;
}
