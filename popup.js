// check for token in background script
const websiteAddress = `https://app.swiftreply.net`;
// const websiteAddress = `http://localhost:3000`;

let teams = [];
let selectedTeam = -1;

//add warning?
chrome.runtime.sendMessage({ method: "GET_SUBSCRIPTION_STATUS" }, (response) => {
  console.log(response);
  if (response.isSubscriptionActive == false) {
    document.querySelector("#warningTemplate").innerHTML = `   <div
        className="row align-items-center d-flex warningDiv"
        style="
          width: 100%;
          background-color: #ffebeb;
          color: #DB4848;
          display: flex;
          flex-direction: row;
          height: 90px;
          margin-top: -10px;
          margin-bottom: 10px;
          padding: 1rem;
        "
      >
        <span
          className="warningMain"
          style="
            text-align: center;
            font-weight: 600;
            flex: 10;
            width: 18px;
            height: 18px;
            font-size: 0.8rem;
          "
        >
Limits exceeded! Please upgrade, or delete some templates or workspaces before you can use SwiftReply.
        </span>
      </div>`;
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

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.runtime.sendMessage({ method: "UPDATE_TEAMS" }, () => {
    chrome.runtime.sendMessage({ method: "GET_TEAMS" }, async (response) => {
      teams = response.teams;
      selectedTeam = response.selectedTeam;

      chrome.storage.local.get("swiftReplySelectedWorkSpace", (obj) => {
        if (obj.swiftReplySelectedWorkSpace) {
          let aux = parseInt(obj.swiftReplySelectedWorkSpace);
          if (isTeam(aux)) {
            selectedTeam = aux;
          }
        }
        chrome.runtime.sendMessage(
          { method: "CHECK_TEAM_AVAILABILITY", selTeam: selectedTeam },
          function (response) {
            console.log(response);
            if (response.isValid == false) {
              console.log("YE");
              document.querySelector("#warningTemplate").innerHTML = `   <div
        className="row align-items-center d-flex warningDiv"
        style="
          width: 100%;
          background-color: #ffebeb;
          color: #DB4848;
          display: flex;
          flex-direction: row;
          height: 90px;
          margin-top: -10px;
          margin-bottom: 10px;
          padding: 1rem;
        "
      >
        <span
          className="warningMain"
          style="
            text-align: center;
            font-weight: 600;
            flex: 10;
            width: 18px;
            height: 18px;
            font-size: 0.8rem;
          "
        >
Limits exceeded! Please upgrade, or delete some templates or workspaces before you can use SwiftReply.
        </span>
      </div>`;
            } else {
              document.querySelector("#warningTemplate").innerHTML = ``;
            }
          }
        );

        for (let team of teams) {
          if (team.id == selectedTeam) {
            document.querySelector("#currentWorkspaceMenu").textContent = team.name;

            let ul = document.querySelector("#workspacesList");

            console.log(ul);
            for (let team of teams) {
              let li = document.createElement("li");
              li.textContent = team.name;
              const t = team;
              li.addEventListener("click", () => {
                chrome.storage.local.set({ swiftReplySelectedWorkSpace: t.id }, () => {});

                selectedTeam = t.id;

                chrome.runtime.sendMessage(
                  { method: "CHECK_TEAM_AVAILABILITY", selTeam: selectedTeam },
                  function (response) {
                    console.log(response);
                    if (response.isValid == false) {
                      console.log("YE");
                      document.querySelector("#warningTemplate").innerHTML = `   <div
        className="row align-items-center d-flex warningDiv"
        style="
          width: 100%;
          background-color: rgb(255, 250, 205);
          display: flex;
          flex-direction: row;
          height: 90px;
          margin-top: -10px;
          margin-bottom: 10px;
          padding: 1rem;
        "
      >
        <span
          className="warningMain"
          style="
            text-align: center;
            font-weight: 600;
            flex: 10;
            width: 18px;
            height: 18px;
            font-size: 0.8rem;
          "
        >
Limits exceeded! Please upgrade, or delete some templates or workspaces before you can use SwiftReply.
        </span>
      </div>`;
                    } else {
                      document.querySelector("#warningTemplate").innerHTML = ``;
                    }
                  }
                );
                document.querySelector("#currentWorkspaceMenu").textContent = t.name;
              });
              ul.appendChild(li);
              console.log(li);
            }
            return;
          }
        }
      });
    });
  });
});

chrome.runtime.sendMessage({ method: "CHECK_TOKEN" }, function (res) {
  if (res.hasToken === false) {
    chrome.runtime.sendMessage({
      method: "REDIRECT",
      data: { link: websiteAddress + `/login` },
    });
  }
  return true;
});

//extensionEnableToggle

chrome.runtime.sendMessage({ method: "EXTENSION_GET_STATE" }, function (res) {
  document.getElementById("extensionEnableToggle").checked = res;
});

document.getElementById("extensionEnableToggle").addEventListener("click", () => {
  chrome.runtime.sendMessage({
    method: "EXTENSION_CHANGE_STATE",
    data: {
      state: document.getElementById("extensionEnableToggle").checked,
    },
  });
});

document.getElementById("FastEmail__popup-template-btn").addEventListener("click", (e) => {
  chrome.runtime.sendMessage({
    method: "LOGOUT",
  });
});

document.getElementById("SwiftReplySite").addEventListener("click", (e) => {
  chrome.runtime.sendMessage({
    method: "REDIRECT",
    data: { link: "https://swiftreply.net" },
  });
});

document.getElementById("goDashboard").addEventListener("click", (e) => {
  chrome.runtime.sendMessage({
    method: "REDIRECT",
    data: { link: websiteAddress },
  });
});

document.getElementById("newTemplateButton").addEventListener("click", (e) => {
  chrome.runtime.sendMessage({
    method: "REDIRECT",
    data: { link: websiteAddress + `/createTemplate` },
  });
});

/*
document.getElementById("generalSettingsButton").addEventListener("click", (e) => {
  chrome.runtime.sendMessage({
    method: "REDIRECT",
    data: { link: websiteAddress + `/generalSettings` },
  });
});
*/
