export const refreshToken = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const baseURL = window.location.origin;
    const response = await fetch(`${baseURL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: token }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      console.log("Token refreshed successfully");
      return data.access_token;
    }
    console.error("Token refresh failed:", response.status);
    return null;
  } catch (err) {
    console.error("Token refresh error:", err);
    return null;
  }
};

export const fetchWithTokenRefresh = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem("token");
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    console.log("Got 401, attempting token refresh...");
    const newToken = await refreshToken();
    if (newToken) {
      console.log("Retrying request with new token");
      response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${newToken}`,
        },
      });
    } else {
      console.log("Token refresh failed, redirecting to login");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  }

  return response;
};
