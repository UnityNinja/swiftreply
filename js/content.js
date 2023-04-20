const loadingTemplateString = "loading template...";
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

let keyCodeForAutoComplete = -1;
let keyCombForAutoComplete = "";
let isTyped = 0;

let keyCodeForExtensionEnable = -1;
let keyCombForExtensionEnable = "";

let keyCodeForList = -1;
let keyCombForList = "";

const serverAddress = "https://app.swiftreply.net";

// const serverAddress = "http://localhost:3132";
let snackbar = document.createElement("div");
let templateList = document.createElement("div");
const elementList = document.createElement("div");
const preview = document.createElement("div");
const previewTitle = document.createElement("div");
const previewContent = document.createElement("div");

// The parent input/area/div to be focused after closing template popup list
let inputFocuedNode;
let canChoseNow = true;
const focusTaker = document.createElement("input");
let mouseX, mouseY;
let templates = [];
let teams = [];
let selectedTeam = -1;
let isSubscriptionActive = true;
let isTeamActive = true;
let currentToken;

let selectedCustomVarOption = 0;

let isChosingCustomVariable = false;

function checkForEnableExtensionTrigger(event) {
  if (!keyCombForExtensionEnable) return false;
  let combPartsList = keyCombForExtensionEnable.split("+");

  let keyListCombSatisfied = isKeyCombValid(event, combPartsList);

  if (event.keyCode === keyCodeForExtensionEnable && keyListCombSatisfied) {
    chrome.runtime.sendMessage(
      { method: "EXTENSION_GET_STATE" },
      function (res) {
        chrome.runtime.sendMessage({
          method: "EXTENSION_CHANGE_STATE",
          data: {
            state: !res,
          },
        });
      }
    );
    return true;
  }
  return false;
}

document.addEventListener("keydown", checkForEnableExtensionTrigger);

const isTeam = (selId) => {
  for (let team of teams) {
    if (team.id === selId) {
      return true;
    }
  }
  return false;
};

const checkValidity = () => {
  var request = new XMLHttpRequest();
  request.open("GET", serverAddress + "/teamActive/" + selectedTeam, false);
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader("Authorization", "Bearer " + currentToken);

  request.send(null);

  if (request.status === 200) {
    const data = JSON.parse(request.response);

    isTeamActive = data.isValid;

    return data;
  }
  return { isValid: false };
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "GET_TEAMS":
      sendResponse({ teams: teams, selectedTeam: selectedTeam });
      break;
    case "GET_SUBSCRIPTION_STATUS":
      sendResponse({ isSubscriptionActive: isSubscriptionActive });
      break;
    case "SELECT_NEW_TEAM":
      selectedTeam = message.newSelect;
      fetchTemplates(currentToken);
      let data = checkValidity();
      sendResponse(data);
      break;
    case "UPDATE_AVAILABILITY":
      isTeamActive = message.data.isValid;
      selectedTeam = message.selTeam;
      fetchTemplates(currentToken);
      break;
  }
});

const fetchSubscriptionInfo = async (token) => {
  chrome.runtime.sendMessage({ method: "UPDATE_SUBSCRIPTION_STATUS" }, () => {
    chrome.runtime.sendMessage(
      { method: "GET_SUBSCRIPTION_STATUS" },
      (response) => {
        isSubscriptionActive = response.isSubscriptionActive;
        //console.log("isSubscriptionActive: " + isSubscriptionActive);
      }
    );

    //UPDATE_SUBSCRIPTION_STATUS
  });
};

const fetchTemplates = async (token) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("swiftReplySelectedWorkSpace", async (obj) => {
      try {
        if (
          obj.swiftReplySelectedWorkSpace &&
          obj.swiftReplySelectedWorkSpace != ""
        ) {
          let aux = parseInt(obj.swiftReplySelectedWorkSpace);
          if (isTeam(aux)) {
            selectedTeam = aux;
            checkValidity();
          }
        }
        const response = await fetch(
          serverAddress + "/getTemplates/" + selectedTeam,
          requestOptions
        );
        const responseData = await response.json();

        templates = responseData;
        if (templateList.style.display === "block") {
          updateListContent();
        }
        resolve(templates);
      } catch (error) {
        reject(error.message);
      }
    });
  });
};

const fetchUserSettings = async (token) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  const response = await fetch(serverAddress + "/getSettings", requestOptions);
  const responseData = await response.json();
  let resp = JSON.parse(responseData.settingsQuickSelection);
  keyCodeForAutoComplete = resp.keyCode;
  keyCombForAutoComplete = resp.key;

  let listResp = JSON.parse(responseData.settingsOpenMenu);

  keyCodeForList = listResp.keyCode;
  keyCombForList = listResp.key;

  let enableResp = JSON.parse(responseData.settingsEnableExtension);

  keyCodeForExtensionEnable = enableResp.keyCode;
  keyCombForExtensionEnable = enableResp.key;

  isTyped = responseData.settingsIsAutoInsert;
  console.log("isTyped: " + isTyped);
};

