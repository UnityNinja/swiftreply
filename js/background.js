//black magic login stuff
// const websiteAddress = `http://localhost:3000`;
// const serverAddress = "http://localhost:3132";

const websiteAddress = `https://app.swiftreply.net`;
const serverAddress = "https://app.swiftreply.net";
let teams = [];
let selectedTeam = -1;
let token = null;
let isSubscriptionActive;
let activeState = false;

chrome.storage.local.get("swiftReplyExtensionState", (obj) => {
  if (obj.swiftReplyExtensionState) {
    activeState = obj.swiftReplyExtensionState;
  } else {
    activeState = true;
  }
});

const fetchSubscriptionInfo = async (token) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  const response = await fetch(
    serverAddress + "/getSubscription",
    requestOptions
  );
  const responseData = await response.json();

  if (
    responseData.current_teams > responseData.max_teams ||
    responseData.current_templates > responseData.max_templates
  ) {
    isSubscriptionActive = false;
  } else {
    isSubscriptionActive = true;
  }
};

async function checkValidity(selTeam) {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  const response = await fetch(
    serverAddress + "/teamActive/" + selTeam,
    requestOptions
  );

  if (response.status === 200) {
    const data = await response.json();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "UPDATE_AVAILABILITY",
        data: data,
        selTeam: selTeam,
      });
    });

    isTeamActive = data.isValid;

    return data;
  }
  return { isValid: false };
}

chrome.storage.sync.get(["fastEmailAccessToken"], function (result) {
  if (result.fastEmailAccessToken) {
    // console.log("saved " + result.fastEmailAccessToken);
    token = result.fastEmailAccessToken;
    fetchSubscriptionInfo(token);
    fetchTeams(token);
  }
});

const isLoggedIn = () => {
  // alert(token);
  if (token && token != "") return true;

  return false;
};

//save token

const saveToken = () => {
  chrome.storage.sync.set({ fastEmailAccessToken: token }, function () {
    // console.log("token saved");
    hasToken = true;
    fetchTeams(token);
  });
};
const logout = () => {
  token = null;
  teams = null;
  selectedTeam = -1;
  chrome.storage.sync.remove("fastEmailAccessToken", function () {});
};

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  switch (request.method) {
    case "EXTENSION_CHANGE_STATE":
      chrome.storage.sync.set(
        { swiftReplyExtensionState: request.data.state },
        function () {
          activeState = request.data.state;
        }
      );
      sendResponse();
      break;
    case "EXTENSION_GET_STATE":
      sendResponse(activeState);
      break;
    case "CHECK_TOKEN":
      sendResponse({ hasToken: isLoggedIn(), token: token });
      break;
    case "REDIRECT":
      chrome.tabs.create({ url: request.data.link });
      sendResponse();
      break;
    case "LOGIN_SUCCESS":
      token = request.data.accessToken;
      // console.log(token);
      saveToken();
      sendResponse();
      break;
    case "LOGOUT_WEBSITE":
      // console.log("LOGGED OUT");
      logout();
      sendResponse();
      break;
    case "LOGOUT":
      chrome.storage.sync.set({ fastEmailAccessToken: undefined }, function () {
        // console.log("token saved");
      });
      token = null;
      chrome.tabs.create({ url: websiteAddress + "/login" });
      sendResponse();
      break;
    case "GET_TEAMS":
      // await fetchTeams(token, sendResponse);
      sendResponse({ teams: teams, selectedTeam: selectedTeam });
      break;
    case "UPDATE_TEAMS":
      fetchTeams(token);
      sendResponse("OK");
      break;
    case "GET_SUBSCRIPTION_STATUS":
      sendResponse({ isSubscriptionActive: isSubscriptionActive });
      break;

    case "UPDATE_SUBSCRIPTION_STATUS":
      await fetchSubscriptionInfo(token);
      sendResponse("ok");
      break;
    case "CHECK_TEAM_AVAILABILITY":
      sendResponse(checkValidity(request.selTeam));
    default:
      break;
  }
});

const isTeam = (selId) => {
  for (let team of teams) {
    if (team.id === selId) {
      return true;
    }
  }
  return false;
};

const fetchTeams = async (token) => {
  if (token == null) return;
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  const response = await fetch(serverAddress + "/getTeams", requestOptions);
  const responseData = await response.json();
  teams = responseData;

  chrome.storage.local.get("swiftReplySelectedWorkSpace", (obj) => {
    if (obj.swiftReplySelectedWorkSpace) {
      let aux = parseInt(obj.swiftReplySelectedWorkSpace);
      if (isTeam(aux)) {
        selectedTeam = aux;
      }
    }
  });

  if (selectedTeam == -1) {
    for (let i of responseData) {
      if ((i.name = "Personal Workspace")) {
        selectedTeam = i.id;
        break;
      }
    }
  }
};
