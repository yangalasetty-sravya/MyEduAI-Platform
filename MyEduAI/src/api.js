// src/api.js
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const get = async (path) => {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error("GET request failed");
  return res.json();
};

export const post = async (path, data) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("POST request failed");
  return res.json();
};
