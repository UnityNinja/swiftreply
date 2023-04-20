window.document.addEventListener("fastEmailLogin", (e) => {
  let token = e.detail.token;
  chrome.runtime.sendMessage({
    method: "LOGIN_SUCCESS",
    data: { accessToken: token },
  });
});
window.document.addEventListener("fastEmailLogout", (e) => {});

chrome.storage.sync.get(["fastEmailAccessToken"], function (result) {
  chrome.runtime.sendMessage({
    method: "LOGOUT_WEBSITE",
  });
});
