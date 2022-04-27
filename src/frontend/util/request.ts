export async function getRequest<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const responseBody = await response.json();

  return responseBody;
}


export async function postRequest<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const responseBody = await response.json();

  return responseBody;
}
