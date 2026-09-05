import { auth } from "./firebase.js";

const API_BASE_URL = "http://localhost:3016/api";

async function getAuthToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated");
  }

  return await user.getIdToken();
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
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
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete(endpoint) {
    return request(endpoint, {
      method: "DELETE",
    });
  },
};
