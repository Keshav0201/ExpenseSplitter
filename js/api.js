const API_BASE_URL = "https://api.split.keshavdidwania.in/api";

async function getAuthToken() {
  if (!window.Clerk) {
    throw new Error("Clerk is not loaded");
  }

  // Make sure Clerk has finished initialization
  if (!Clerk.isLoaded) {
    await Clerk.load({
      ui: {
        ClerkUI: window.__internal_ClerkUICtor,
      },
    });
  }

  if (!Clerk.isSignedIn || !Clerk.session) {
    throw new Error("User is not authenticated");
  }

  const token = await Clerk.session.getToken({
    skipCache: true,
  });

  if (!token) {
    throw new Error("Unable to obtain authentication token");
  }

  return token;
}

async function request(endpoint, options = {}) {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication required");
    }

    throw new Error(
      data.message ||
      data.error ||
      "Something went wrong"
    );
  }

  return data;
}

export const api = {
  get(endpoint) {
    return request(endpoint, {
      method: "GET",
    });
  },

  post(endpoint, body) {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return request(endpoint, {
      method: "PATCH",
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  },

  delete(endpoint) {
    return request(endpoint, {
      method: "DELETE",
    });
  },
};