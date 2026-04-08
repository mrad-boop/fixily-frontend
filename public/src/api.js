const BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

function getToken() { return localStorage.getItem("fixily_token"); }

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur serveur.");
  return data;
}

const api = {
  register:(d)=>request("POST","/api/auth/register",d),
  login:(d)=>request("POST","/api/auth/login",d),
  me:()=>request("GET","/api/auth/me"),
  updateProfile:(d)=>request("PUT","/api/auth/me",d),
  updatePassword:(d)=>request("PUT","/api/auth/password",d),
  getArtisans:(q)=>request("GET",`/api/artisans?${new URLSearchParams(q)}`),
  getArtisan:(id)=>request("GET",`/api/artisans/${id}`),
  createRequest:(d)=>request("POST","/api/requests",d),
  myRequests:()=>request("GET","/api/requests/my"),
  validatePhotos:(id,d)=>request("PUT",`/api/requests/${id}/validate`,d),
  leaveReview:(id,d)=>request("POST",`/api/requests/${id}/review`,d),
  receivedRequests:()=>request("GET","/api/requests/artisan/received"),
  respondRequest:(id,d)=>request("PUT",`/api/requests/${id}/respond`,d),
  startRequest:(id)=>request("PUT",`/api/requests/${id}/start`,{}),
  submitPhotos:(id,d)=>request("POST",`/api/requests/${id}/photos`,d),
  getConfig:()=>request("GET","/api/config"),
  sendContact:(d)=>request("POST","/api/contact",d),
  getActiveAd:(pos)=>request("GET",`/api/ads/active${pos?`?position=${pos}`:""}`),
  trackAdClick:(id)=>request("POST",`/api/ads/${id}/click`),
  adminDashboard:()=>request("GET","/api/admin/dashboard"),
  adminArtisans:()=>request("GET","/api/admin/artisans"),
  adminClients:()=>request("GET","/api/admin/clients"),
  adminRequests:(s)=>request("GET",`/api/admin/requests${s?`?status=${s}`:""}`),
  adminWorks:()=>request("GET","/api/admin/works/pending"),
  adminReports:()=>request("GET","/api/admin/reports"),
  adminMessages:()=>request("GET","/api/admin/messages"),
  adminConfig:()=>request("GET","/api/admin/config"),
  adminSaveConfig:(d)=>request("PUT","/api/admin/config",d),
  adminValidateArtisan:(id)=>request("PUT",`/api/admin/artisans/${id}/validate`),
  adminSuspend:(id)=>request("PUT",`/api/admin/artisans/${id}/suspend`),
  adminSetPlan:(id,d)=>request("PUT",`/api/admin/artisans/${id}/plan`,d),
  adminValidateWork:(id,s)=>request("PUT",`/api/admin/works/${id}`,{status:s}),
  adminResolveReport:(id,d)=>request("PUT",`/api/admin/reports/${id}`,d),
  adminRecalcBadges:()=>request("POST","/api/admin/recalc-badges"),
  adminMarkRead:(id)=>request("PUT",`/api/admin/messages/${id}/read`),
  adminAds:()=>request("GET","/api/ads/admin"),
  adminAdStats:()=>request("GET","/api/ads/admin/stats"),
  adminCreateAd:(d)=>request("POST","/api/ads/admin",d),
  adminUpdateAd:(id,d)=>request("PUT",`/api/ads/admin/${id}`,d),
  adminAdStatus:(id,s)=>request("PUT",`/api/ads/admin/${id}/status`,{status:s}),
  adminAdReset:(id)=>request("PUT",`/api/ads/admin/${id}/reset`),
  adminDeleteAd:(id)=>request("DELETE",`/api/ads/admin/${id}`),
};

export default api;