function init() {
  chrome.runtime.sendMessage({ method: "UPDATE_TEAMS" }, () => {});
  chrome.runtime.sendMessage({ method: "CHECK_TOKEN" }, async function (res) {
    if (res.hasToken === true) {
      currentToken = res.token;
      await fetchSubscriptionInfo(res.token);
      chrome.runtime.sendMessage({ method: "GET_TEAMS" }, async (response) => {
        teams = response.teams;
        selectedTeam = response.selectedTeam;
        checkValidity();
        await fetchTemplates(res.token);
        await fetchUserSettings(res.token);

        snackbar.id = ["fastEmail-snackbar"];
        snackbar.innerHTML = `
        <span style="display: flex !important; justify-content: center !important; align-items: center !important; font-size: 1.3rem !important; font-weight: 600 !important; color: green !important;">
        <svg style="margin: 0 0.8rem !important;" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg>
        Copied To Clipboard</span>
        <div style="margin-top: 1.4rem !important; text-align: center !important; color: #6e747e !important;">
        <span>*Please paste the template content in case is not inserted.</span>
        </div>
        `;

        templateList.classList = ["fastEmail-dropdown"];

        templateList.style = "top: 0; left: 0; border: 2px solid #E5E7EB";
        templateList.style.display = "none";

        preview.classList.add("fastEmail-preview");

        previewTitle.classList.add("fastEmail-previewTitle");

        previewContent.classList.add("fastEmail-previewContent");

        let exitButton = document.createElement("div");

        exitButton.classList.add("fastEmail-exitButton");

        exitButton.innerHTML = `<svg style="width:10px; color: #31303d" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M376.6 427.5c11.31 13.58 9.484 33.75-4.094 45.06c-5.984 4.984-13.25 7.422-20.47 7.422c-9.172 0-18.27-3.922-24.59-11.52L192 305.1l-135.4 162.5c-6.328 7.594-15.42 11.52-24.59 11.52c-7.219 0-14.48-2.438-20.47-7.422c-13.58-11.31-15.41-31.48-4.094-45.06l142.9-171.5L7.422 84.5C-3.891 70.92-2.063 50.75 11.52 39.44c13.56-11.34 33.73-9.516 45.06 4.094L192 206l135.4-162.5c11.3-13.58 31.48-15.42 45.06-4.094c13.58 11.31 15.41 31.48 4.094 45.06l-142.9 171.5L376.6 427.5z"/></svg>`;
        exitButton.addEventListener("click", () => {
          preview.style.display = "none";
        });

        preview.appendChild(exitButton);
        preview.appendChild(previewTitle);
        preview.appendChild(previewContent);
        document.body.appendChild(preview);
        focusTaker.style = `
        opacity:0;
        position:absolute;
        top: -100vw;
        `;
        document.body.appendChild(focusTaker);

        elementList.classList.add("fastEmail-elementList");

        elementList.addEventListener("click", () => {
          if (
            document.activeElement.id === "inputCustomVariableField" &&
            isChosingCustomVariable
          )
            return;
          document.activeElement.blur();
          $(focusTaker).focus();
        });

        const fastEmail_holder = document.createElement("div");
        fastEmail_holder.classList.add("fastEmail-variables-holder");
        fastEmail_holder.style = `
        display: none;
        background: #000000d9;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        z-index: 99999999;
        `;

        fastEmail_holder.appendChild(elementList);

        document.body.appendChild(snackbar);

        document.body.appendChild(fastEmail_holder);

        document.body.appendChild(templateList);

        document.addEventListener("click", (e) => {
          var isClickInsideElement = templateList.contains(e.target);
          var isClickInsidePreview = preview.contains(e.target);

          if (isClickInsideElement || isClickInsidePreview) return;

          templateList.style.display = "none";

          // preview.style.display = "none";
        });

        setInterval(() => {
          checkForTriggers();
        }, 500);

        setInterval(() => {
           fetchUserSettings(currentToken);
        }, 1500);

      });

    } else {
    }
  });
}

const HtmlRestrictedSites = [
  "facebook",
  "twitter",
  "linkedin",
  "slack",
  "live",
  "zendesk",
  "whatsapp",
  "hubspot",
  "helpcrunch",
  "livechatinc",
];

const isHtmlRestricted = () => {
  const href = new URL(location.href);
  for (const website of HtmlRestrictedSites) {
    if (href.host.includes(website)) {
      return true;
    }
  }
  return false;
};

const isTwitter = () => {
  const href = new URL(location.href);
  return href.host.includes("twitter");
};
const isZendesk = () => {
  const href = new URL(location.href);
  return href.host.includes("zendesk");
};
const isHubspot = () => {
  const href = new URL(location.href);
  return href.host.includes("hubspot");
};
/**
 * Extract img src(es) and put them as a
 * text to be included in the stripped string
 * @param template string
 * @returns string
 */
const parseHtmlWithImgLinks = (template = "") => {
  const html = document.createElement("div");
  html.innerHTML = template;
  html.querySelectorAll("img").forEach((img) => img.before(` ${img.src} `));
  html.querySelectorAll("iframe").forEach((iframe) => iframe.before(` ${iframe.src} `));
  html.querySelectorAll("a").forEach((a) => a.after(` ${a.href} `));

  //console.log("html.innerHTML: " + html.innerHTML);
  //return remove_tags(html.innerHTML);

  return html.innerHTML.replace(/(<([^>]+)>)/gi, "");
};

function remove_tags(html) {
  html = html.replace(/<br>/g, "$br$");
  html = html.replace(/(?:\r\n|\r|\n)/g, "$br$");
  var tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  html = tmp.textContent || tmp.innerText;
  html = html.replace(/\$br\$/g, "\r\n");
  
  //console.log("html.removed_tags: " + html);

  return html;
}

/**
 * This is to make a late time fetch templates
 * to solves issues where user might updated codes
 * but did not refresh the page
 * @param lastWord string
 * @returns list of templates
 */
