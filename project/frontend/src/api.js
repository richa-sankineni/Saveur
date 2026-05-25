import axios from "axios";

const BASE = "http://localhost:5000/api";


const getToken = () => localStorage.getItem("token");

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export const getUser = () => JSON.parse(localStorage.getItem("user") || "null");
export const setAuth = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export default api;