const updateTemplatesIfNeeded = async (lastWord = "") => {
  // Check if template with this code exists
  // Otherwise make fetch to see if there is added one(s)
  let currentTemplates = templates;
  const templateExist = currentTemplates.some((t) => t.shortcut === lastWord);
  if (!templateExist) {
    currentTemplates = await fetchTemplates(currentToken);
  }
  return currentTemplates;
};
/**
 * Save content into clipboard
 * use "useExecute = true" if you want to write HTML data
 * since its still not supported in FireFox
 * Otherwise default use is Navigator API
 * @param data string
 * @param isHTML boolean
 * @param useExecute boolean to avoid using Navigator API in some cases
 *
 */
const writeToClipboard = (data, isHTML = false, useExecute = false) => {
  if (!data) return;

  console.log("writeToClipboard: " + data);

  const showSnackBar = () => {
    // document.execCommand("paste");
    var x = document.getElementById("fastEmail-snackbar");
    x.className = "show";
    setTimeout(function () {
      x.className = x.className.replace("show", "");
    }, 3000);
  };

  if (useExecute) {
    // Implement when there is a need. Now extention only in Chrome
  } else {
    navigator.permissions.query({ name: "clipboard-write" }).then((res) => {
      if (res.state === "granted" || res.state === "prompt") {
        if (isHTML) {
          const html = new Blob([data], { type: "text/html" });
          const item = new ClipboardItem({ "text/html": html });
          navigator.clipboard.write([item]).then(showSnackBar);
          //.catch(); // Deal with failure?
        } else {
          navigator.clipboard.writeText([data]).then(showSnackBar);
          //.catch(); // Deal with failure?
        }
      } else {
        // Deal with failure?
      }
    });
  }
};

init();

let savedEvent;
let savedParent;
let savedAnchorSet;
let savedRange;
let savedLastWord;
let isDiv;

const getCaretTopPoint = () => {
  const sel = document.getSelection();
  const r = sel.getRangeAt(0);
  let rect;
  let r2;

  const node = r.startContainer;
  const offset = r.startOffset;
  if (offset > 0) {
    r2 = document.createRange();
    r2.setStart(node, offset - 1);
    r2.setEnd(node, offset);
    rect = r2.getBoundingClientRect();
    return { left: rect.right, top: rect.top };
  } else if (offset < node.length) {
    r2 = document.createRange();
    r2.setStart(node, offset);
    r2.setEnd(node, offset + 1);
    rect = r2.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  } else {
    rect = node.getBoundingClientRect();
    const styles = getComputedStyle(node);
    const lineHeight = parseInt(styles.lineHeight);
    const fontSize = parseInt(styles.fontSize);
    const delta = (lineHeight - fontSize) / 2;
    return { left: rect.left, top: rect.top + delta };
  }
};

let resolveFunc;
const clickEventOnVariables = (e) => {
  if (isChosingCustomVariable) {
    isChosingCustomVariable = false;
    setTimeout(() => {
      isChosingCustomVariable = true;
    }, 1);
    let options = $(elementList)
      .children()
      .not(".fastEmail-exitButton")
      .not(".fastEmail-variable-title");

    if (e.keyCode == 38) {
      options[selectedCustomVarOption].style.border = "1px solid #E5E7EB";

      if (selectedCustomVarOption > 0) selectedCustomVarOption--;

      options[selectedCustomVarOption].style.border = "3px solid #635afe";
    }
    if (e.keyCode == 40) {
      options[selectedCustomVarOption].style.border = "1px solid #E5E7EB";

      if (selectedCustomVarOption < options.length - 1)
        selectedCustomVarOption++;

      options[selectedCustomVarOption].style.border = "3px solid #635afe";
    }

    if (e.keyCode == 13) {
      e.preventDefault();
      if (!canChoseNow) {
        canChoseNow = true;
        return;
      }

      //resolveFunc(options[selectedCustomVarOption].textContent);

      resolveFunc(options[selectedCustomVarOption].childNodes[1].textContent);
    }
  }
};

const replaceCustomVariables = async (leftContent) => {
  let parts = leftContent.split("{{");
  let x = parts[0];
  if (parts.length <= 1) return leftContent;

  let partsAux1 = parts;
  partsAux1.shift();

  let rightParts = partsAux1.join("{{").split("}}");

  // if (rightParts.length == 0) return leftContent;
  const activeEl = document.activeElement;

  let optionsForCustomVariables = rightParts[0].split(",");

  //chose one of the options

  let chosePromise = new Promise((resolve, reject) => {
    resolveFunc = resolve;
    selectedCustomVarOption = 0;
    isChosingCustomVariable = true;
    elementList.innerHTML = "";
    elementList.style.display = "flex";
    elementList.parentElement.style.display = "flex";

    const variableTitle = document.createElement("p");
    variableTitle.style = `
      color: black;
      `;

    variableTitle.innerHTML = "Insert Variable";
    variableTitle.classList.add("fastEmail-variable-title");

    elementList.appendChild(variableTitle);

    var indexOpt = 0;

    for (let opt of optionsForCustomVariables) {
      const optItem = document.createElement("p");

      if (indexOpt == 0) {
        optItem.classList.add("fastEmail-optItem-selected");
        optItem.style = `
      border: 3px solid #635afe;
      `;
      } else {
        optItem.classList.add("fastEmail-optItem");
        optItem.style = `
      border: 1px solid #e5e7eb;
      `;
      }
      indexOpt++;

      const textElem = document.createElement("div");
      textElem.style = `
        display: none;
        align-items: center;
        justify-content: center;
      `;

      let TimeResult = getDateTime(opt);
      if (TimeResult.length > 0) {
        opt = TimeResult;
      }

      if (opt.startsWith("Show Input:")) {
        const inputElement = document.createElement("input");
        inputElement.id = "inputCustomVariableField";
        inputElement.style = `width: 100% !important; height: 50px !important; border: none; outline: none; border-radius: 8px; text-align: center; padding: 0;`;
        inputElement.placeholder = opt.substring(11, opt.length);
        optItem.classList.add("fastEmail-isInput");
        optItem.appendChild(inputElement);
        inputElement.addEventListener("keyup", (ve) => {
          // console.log("ok");
          if (ve.keyCode == 13) {
            resolve(ve.target.value);
            return;
          }
        });
      } else {

        const innertextElem = document.createElement("div");
        innertextElem.style = `
        align-items: center;
        justify-content: center;
        `;
        innertextElem.innerHTML = opt;

        optItem.appendChild(innertextElem);

        textElem.textContent = opt;
        optItem.appendChild(textElem);
        optItem.addEventListener("click", (ve) => {
          

          ve.preventDefault();
          ve.stopPropagation();

          //here don't change focus
          resolve(ve.target.childNodes[1].textContent);
        });
      }
      elementList.appendChild(optItem);
    }

    const variableTip = document.createElement("p");
    variableTip.style = `
      color: #88909B;
      `;

    variableTip.innerHTML = "Press Enter to continue - Arrows to move Up/Down";
    variableTip.classList.add("fastEmail-variable-title");

    elementList.appendChild(variableTip);

    let exitButton = document.createElement("div");

    exitButton.classList.add("fastEmail-exitButton");

    exitButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="2.2rem" height="2.2rem" fill="#88909B" class="bi bi-x" viewBox="0 0 16 16">
  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
</svg>`;
    exitButton.addEventListener("click", () => {
      elementList.style.display = "none";
      elementList.parentElement.style.display = "none";
    });

    elementList.appendChild(exitButton);
    setTimeout(() => {
      if (document.activeElement.id === "inputCustomVariableField") return;

      document.activeElement.blur();
      $(focusTaker).focus();
      document.activeElement.removeEventListener(
        "keyup",
        clickEventOnVariables
      );
      document.activeElement.addEventListener("keyup", clickEventOnVariables);
    }, 5);

    const cornerPosition = getCaretTopPoint();
    let posX, posY;
    if (cornerPosition.left == 0 && cornerPosition.top == 0) {
      let { left, top } = savedParent.getBoundingClientRect();

      const listHeight = $(templateList).height();
      const listWidth = $(templateList).width();

      let offSetX =
        left +
        (savedAnchorSet *
          parseInt(window.getComputedStyle(savedParent).fontSize)) /
          2;

      let offSetY = top; //every line is a new node

      if (offSetX + listWidth > window.innerWidth) {
        offSetX = window.innerWidth - listWidth - 20;
      }

      if (offSetY + listHeight > window.innerHeight) {
        offSetY = window.innerHeight - listHeight - 20;
      }

      posY = offSetY;
      posX = offSetX;
    } else {
      posY = cornerPosition.top;
      posX = cornerPosition.left;
    }
    //element list height
    if (posY + 200 > innerHeight) {
      posY -= 200;
    }

    if (posX + 300 > innerWidth) {
      posX -= 300;
    }

    //elementList.style.top = posY + "px";
    //elementList.style.left = posX + "px";

    //________________________________
  });

  let result = await chosePromise;
  activeEl.removeEventListener("keyup", clickEventOnVariables);

  isChosingCustomVariable = false;
  elementList.style.display = "none";
  elementList.parentElement.style.display = "none";

  rightParts.shift();
  return x + result + (await replaceCustomVariables(rightParts.join("}}")));
};

const replaceContent = async (lastWord, myRange, templateString, replace) => {
  const content = await replaceCustomVariables(templateString);

  let rangeOffSet = replace ? lastWord.length : 0;
  let position = myRange.startOffset - rangeOffSet;

  try {
    myRange.setEnd(myRange.endContainer, position);
    myRange.setStart(myRange.startContainer, position);
  } catch (ex) {}

  window.getSelection().removeAllRanges();
  window.getSelection().addRange(myRange);

  myRange = window.getSelection().getRangeAt(0);

  try {
    if (myRange.startOffset == myRange.startContainer.textContent.length) {
      position = myRange.startOffset - rangeOffSet;
      myRange.setStart(myRange.startContainer, position);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(myRange);
    } else {
      position = myRange.startOffset + rangeOffSet;
      myRange.setEnd(myRange.startContainer, position);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(myRange);
    }
  } catch (exp) {}

  if (isHtmlRestricted()) {
    console.log(content);
    const strippedString = parseHtmlWithImgLinks(content);
    console.log(strippedString);
    console.log(document.activeElement);
    if (isDiv && (isTwitter() || isZendesk() || isHubspot())) {
      document.execCommand("insertHTML", true, strippedString);
    } else {
      !replace && document.execCommand("insertText", true, strippedString[0]);
      setTimeout(() => {
        // if (!replace) {
        //   alert("ok");
        //   let myRange = window.getSelection().getRangeAt(0);
        //   let rangeOffSet = loadingTemplateString.length;
        //   let position = myRange.startOffset - rangeOffSet;

        //   try {
        //     myRange.setEnd(myRange.endContainer, position);
        //     myRange.setStart(myRange.startContainer, position);
        //   } catch (ex) {}

        //   window.getSelection().removeAllRanges();
        //   window.getSelection().addRange(myRange);

        //   myRange = window.getSelection().getRangeAt(0);

        //   try {
        //     if (
        //       myRange.startOffset == myRange.startContainer.textContent.length
        //     ) {
        //       position = myRange.startOffset - rangeOffSet;
        //       myRange.setStart(myRange.startContainer, position);
        //       window.getSelection().removeAllRanges();
        //       window.getSelection().addRange(myRange);
        //     } else {
        //       position = myRange.startOffset + rangeOffSet;
        //       myRange.setEnd(myRange.startContainer, position);
        //       window.getSelection().removeAllRanges();
        //       window.getSelection().addRange(myRange);
        //     }
        //   } catch (exp) {}
        // }
        setTimeout(() => {
          document.execCommand(
            "insertHTML",
            true,
            replace ? strippedString : strippedString.substring(1)
          );
        }, 100);
      }, 100);
    }
    writeToClipboard(strippedString);
  } else {
    console.log("here");
    document.execCommand("insertHTML", true, content);
    writeToClipboard(content, true);
  }
};

function updateListContent() {
  templateList.querySelector("ul").innerHTML = ``;
  let filteredTemplates = templates.filter(
    (template) =>
      template.name
        .toUpperCase()
        .indexOf(templateList.querySelector("input").value.toUpperCase()) > -1
  );

  for (let template of filteredTemplates) {
    let li = document.createElement("li");
    li.className = "fastEmail-item";

    li.innerHTML =
      `<div id="liClickableElement" class="liClickableElement">` +
      `<span class="fastEmail-item-shortcut">` +
      template.shortcut +
      `</span>` +
      template.name +
      `</div>`;

    $(li)
      .find("#liClickableElement")
      .bind("click", async function (event) {
        templateList.style.display = "none";
        // preview.style.display = "none";
        if (isDiv === false) {
          ///___________
          let caretPosition = savedEvent.target.selectionStart;

          const strippedString = parseHtmlWithImgLinks(template.content);
          let curContent = await replaceCustomVariables(strippedString);

          let newValue =
            savedEvent.target.value.substring(0, caretPosition) +
            curContent +
            savedEvent.target.value.substring(
              caretPosition,
              savedEvent.target.value.length
            );

          let newCaretPosition = caretPosition + curContent.length;
          $(savedEvent.target).val(newValue);
          savedEvent.target.dispatchEvent(
            new Event("input", { bubbles: true })
          );
          writeToClipboard(strippedString);
          ///_________
        } else {
          //make sure the div is not empty

          //select the last element
          replaceContent("", savedRange, template.content, false);

          //remove the last element
        }
      });

    const elem = document.createElement("div");
    // elem.style = `position:absolute; margin-left: 320px;`;
    elem.innerHTML += `<svg xmlns="http://www.w3.org/2000/svg" style="width:18px; /*transform:translateX(25px);*/" viewBox="0 0 576 512"><path d="M279.6 160.4C282.4 160.1 285.2 160 288 160C341 160 384 202.1 384 256C384 309 341 352 288 352C234.1 352 192 309 192 256C192 253.2 192.1 250.4 192.4 247.6C201.7 252.1 212.5 256 224 256C259.3 256 288 227.3 288 192C288 180.5 284.1 169.7 279.6 160.4zM480.6 112.6C527.4 156 558.7 207.1 573.5 243.7C576.8 251.6 576.8 260.4 573.5 268.3C558.7 304 527.4 355.1 480.6 399.4C433.5 443.2 368.8 480 288 480C207.2 480 142.5 443.2 95.42 399.4C48.62 355.1 17.34 304 2.461 268.3C-.8205 260.4-.8205 251.6 2.461 243.7C17.34 207.1 48.62 156 95.42 112.6C142.5 68.84 207.2 32 288 32C368.8 32 433.5 68.84 480.6 112.6V112.6zM288 112C208.5 112 144 176.5 144 256C144 335.5 208.5 400 288 400C367.5 400 432 335.5 432 256C432 176.5 367.5 112 288 112z"/></svg>`;
    li.appendChild(elem);
    templateList.querySelector("ul").appendChild(li);

    elem.addEventListener("click", (e) => {
      // if (preview.style.display == "flex") {
      //   preview.style.display = "none";
      //   return;
      // }
      // let xpos = e.clientX;
      // let ypos = e.clientY;

      // if (xpos + 300 >= innerWidth) xpos -= 300;
      // if (ypos + 200 >= innerHeight) ypos -= 200;

      preview.style.display = "flex";
      previewTitle.innerHTML = "<p>" + template.name + "</p>";
      previewContent.innerHTML = template.content;

      // preview.style.top = ypos + "px";
      // preview.style.left = xpos + "px";
    });
  }
}
let keyCodeForListChar;
function updateList() {
  // Fetch in background to update list if new added/edited
  fetchTemplates(currentToken);

  templateList.innerHTML = `
    <input type="search" class="fastEmail-dropdown-search" value="" placeholder="Search templates...">
    <ul class="fastEmail-dropdown-content">
    </ul>
  `;
  // templateList.querySelector("input").addEventListener("click", (e) => {
  //   preview.style.display = "none";
  // });
  templateList.querySelector("input").addEventListener("keyup", (e) => {
    updateListContent();
  });

  updateListContent();

  templateList.style.left = window.innerWidth / 2 - 250 + "px";
  templateList.style.top = window.innerHeight / 2 - 150 + "px";

  /*
  if (isDiv === false) {

    //calculate offset for Y
    let caretPosition = savedEvent.target.selectionStart;
    let offsetText = savedEvent.target.value.substring(0, caretPosition);

    //count how many rows
    const rows = [...offsetText].reduce((a, c) => a + (c === "\n" ? 1 : 0), 0);

    let arrays = offsetText.split("\n");

    var collumns = arrays[arrays.length - 1].length;

    let { left, top } = savedEvent.target.getBoundingClientRect();
    let offSetX =
      left + (collumns * parseInt(window.getComputedStyle(savedEvent.target).fontSize)) / 2;
    let offSetY = top + (rows * parseInt(window.getComputedStyle(savedEvent.target).fontSize)) / 2;

    if (offSetX + templateList.getBoundingClientRect().width > window.innerWidth) {
      offSetX -= templateList.getBoundingClientRect().width;
    }

    if (offSetY + templateList.getBoundingClientRect().height > window.innerHeight) {
      offSetY -= templateList.getBoundingClientRect().height;
    }

    console.log("window.innerWidth: " + window.innerWidth);

    templateList.style.left = ((window.innerWidth / 2) - 250) + "px";
    templateList.style.top = ((window.innerHeight / 2 ) - 150) + "px";

    //templateList.style.left = offSetX + "px";
    //templateList.style.top = offSetY + "px";

    //templateList.style.left = "50%";
    //templateList.style.top = "50%";
    //templateList.style.transform = "translate(-50%, -50%)";

  } else {
    
    let { left, top } = savedParent.getBoundingClientRect();

    const listHeight = $(templateList).height();
    const listWidth = $(templateList).width();

    let offSetX =
      left + (savedAnchorSet * parseInt(window.getComputedStyle(savedParent).fontSize)) / 2;

    let offSetY = top; //every line is a new node

    if (offSetX + listWidth > window.innerWidth) {
      offSetX = window.innerWidth - listWidth - 20;
    }

    if (offSetY + listHeight > window.innerHeight) {
      offSetY = window.innerHeight - listHeight - 20;
    }

    console.log("window.innerWidth: " + window.innerWidth);

    templateList.style.left = ((window.innerWidth / 2) - 250) + "px";
    templateList.style.top = ((window.innerHeight / 2 ) - 150) + "px";

    //templateList.style.left = offSetX + "px";
    //templateList.style.top = offSetY + "px";
    
    //templateList.style.left = "50%";
    //templateList.style.top = "50%";
    //templateList.style.transform = "translate(-50%, -50%)";

  }
  */
}

function isKeyCombValid(event, combPart) {
  for (let i = 0; i < combPart.length - 1; i++) {
    if (combPart[i] == "ALT" && !event.altKey) return false;
    if (combPart[i] == "SHIFT" && !event.shiftKey) return false;
    if (combPart[i] == "META" && !event.metaKey) return false;
    if (combPart[i] == "CTRL" && !event.ctrlKey) return false;
  }
  return true;
}
//autocomplete for text inputs and textareas
function autoCompleteInputs(event) {
  if (isSubscriptionActive == false || isTeamActive == false) return;
  if (templateList.style.display !== "none") {
    var $listItems = $(templateList).find("li");

    var key = event.keyCode;
    var $selected = $listItems.filter(".selected");
    var $current;

    if (![38, 40, 13].includes(key)) return;
    event.preventDefault();
    event.stopPropagation();

    $listItems.css("background-color", "#fff");
    $listItems.removeClass("selected");

    if (key == 40) {
      // Down key
      if (!$selected.length || $selected.is(":last-child")) {
        $current = $listItems.eq(0);
      } else {
        $current = $selected.next();
      }
    } else if (key == 38) {
      // Up key
      if (!$selected.length || $selected.is(":first-child")) {
        $current = $listItems.last();
      } else {
        $current = $selected.prev();
      }
    } else if (key == 13) {
      canChoseNow = false;
      $selected.find("#liClickableElement").trigger("click");
      return;
    }

    $current.addClass("selected");

    $current.css("background-color", "#d6d8e3");

    return;
  }

  // Clear node as long as it's not from list
  // inputFocuedNode = null;

  if (checkForEnableExtensionTrigger(event)) {
    event.preventDefault();
    return;
  }

  let combPartsList = keyCombForList.split("+");

  let keyListCombSatisfied = isKeyCombValid(event, combPartsList);

  if (event.keyCode === keyCodeForList && keyListCombSatisfied) {
    event.preventDefault();
  }

  let combParts = keyCombForAutoComplete.split("+");

  let keyCombSatisfied = isKeyCombValid(event, combParts);

  if (isTyped > 0) {
    if (event.keyCode === keyCodeForAutoComplete && keyCombSatisfied) {
      let caretPosition = event.target.selectionStart;
      let words = event.target.value.substring(0, caretPosition).split(" ");
      let lastWord = words[words.length - 1];
      for (let template of templates) {
        if (template.shortcut === lastWord) {
          event.preventDefault();
        }
      }
    }
  } else {
    let caretPosition = event.target.selectionStart;
    let words = event.target.value.substring(0, caretPosition).split(" ");
    let lastWord = words[words.length - 1];
    for (let template of templates) {
      if (template.shortcut === lastWord) {
        event.preventDefault();
      }
    }
  }

  try {
    chrome.runtime.sendMessage(
      { method: "EXTENSION_GET_STATE" },
      async function (statusResponse) {
        if (!statusResponse) return;

        let combPartsList = keyCombForList.split("+");

        let keyListCombSatisfied = isKeyCombValid(event, combPartsList);

        if (event.keyCode === keyCodeForList && keyListCombSatisfied) {
          keyCodeForListChar = event.key;
          isDiv = false;
          savedEvent = event;
          event.preventDefault();

          updateList();

          //Save current focus node
          inputFocuedNode = document.getSelection().focusNode;

          templateList.style.display = "block";
          return;
        }

        let combParts = keyCombForAutoComplete.split("+");

        let keyCombSatisfied = isKeyCombValid(event, combParts);

        if (isTyped > 0) {
          if (event.keyCode === keyCodeForAutoComplete && keyCombSatisfied) {
            let caretPosition = event.target.selectionStart;
            let words = event.target.value
              .substring(0, caretPosition)
              .split(" ");
            let lastWord = words[words.length - 1];

            const finalTemplates = await updateTemplatesIfNeeded(lastWord);
            for (let template of finalTemplates) {
              if (template.shortcut === lastWord) {
                console.log(
                  "template.shortcut: " + template.shortcut + " === " + lastWord
                );

                event.preventDefault();

                const strippedString = parseHtmlWithImgLinks(template.content);

                let curContent = await replaceCustomVariables(strippedString);
                //we have to replace the characters between [caretPosition-lastWord.size ... caretPosition] with our content
                let newValue =
                  event.target.value.substring(
                    0,
                    caretPosition - lastWord.length
                  ) +
                  curContent +
                  event.target.value.substring(
                    caretPosition,
                    event.target.value.length
                  );

                let newCaretPosition =
                  caretPosition + (curContent.length - lastWord.lenght);

                $(event.target).val(newValue);
                event.target.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
                writeToClipboard(newValue);
                return;
              }
            }

            console.log("keyCombSatisfied");
          }
        } else {
          let caretPosition = event.target.selectionStart;
          let words = event.target.value.substring(0, caretPosition).split(" ");
          let lastWord = words[words.length - 1];

          const finalTemplates = await updateTemplatesIfNeeded(lastWord);
          for (let template of finalTemplates) {
            if (template.shortcut === lastWord) {
              console.log(
                "template.shortcut: " + template.shortcut + " === " + lastWord
              );

              event.preventDefault();

              const strippedString = parseHtmlWithImgLinks(template.content);

              let curContent = await replaceCustomVariables(strippedString);
              //we have to replace the characters between [caretPosition-lastWord.size ... caretPosition] with our content
              let newValue =
                event.target.value.substring(
                  0,
                  caretPosition - lastWord.length
                ) +
                curContent +
                event.target.value.substring(
                  caretPosition,
                  event.target.value.length
                );

              let newCaretPosition =
                caretPosition + (curContent.length - lastWord.lenght);

              $(event.target).val(newValue);
              event.target.dispatchEvent(new Event("input", { bubbles: true }));
              writeToClipboard(newValue);
              return;
            }
          }
        }
      }
    );
  } catch (ex) {}
}

async function autoCompleteDivs(event) {
  if (isSubscriptionActive == false || isTeamActive == false) return;

  if (templateList.style.display !== "none") {
    var $listItems = $(templateList).find("li");

    var key = event.keyCode;
    var $selected = $listItems.filter(".selected");
    var $current;

    if (![38, 40, 13].includes(key)) return;

    event.preventDefault();
    event.stopPropagation();

    $listItems.css("background-color", "#fff");
    $listItems.removeClass("selected");

    if (key == 40) {
      // Down key
      if (!$selected.length || $selected.is(":last-child")) {
        $current = $listItems.eq(0);
      } else {
        $current = $selected.next();
      }
    } else if (key == 38) {
      // Up key
      if (!$selected.length || $selected.is(":first-child")) {
        $current = $listItems.last();
      } else {
        $current = $selected.prev();
      }
    } else if (key == 13) {
      canChoseNow = false;
      $selected.find("#liClickableElement").trigger("click");

      return;
    }

    $(templateList).animate(
      {
        scrollTop:
          $current.offset().top -
          $(templateList).offset().top +
          $(templateList).scrollTop() -
          50,
      },
      100
    );

    $current.addClass("selected");

    $current.css("background-color", "#dadbe8");

    return;
  }

  if (checkForEnableExtensionTrigger(event)) {
    event.preventDefault();
    return;
  }

  let combPartsList = keyCombForList.split("+");

  let keyListCombSatisfied = isKeyCombValid(event, combPartsList);

  if (event.keyCode === keyCodeForList && keyListCombSatisfied) {
    event.preventDefault();
  }

  let combParts = keyCombForAutoComplete.split("+");

  let keyCombSatisfied = isKeyCombValid(event, combParts);

  if (isTyped > 0) {
    if (event.keyCode === keyCodeForAutoComplete && keyCombSatisfied) {
      var selection = window.getSelection();
      let caretPosition = selection.anchorOffset;
      let node = selection.anchorNode.parentNode;
      let value = node.textContent;
      let words = value.substring(0, caretPosition).split(" ");
      let lastWord = words[words.length - 1];

      const finalTemplates = await updateTemplatesIfNeeded(lastWord);
      for (let template of finalTemplates) {
        if (template.shortcut === lastWord) {
          event.preventDefault();
          break;
        }
      }
    }
  } else {
    var selection = window.getSelection();
    let caretPosition = selection.anchorOffset;
    let node = selection.anchorNode.parentNode;
    let value = node.textContent;
    let words = value.substring(0, caretPosition).split(" ");
    let lastWord = words[words.length - 1];

    const finalTemplates = await updateTemplatesIfNeeded(lastWord);
    for (let template of finalTemplates) {
      if (template.shortcut === lastWord) {
        event.preventDefault();
        break;
      }
    }
  }

  chrome.runtime.sendMessage(
    { method: "EXTENSION_GET_STATE" },
    function (statusResponse) {
      if (!statusResponse) return;
      var selection = window.getSelection();
      let caretPosition = selection.anchorOffset;
      let node = selection.anchorNode.parentNode;
      let value = node.textContent;
      let words = value.substring(0, caretPosition).split(" ");
      let lastWord = words[words.length - 1];

      selection = window.getSelection();
      savedRange = selection.getRangeAt(0);
      savedAnchorSet = selection.anchorOffset;
      savedParent = selection.anchorNode.parentNode;

      let combParts = keyCombForList.split("+");

      let listKeyCombSatisfied = isKeyCombValid(event, combParts);

      if (event.keyCode === keyCodeForList && listKeyCombSatisfied) {
        keyCodeForListChar = event.key;
        isDiv = true;
        savedEvent = event;
        savedLastWord = lastWord;

        if (isHtmlRestricted() == false) {
          event.preventDefault();
        }
        updateList();

        //Save current focus node
        inputFocuedNode = document.getSelection().focusNode;

        templateList.style.display = "block";
        return;
      }

      let combListParts = keyCombForAutoComplete.split("+");

      let keyCombSatisfied = isKeyCombValid(event, combListParts);

      if (isTyped > 0) {
        if (event.keyCode === keyCodeForAutoComplete && keyCombSatisfied) {
          for (let template of templates) {
            if (template.shortcut === lastWord) {
              console.log(
                "template.shortcut: " + template.shortcut + " === " + lastWord
              );

              event.preventDefault();
              event.stopPropagation();
              //we have to replace the characters between [caretPosition-lastWord.size ... caretPosition] with our content

              //write the new content at the new selection range
              let myRange = window.getSelection().getRangeAt(0);

              //Save current focus node
              inputFocuedNode = document.getSelection().focusNode;

              replaceContent(lastWord, myRange, template.content, true);
              break;
            }
          }
        }
      } else {
        for (let template of templates) {
          if (template.shortcut === lastWord) {
            console.log(
              "template.shortcut: " + template.shortcut + " === " + lastWord
            );

            event.preventDefault();
            event.stopPropagation();
            //we have to replace the characters between [caretPosition-lastWord.size ... caretPosition] with our content

            //write the new content at the new selection range
            let myRange = window.getSelection().getRangeAt(0);

            //Save current focus node
            inputFocuedNode = document.getSelection().focusNode;

            replaceContent(lastWord, myRange, template.content, true);
            break;
          }
        }
      }
    }
  );
}

function checkForTriggers() {
  let element = document.activeElement;

  if ($(element).is("input") || $(element).is("textarea")) {
    //autocomplete
    $(element).unbind("keydown.fastEmailEvents");
    $(element).bind("keydown.fastEmailEvents", autoCompleteInputs);

    //remove trigger when blur
    $(element).bind("blur.fastEmailEvents", function (event) {
      $(event.target).unbind("keydown.fastEmailEvents");
      $(event.target).unbind("blur.fastEmailEvents");
    });
  } else if ($(element).is("[contenteditable]")) {
    //autocomplete
    $(element).unbind("keydown.fastEmailEvents");
    $(element).bind("keydown.fastEmailEvents", autoCompleteDivs);

    //remove trigger when blur
    $(element).bind("blur.fastEmailEvents", function (event) {
      $(event.target).unbind("keydown.fastEmailEvents");
      $(event.target).unbind("blur.fastEmailEvents");
    });
  }
}

/* THIS DATE & TIME CUSTOM VARIABLES */
function getDateTime(option) {
  console.log("date: " + option.toString());

  const d = new Date();

  let value = option.substring(option.indexOf(":") + 1);
  let xTime = new Date(
    new Date().setDate(new Date().getDate() + parseInt(value))
  );

  if (option.includes("getDayAsNumber")) {
    let result = xTime.toString().substring(4, 10).substring(4);
    option = result; //result.substring(result.indexOf("0") + 1);
  } else if (option.includes("getDayOfWeek")) {
    let result = xTime.toString().substring(0, 3);

    result = result.substring(result.indexOf("0") + 1);

    for (var i = 0; i < days.length; i++) {
      if (days[i].includes(result)) {
        result = days[i];
      }
    }

    option = result;
  } else if (option.includes("getMonthAsNumber")) {
    let result = xTime.toString().substring(4, 7);

    for (var i = 0; i < months.length; i++) {
      if (months[i].includes(result)) {
        result = i;
      }
    }

    option = result;
  } else if (option.includes("getMonth")) {
    let result = xTime.toString().substring(4, 7);

    for (var i = 0; i < months.length; i++) {
      if (months[i].includes(result)) {
        result = months[i];
      }
    }

    option = result;
  } else if (option.includes("getYear")) {
    option = xTime.toString().substring(4, 15).substring(7);
  } else if (option.includes("getShortYear")) {
    option = xTime.toString().substring(4, 16).substring(9);
  } else if (option.includes("getISODate")) {
    let YY = xTime.toString().substring(4, 15).substring(7);

    let MM = xTime.toString().substring(4, 7);

    for (var i = 0; i < months.length; i++) {
      if (months[i].includes(MM)) {
        MM = i;
      }
    }

    let DD = xTime.toString().substring(4, 10).substring(4);
    //DD = DD.substring(DD.indexOf("0") + 1);

    option = YY + "-" + MM + "-" + DD;
  } else if (option.includes("getShortDate")) {
    option = xTime.toString().substring(4, 15);
  } else if (option.includes("getLongDate")) {
    option = xTime.toString().substring(0, 15);
  }

  return option.toString();
}
