var installed,
  debugblaze = !1,
  lastDebugTimestamp = 0;
const CURSOR_PLACEHOLDER = "[{!~TB!!/]";
if (installed);
else {
  function documentContainsNode(e) {
    if (!e.isConnected) return !1;
    let t = e.getRootNode();
    return !(t instanceof win(e).ShadowRoot) || documentContainsNode(t.host);
  }
  function promiseDelay(e = 0) {
    return new Promise((t) => setTimeout(t, e));
  }
  function promiseSendMessage(e) {
    return new Promise((t) => n.runtime.sendMessage(e, t));
  }
  function selectionForElement(e) {
    return e.getRootNode().getSelection();
  }
  function documentActive(e = document, t = !0) {
    let n;
    if (((n = e.host ? e.host.ownerDocument : e), t && !n.hasFocus()))
      try {
        if (n.defaultView.parent && n.defaultView.parent !== n.defaultView)
          return (n = n.defaultView.parent), documentActive(n.document);
      } catch (e) {}
    let o = e.activeElement;
    if (o.shadowRoot) return documentActive(o.shadowRoot);
    if (t && o instanceof win(o).HTMLIFrameElement)
      try {
        return documentActive(o.contentWindow.document);
      } catch (e) {
        return o;
      }
    return o;
  }
  function win(e) {
    return e.ownerDocument.defaultView;
  }
  function debug() {
    debugblaze &&
      (lastDebugTimestamp > 0 &&
        console.log("+ " + (Date.now() - lastDebugTimestamp) + " ms"),
      (lastDebugTimestamp = Date.now()),
      console.log.apply(
        null,
        [...arguments].map((e) => (e instanceof Function ? e() : e))
      ));
  }
  function allowedToInsert(e) {
    return !(
      s.includes(document.location.host) && !e.classList.contains("allow-blaze")
    );
  }
  function getBrowser() {
    return window.chrome
      ? window.chrome
      : window.browser
      ? window.browser
      : void 0;
  }
  function extensionActive() {
    try {
      return !(!n.runtime || !n.runtime.getManifest());
    } catch (e) {
      return !1;
    }
  }
  installed = !0;
  class e {
    constructor() {
      (this.stream = []),
        (this.baseResetTimeout = 2e3),
        (this.resetTimeout = this.baseResetTimeout),
        (this.timer = null);
    }
    setResetTimeout(e) {
      this.resetTimeout = Math.max(e || this.baseResetTimeout, 800);
    }
    resetTimer() {
      this.timer && clearTimeout(this.timer),
        (this.timer = setTimeout(
          () => this.empty("timeout " + this.resetTimeout),
          this.resetTimeout
        ));
    }
    add(e, t, n) {
      if (n === r.return) return this.empty("return");
      this.resetTimer(),
        this.stream.push(t),
        lookupShortcuts(e, this.toString()),
        /\s/.test(t) && this.empty("whitespace");
    }
    pop() {
      debug("[POP CHARACTER FROM STREAM]"), this.stream.pop();
    }
    empty(e = "") {
      debug("[CLEAR STREAM]", e),
        this.timer && (clearTimeout(this.timer), (this.timer = null)),
        (this.stream.length = 0);
    }
    toString() {
      return this.stream.join("");
    }
  }
  const t = navigator.appVersion.includes("Mac"),
    n = getBrowser(),
    o = "action-focus_",
    r = {
      backspace: 8,
      tab: 9,
      return: 13,
      escape: 27,
      space: 32,
      left: 37,
      right: 39,
      up: 38,
      down: 40,
    },
    i =
      'textarea,input,*[contenteditable=true],[contenteditable=""],[contenteditable=plaintext-only]',
    a = 'iframe[src*=":"], iframe[src=""], iframe:not([src])',
    s = ["https://app.swiftreply.net", "dashboard.blaze.today"],
    l = new e();
  document.addEventListener("selectionchange", () => {
    if (!extensionActive()) return;
    let e = documentActive();
    isEditable(e) &&
      (T.has(e) || registerElement(e),
      e.isContentEditable && !u.has(e) && observeIntersection(e));
  });
  let d = 200;
  function pollDesignMode() {
    if ("on" === document.designMode.toLowerCase())
      registerElement(document.documentElement);
    else {
      if (((d *= 2), d > 3e5)) return;
      setTimeout(pollDesignMode, d);
    }
  }
  setTimeout(pollDesignMode, d);
  const c = new MutationObserver(function (e) {
      for (let t = 0; t < e.length; t++) {
        let n = e[t];
        if ("childList" === n.type && n.addedNodes.length)
          for (let e = 0; e < n.addedNodes.length; e++) {
            let t = n.addedNodes[e];
            1 === t.nodeType &&
              (t.matches(i)
                ? registerElement(t)
                : registerElement(t.querySelectorAll(i)),
              t instanceof HTMLIFrameElement && t.matches(a)
                ? checkIFrames(t)
                : checkIFrames(t.querySelectorAll(a)));
          }
        else
          "attributes" === n.type &&
            "contenteditable" === n.attributeName.toLowerCase() &&
            registerElement(n.target);
      }
    }),
    u = new WeakMap(),
    m = new IntersectionObserver(
      (e) => {
        e.forEach((e) => {
          u.set(e.target, e.isIntersecting);
        });
      },
      { threshold: 0 }
    );
  function observeIntersection(e) {
    m.observe(e);
  }
  let f = !1;
  function keyDownEventListener(e) {
    if (e.isTrusted && !e.blazeHandled) {
      (e.blazeHandled = !0), debug("[KEYDOWN]", e.keyCode, e), l.resetTimer();
      let n = e.keyCode;
      if (229 === n && "Unidentified" === e.key)
        return debug("[IME_KEYCODE_229]", e), void (f = !0);
      (f = !1),
        n === r.left || n === r.right || n === r.down || n === r.up
          ? l.empty("selection change")
          : n === r.return
          ? l.empty("return")
          : n === r.tab
          ? l.empty("tab")
          : n === r.backspace
          ? e.ctrlKey || e.metaKey || e.altKey
            ? l.empty("batch delete")
            : l.pop()
          : 65 === n &&
            ((t && e.metaKey) || e.ctrlKey) &&
            l.empty("selecting all");
    }
  }
  let p = !1;
  function keyPressEventListener(e) {
    if (!e.isComposing && e.isTrusted && !e.blazeHandled) {
      (e.blazeHandled = !0),
        debug("[KEYPRESS]", e.keyCode, e),
        debug("[IS COMPOSING FALSE]"),
        (p = !1);
      const t = e.target;
      if (!allowedToInsert(t)) return;
      l.add(t, e.key, e.keyCode);
    }
  }
  function beforeInputEventListener(e) {
    if (
      e.isTrusted &&
      !e.blazeHandled &&
      (e.isComposing || f) &&
      e.inputType.startsWith("insert")
    ) {
      (e.blazeHandled = !0), debug("[BEFORE INPUT]", e);
      const t = e.target;
      if (
        (debug("[BEFORE INPUT STATUS]", e.isComposing, f),
        (p = e.isComposing),
        (f = !1),
        !allowedToInsert(t))
      )
        return;
      l.resetTimer(),
        "insertCompositionText" === e.inputType
          ? lookupShortcuts(t, l.toString() + e.data)
          : l.add(t, e.data, e.data.charCodeAt(0));
    }
  }
  function isEditable(e) {
    return (
      !!e &&
      !!allowedToInsert(e) &&
      ((e instanceof win(e).HTMLInputElement && isInputEditable(e)) ||
        e instanceof win(e).HTMLTextAreaElement ||
        e.isContentEditable ||
        "on" === e.ownerDocument.designMode.toLowerCase())
    );
  }
  function isInputEditable(e) {
    return ![
      "submit",
      "button",
      "reset",
      "radio",
      "range",
      "radio",
      "image",
      "file",
      "color",
      "checkbox",
    ].includes(e.type);
  }
  function lookupShortcuts(e, t) {
    extensionActive() &&
      (debug("[LOOKUP SHORTCUT]", t),
      n.runtime.sendMessage(
        { request: "getReplacement", shortcut: t },
        function (n) {
          debug("[GET REPLACEMENT - LOOKUP]", t, n),
            n &&
              (n.replacement
                ? insertReplacement(e, n.shortcut, n.replacement, n.snippetType)
                : n.formId &&
                  ((y[n.formId] = !0), saveFocusAndSelection(n.formId)));
        }
      ));
  }
  function insertCursorPlaceholderAtPosition(e, t, n = !1) {
    return e && null !== t
      ? (n && (t = e.length - t), e.slice(0, t) + "[{!~TB!!/]" + e.slice(t))
      : e;
  }
  function insertReplacement(e, t, n, r, i) {
    let a = 0;
    function s() {
      n.length
        ? setTimeout(() => {
            (e = documentActive()), d();
          }, 50)
        : l.empty("insert finished");
    }
    async function d() {
      let i = !1;
      if (n.length) {
        let l = n.shift();
        if ("string" === l.type) {
          function d(e) {
            let t,
              n = null;
            for (let t = e.length - 1; t >= 0; t--) {
              let o = e[t];
              if ("string" != typeof o && "cursor" === o.tag) {
                n = t;
                break;
              }
            }
            return (
              (t =
                null !== n
                  ? e.filter(
                      (e) => (
                        "string" != typeof e && "cursor" === e.tag && n--,
                        "string" == typeof e
                      )
                    )
                  : e.slice()),
              { lastCursorIndex: n, cleanedParts: t }
            );
          }
          let n = { textStr: "", htmlStr: void 0 },
            o = d(l.textStrArr);
          for (let e of o.cleanedParts) n.textStr += e;
          let a,
            c,
            u,
            m = null;
          if (l.htmlStrArr) {
            (n.htmlStr = ""), (a = d(l.htmlStrArr));
            for (let e of a.cleanedParts) n.htmlStr += e;
            if (null !== a.lastCursorIndex) {
              m = 0;
              for (
                let e = a.lastCursorIndex + 1;
                e < a.cleanedParts.length;
                e++
              )
                m += a.cleanedParts[e].length;
            }
          }
          i = !0;
          let f = documentActive();
          (f &&
            (f instanceof win(f).HTMLInputElement ||
              f instanceof win(f).HTMLTextAreaElement)) ||
          "text" === r ||
          void 0 === n.htmlStr ||
          (f && "plaintext-only" === f.getAttribute("contenteditable"))
            ? ((c = !!n.textStr), (u = "text"))
            : ((c = !!n.htmlStr), (u = "html"));
          let p = "INPUT" === insertionMode(e, t),
            E = null;
          if ("html" !== u || null === a.lastCursorIndex || p) {
            if ("text" === u && null !== o.lastCursorIndex) {
              E = 0;
              for (
                let e = o.cleanedParts.length - 1;
                e > o.lastCursorIndex;
                e--
              )
                E += o.cleanedParts[e].length;
            }
          } else {
            let e = 0;
            for (let t = a.cleanedParts.length - 1; t > a.lastCursorIndex; t--)
              e += a.cleanedParts[t].length;
            e = n.htmlStr.length - e;
            let { count: t } = await promiseSendMessage({
              request: "insertionStats",
              contents: insertCursorPlaceholderAtPosition(n.htmlStr, e),
              cursor: "[{!~TB!!/]",
            });
            E = t;
          }
          (t || c) &&
            (debug("[INSERTING]", t, n.textStr || n.htmlStr, n, e, u),
            (n.textStr = n.textStr.replace(
              new RegExp(String.fromCharCode(160), "g"),
              " "
            )),
            "INPUT" === insertionMode(e, t)
              ? insertInputTextarea(e, t, n.textStr, E)
              : await insertContentEditable(e, t, n, u, {
                  cursorEndOffset: E,
                  cursorEndOffsetHTML: m,
                }),
            (t = "")),
            s();
        } else
          "key" === l.tag
            ? sendKey(l.info)
            : "click" === l.tag
            ? e.click()
            : "action" === l.tag
            ? "action_start" === l.info.type
              ? (saveFocusAndSelection(o + a), a++)
              : "action_end" === l.info.type
              ? (a--,
                restoreFocusAndSelection(o + a),
                (i = !0),
                setTimeout(s, 120))
              : console.log("Unknown form type: ", l.type, l.tag, l.info.type)
            : "wait" === l.tag
            ? ((i = !0), setTimeout(s, 1e3 * l.info.delay))
            : console.log("Unknown action type: ", l.type, l.tag);
        i || s();
      } else l.empty("no replacements length");
    }
    p &&
      !i &&
      (debug("[CLEARING COMPOSITION]"),
      saveFocusAndSelection("ime_clear"),
      e.blur(),
      restoreFocusAndSelection("ime_clear")),
      l.empty("inserted replacement"),
      debug("[INSERT REPLACEMENT]", t, n.slice(), e, r),
      d();
  }
  function insertionMode(e, t) {
    return ((e instanceof win(e).HTMLInputElement && isInputEditable(e)) ||
      e instanceof win(e).HTMLTextAreaElement) &&
      e.value.toLocaleLowerCase().includes(t.toLocaleLowerCase())
      ? "INPUT"
      : "CONTENTEDITABLE";
  }
  function insertInputTextarea(e, t, n, o) {
    debug("[INPUT/TEXTAREA INSERT]", n);
    let r,
      i,
      a = getCursorLocation(e);
    a
      ? ((r = a.start - t.length), (i = void 0 !== a.end ? a.end : a.start))
      : ((r = e.value.toLocaleLowerCase().lastIndexOf(t.toLocaleLowerCase())),
        -1 === r && (r = e.value.length - t.length),
        (i = r + t.length));
    let s = e.value,
      l = s.slice(0, r),
      d = s.slice(i);
    e instanceof HTMLInputElement && (n = n.replace(/\r\n?|\n/g, " ")),
      (e.value = l + n + d),
      moveCursorInputTextarea(e, r + n.length - o);
    let c = new (win(e).Event)("input", { bubbles: !0, cancelable: !0 });
    e.dispatchEvent(c);
  }
  function _TBRemapExecCommand() {
    let e = document.execCommand.bind(document);
    document.execCommand = function () {
      if ("1" === document.body.dataset.__TB_execCommand) {
        document.body.dataset.__TB_execCommand_pending = "1";
        let t = arguments;
        return (
          Promise.resolve().then(() => {
            e(...t), (document.body.dataset.__TB_execCommand_finished = "1");
          }),
          !0
        );
      }
      return e(...arguments);
    };
  }
  function SendKeyEvent(e, t, n) {
    let o,
      i = documentActive() || document,
      a = i.ownerDocument;
    function s(t) {
      let n,
        o = e.keyCode;
      if (o === r.backspace) {
        if ("input" === t) return void a.execCommand("delete");
        n = new (win(i).InputEvent)(t, {
          inputType: "deleteContentBackward",
          data: null,
          bubbles: !0,
          composed: !0,
          cancelable: !0,
          isComposing: !1,
        });
      } else if (1 === e.key.length || e.keyCode === r.space) {
        let o = e.keyCode === r.space ? " " : e.key;
        "input" === t
          ? a.execCommand("insertText", !1, o)
          : (n = new (win(i).InputEvent)(t, {
              inputType: "insertText",
              data: o,
              bubbles: !0,
              composed: !0,
              cancelable: !0,
              isComposing: !1,
            }));
      } else
        o === r.return &&
          (i instanceof win(i).HTMLInputElement
            ? "beforeinput" === t &&
              (n = new (win(i).InputEvent)(t, {
                inputType: "insertLineBreak",
                data: null,
                bubbles: !0,
                composed: !0,
                cancelable: !0,
                isComposing: !1,
              }))
            : "input" === t
            ? a.execCommand("insertParagraph")
            : (n = new (win(i).InputEvent)(t, {
                inputType: "insertParagraph",
                data: null,
                bubbles: !0,
                composed: !0,
                cancelable: !0,
                isComposing: !1,
              })));
      if (n) return i.dispatchEvent(n), n.defaultPrevented;
    }
    function l(t) {
      let n = {
        keyCode: e.keyCode,
        which: e.keyCode,
        bubbles: !0,
        cancelable: !0,
        shiftKey: e.shift,
        ctrlKey: e.ctrl,
        altKey: e.alt,
        metaKey: e.cmd,
        composed: !0,
        composing: !1,
      };
      if (1 === e.key.length) {
        let t = {
          "-0": "Digit0",
          "-1": "Digit1",
          "-2": "Digit2",
          "-3": "Digit3",
          "-4": "Digit4",
          "-5": "Digit5",
          "-6": "Digit6",
          "-7": "Digit7",
          "-8": "Digit8",
          "-9": "Digit9",
          "-a": "KeyA",
          "-b": "KeyB",
          "-c": "KeyC",
          "-d": "KeyD",
          "-e": "KeyE",
          "-f": "KeyF",
          "-g": "KeyG",
          "-h": "KeyH",
          "-i": "KeyI",
          "-j": "KeyJ",
          "-k": "KeyK",
          "-l": "KeyL",
          "-m": "KeyM",
          "-n": "KeyN",
          "-o": "KeyO",
          "-p": "KeyP",
          "-q": "KeyQ",
          "-r": "KeyR",
          "-s": "KeyS",
          "-t": "KeyT",
          "-u": "KeyU",
          "-v": "KeyV",
          "-w": "KeyW",
          "-x": "KeyX",
          "-y": "KeyY",
          "-z": "KeyZ",
          "-;": "Semicolon",
          "-=": "Equal",
          "-,": "Comma",
          "--": "Minus",
          "-.": "Period",
          "-/": "Slash",
          "-`": "Backquote",
          "-[": "BracketLeft",
          "-\\": "Backslash",
          "-]": "BracketRight",
          "-'": "Quote",
        }["-" + e.key.toLowerCase()];
        (n.key = e.key), t && (n.code = t);
      } else {
        let t = {
          backspace: "Backspace",
          tab: "Tab",
          enter: "Enter",
          return: "Enter",
          escape: "Escape",
          leftarrow: "ArrowLeft",
          rightarrow: "ArrowRight",
          uparrow: "ArrowUp",
          downarrow: "ArrowDown",
          space: "Space",
        }[e.key];
        t && ((n.code = t), "space" === e.key ? (n.key = " ") : (n.key = t));
      }
      1 === n.key.length && (n.charCode = e.key.charCodeAt(0));
      let o = new (win(i).KeyboardEvent)(t, n);
      return i.dispatchEvent(o), o.defaultPrevented;
    }
    const d =
        e.keyCode === r.return || e.keyCode === r.space || 1 === e.key.length,
      c = !(e.ctrl || e.cmd || e.alt) && d,
      u = !(e.ctrl || e.cmd || e.alt) && (d || e.keyCode === r.backspace);
    if (
      (n &&
        c &&
        i.dispatchEvent(new (win(i).CompositionEvent)("compositionstart")),
      l("keydown") && (o = "keydown"),
      !o && d && l("keypress") && (o = "keypress"),
      ["SELECT", "INPUT", "TEXTAREA"].includes(i.nodeName) ||
        "yes" === a.designMode.toLowerCase() ||
        i.isContentEditable)
    ) {
      if (
        (!o && u && s("beforeinput") && (o = "beforeinput"),
        !o &&
          e.keyCode === r.return &&
          ["SELECT", "INPUT", "TEXTAREA"].includes(i.nodeName))
      ) {
        let e = new (win(i).Event)("change", { bubbles: !0, cancelable: !1 });
        i.dispatchEvent(e);
      }
      n &&
        c &&
        i.dispatchEvent(
          new (win(i).CompositionEvent)("compositionupdate", { data: e.key })
        ),
        !o && u && s("input") && (o = "input");
    }
    l("keyup"),
      n &&
        c &&
        i.dispatchEvent(
          new (win(i).CompositionEvent)("compositionend", { data: e.key })
        ),
      o && (a.body.dataset[t] = o);
  }
  n.runtime.onMessage.addListener(function (e, t, o) {
    if ("complete" === e.type) {
      debug("[MESSAGE - complete]", e);
      let t = documentActive(document, !e.validateFocus);
      if (e.validateFocus && !isEditable(t)) return;
      n.runtime.sendMessage(
        { request: "getReplacement", snippetId: e.snippetId },
        function (e) {
          debug("[GET REPLACEMENT - complete]", e),
            e &&
              (e.replacement
                ? insertReplacement(t, "", e.replacement, e.snippetType)
                : e.formId && saveFocusAndSelection(e.formId));
        }
      );
    } else if ("insert_snippet" === e.type) {
      debug("[MESSAGE - insert_snippet]", e);
      const t = 200;
      let n = 5,
        o = Date.now();
      function r() {
        return Date.now() - o;
      }
      !(function o() {
        if (!document.hasFocus() && r() < t)
          return setTimeout(() => o(), n), void (n *= 1.5);
        let i = e.data.formId && g[e.data.formId].focusedElement,
          a = i && documentContainsNode(i);
        !(async function o() {
          let s = r();
          if (i && a && !isEditable(i) && s < t)
            return setTimeout(() => o(), n), void (n *= 1.5);
          s >= t && console.warn("Max insertion delay");
          let l = "";
          if (e.data.formId) {
            let t = restoreFocusAndSelection(e.data.formId);
            y[e.data.formId] &&
              ((l = e.data.shortcut), delete y[e.data.formId]),
              t && (debug("[RESTORE FOCUS DELAY]"), await promiseDelay(120));
          }
          insertReplacement(
            documentActive(),
            l,
            e.data.replacement,
            e.data.snippetType,
            !!e.data.formId
          );
        })();
      })();
    } else if ("editable_check" === e.type) {
      isEditable(documentActive()) && o(!0);
    }
  });
  let E = document.createElement("script");
  (E.textContent =
    _TBRemapExecCommand.toString() + "; _TBRemapExecCommand(); "),
    (document.head || document.documentElement).appendChild(E),
    E.remove();
  const b = Math.random().toString(36).substring(7);
  let h = 0;
  function sendKey(e) {
    let n = e.key.toLowerCase();
    (e.keyCode =
      "escape" === n
        ? r.escape
        : "tab" === n
        ? r.tab
        : "backspace" === n
        ? r.backspace
        : "enter" === n || "return" === n
        ? r.return
        : "leftarrow" === n
        ? r.left
        : "rightarrow" === n
        ? r.right
        : "uparrow" === n
        ? r.up
        : "downarrow" === n
        ? r.down
        : "space" === n || " " === n
        ? r.space
        : n.toUpperCase().charCodeAt(0)),
      debug("[SEND KEY]", e.keyCode, e);
    const o = "TBDefaultPrevented" + b + "id" + h++;
    SendKeyEvent(e, o, p);
    let i = documentActive(),
      a = i && i.ownerDocument;
    if (e.keyCode === r.tab && "keydown" !== a.body.dataset[o]) {
      if (
        i &&
        (i instanceof win(i).HTMLInputElement ||
          i instanceof win(i).HTMLTextAreaElement)
      ) {
        let e = new (win(i).Event)("change", { bubbles: !0, cancelable: !1 });
        i.dispatchEvent(e);
      }
      e.shift ? tabPrev() : tabNext(),
        (i = documentActive()),
        i && i instanceof win(i).HTMLInputElement && i.select();
    } else if (e.keyCode === r.left && "keydown" !== a.body.dataset[o])
      selectionForElement(i).modify("move", "left", "character");
    else if (e.keyCode === r.right && "keydown" !== a.body.dataset[o])
      selectionForElement(i).modify("move", "right", "character");
    else if (
      65 !== e.keyCode ||
      !((t && e.cmd) || e.ctrl) ||
      e.shift ||
      e.alt ||
      "keydown" === a.body.dataset[o]
    ) {
      if (
        e.keyCode === r.return &&
        "keydown" !== a.body.dataset[o] &&
        i &&
        i instanceof win(i).HTMLInputElement &&
        "keypress" !== a.body.dataset[o]
      ) {
        let e = i.closest("form");
        if (e) {
          let t = e.querySelectorAll("input"),
            n = e.querySelectorAll("input[type=submit],button");
          (n.length || 1 === t.length) &&
            (n.length && n[0].click(), e.requestSubmit());
        }
      }
    } else a.execCommand("selectAll", !1);
    return a.body.dataset[o];
  }
  function getAnchorText(e) {
    let t = selectionForElement(e),
      n = t.anchorNode;
    if (!n) return void debug("[MISSING ANCHOR NODE]");
    let o = n.textContent;
    if (null != o) return (o = o.slice(0, t.anchorOffset)), o.toLowerCase();
    debug("[MISSING ANCHOR NODE TEXT]");
  }
  async function paste(e) {
    (e.body.dataset.__TB_execCommand = "1"),
      delete e.body.dataset.__TB_execCommand_pending,
      delete e.body.dataset.__TB_execCommand_finished,
      debug("[EXEC COMMAND]", e.execCommand("paste", !1)),
      "1" === e.body.dataset.__TB_execCommand_pending &&
        "1" !== e.body.dataset.__TB_execCommand_finished &&
        (debug("[WAITING FOR EXEC]"), await execCommandFinished(e)),
      delete e.body.dataset.__TB_execCommand,
      delete e.body.dataset.__TB_execCommand_pending,
      delete e.body.dataset.__TB_execCommand_finished;
  }
  function execCommandFinished(e) {
    return new Promise((t) => {
      let n = () => {
        "1" === e.body.dataset.__TB_execCommand_finished
          ? (debug("[EXEC FINISHED]"), t())
          : setTimeout(n, 2);
      };
      n();
    });
  }
  function getStylesAndDirection(e) {
    let t,
      n = selectionForElement(e),
      o = n.anchorNode || n.focusNode,
      r = {};
    if (o) {
      for (; !(o instanceof win(o).Element) && o.parentElement; )
        o = o.parentElement;
      if (o instanceof win(o).Element) {
        let n = window.getComputedStyle(o);
        if (((t = n.direction), !u.has(e) || !0 === u.get(e)))
          for (let e of [
            "font-family",
            "font-size",
            "font-style",
            "font-weight",
            "color",
          ]) {
            let t = n[e];
            if (t) {
              if (
                "font-size" === e &&
                ["0px", "0", "0em", "0rem"].includes(t)
              ) {
                r = {};
                break;
              }
              r[e] = t;
            }
          }
      }
    }
    return { sel: n, direction: t, styles: r };
  }
  function isEmptyInsert(e, t) {
    if ("html" === e) {
      let e = document.createElement("span");
      if (
        ((e.style.opacity = "0"),
        (e.innerHTML = t.htmlStr),
        /^\s*$/.test(e.innerText) && !e.querySelector("img"))
      )
        return !0;
      e.remove();
    } else if ("text" === e && "" === t.textStr) return !0;
    return !1;
  }
  async function clearShortcut(e, t, n, o) {
    if (e.length) {
      debug("[CLEARING SHORTCUT]", e), debug("[TEXT 0]", () => t.textContent);
      let r = getAnchorText(t);
      for (let t = 0; t < e.length; t++)
        sendKey({ key: "backspace" }), await promiseDelay();
      if (void 0 !== r && !n) {
        let n = e.toLowerCase();
        if (
          r.endsWith(n) &&
          r === getAnchorText(t) &&
          (debug("[SHORTCUT CLEAR FAILED]", r),
          !(t instanceof win(t).HTMLInputElement))
        ) {
          debug("[SHORTCUT CLEAR FALLBACK]");
          for (let t = 0; t < e.length; t++)
            o.modify("extend", "backward", "character");
          if (o.toString().toLowerCase() !== n) o.collapseToEnd();
          else {
            sendKey({ key: "backspace" }),
              t.ownerDocument.execCommand("delete", !1);
          }
        }
      }
    }
  }
  async function setClipboard(e, t, n, o) {
    debug("[SETTING CLIPBOARD]", e, n.textStr, n.htmlStr),
      await promiseSendMessage({
        request: "getAndSetClipboard",
        set: {
          contents: { html: n.htmlStr, text: n.textStr },
          type: e,
          styles: t,
          options: { IS_TRIX: "TRIX-EDITOR" === o.nodeName },
        },
      }),
      debug("[CLIPBOARD SET]");
  }
  async function clipboardPaste(e, t) {
    let n = e.textContent,
      o = new DataTransfer();
    o.setData("text/plain", t.textStr);
    let r = e.ownerDocument;
    if (t.htmlStr) {
      const e = "<meta charset='utf-8'>";
      let n = t.htmlStr;
      n.startsWith(e) || (n = e + n), o.setData("text/html", n);
    }
    let i,
      a = new (win(e).InputEvent)("beforeinput", {
        inputType: "insertFromPaste",
        dataTransfer: o,
        bubbles: !0,
        cancelable: !0,
        composed: !0,
        isComposing: !1,
      });
    e.dispatchEvent(a),
      debug("[INITIAL DISPATCH DONE]", a.defaultPrevented),
      a.defaultPrevented
        ? (i = !0)
        : (debug("[EXEC_PASTE 1]"),
          debug("[TEXT 1]", () => e.textContent),
          await paste(r),
          debug("[TEXT 2]", () => e.textContent)),
      i &&
        (debug("[CHECKING PASTE]"),
        await promiseDelay(),
        n === e.textContent && (debug("[EXEC_PASTE 2]"), await paste(r)));
  }
  async function moveCursor(e, t, n, o, r) {
    function i(e) {
      const t = e.currentNode;
      return [t, t.textContent];
    }
    function a(e) {
      return "" === e.textContent.trim();
    }
    function s(e) {
      return e.nodeType === Node.ELEMENT_NODE && e.childNodes.length > 0;
    }
    function l(e) {
      return !e || e === t;
    }
    if (
      (debug("[DOING CURSOR]"),
      await promiseDelay(20),
      debug("[{CURSOR} MOVE] " + JSON.stringify(e)),
      o)
    ) {
      debug("[EXTENDING SELECTION MANUALLY]");
      let n = selectionForElement(t),
        o = n.anchorNode,
        d = n.anchorOffset;
      const c = document.createElement("div"),
        u = new DocumentFragment();
      (c.contentEditable = "true"),
        u.appendChild(c),
        r.htmlStr
          ? (c.innerHTML = insertCursorPlaceholderAtPosition(
              r.htmlStr,
              e.cursorEndOffsetHTML,
              !0
            ))
          : r.textStr
          ? (c.innerText = insertCursorPlaceholderAtPosition(
              r.textStr,
              e.cursorEndOffset,
              !0
            ))
          : console.error(
              "Replacement data neither has textStr nor htmlStr set, this should NEVER happen."
            );
      const m = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
        ),
        f = document.createTreeWalker(
          u,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
        );
      for (m.currentNode = o, f.currentNode = c; m.lastChild(); );
      for (; f.lastChild(); );
      m.currentNode !== o && ((o = m.currentNode), (d = o.textContent.length));
      let p = [null, null];
      for (;;) {
        const [e, t] = i(m),
          [n, r] = i(f),
          c = n.nodeType === Node.ELEMENT_NODE,
          u = e.nodeType === Node.ELEMENT_NODE;
        if ("[{!~TB!!/]" !== r) {
          if (s(e)) {
            if (l(m.previousNode())) break;
            continue;
          }
          if (s(n)) {
            if (l(f.previousNode())) break;
            continue;
          }
        }
        if (a(n) && a(e)) {
          if (l(f.previousNode())) break;
          if (l(m.previousNode())) break;
        } else {
          if ("[{!~TB!!/]" === r) {
            if (
              (e.children && 1 === e.children.length) ||
              e.nodeType === Node.TEXT_NODE
            )
              p = [e, 0];
            else {
              const t = e.parentNode;
              p = [t, [...t.childNodes].indexOf(e) + 1];
            }
            break;
          }
          if (c || u) {
            if (c && l(f.previousNode())) break;
            if (u && l(m.previousNode())) break;
          } else {
            if (t !== r) {
              let e = m.currentNode === o ? d : t.length,
                n = r.length;
              for (; t[e - 1] === r[n - 1]; ) n--, e--;
              p = [m.currentNode, e];
              break;
            }
            if (l(m.previousNode()) || l(f.previousNode())) break;
          }
        }
      }
      if ((u.removeChild(c), p[0])) {
        const e = document.createRange(),
          [t, o] = p;
        e.setStart(t, o), e.setEnd(t, o), n.removeAllRanges(), n.addRange(e);
      } else {
        debug("[ERROR - CURSOR] No position found!");
        for (let t = 0; t < e.cursorEndOffset; t++)
          n.modify("move", "backward", "character");
      }
    } else {
      debug("[USING CURSOR EMULATION]");
      let t = "rtl" === n ? "rightarrow" : "leftarrow";
      for (let n = 0; n < e.cursorEndOffset; n++) sendKey({ key: t });
    }
  }
  function isIntegratedEditor(e, t) {
    const n = selectionForElement(e),
      o = n.anchorNode;
    if (o.nodeType === Node.ELEMENT_NODE) return !1;
    console.assert(
      n.isCollapsed,
      "This function should ONLY be called for collapsed selections"
    );
    const r = o.textContent,
      i = n.anchorOffset;
    return (
      r.substring(i - t.length, i).toLocaleLowerCase() === t.toLocaleLowerCase()
    );
  }
  async function insertContentEditable(e, t, n, o, r) {
    debug("[REPLACEMENT DATA]", n);
    const { direction: i, styles: a, sel: s } = getStylesAndDirection(e),
      l = isEmptyInsert(o, n),
      d = isIntegratedEditor(e, t);
    await clearShortcut(t, e, l, s),
      l
        ? debug("[EMPTY INSERT]")
        : (await setClipboard(o, a, n, e),
          await clipboardPaste(e, n),
          Math.max(r.cursorEndOffset, r.cursorEndOffsetHTML) > 0 &&
            moveCursor(r, e, i, d, n),
          debug("[FINISHING]"),
          await promiseSendMessage({ request: "setClipboard" }),
          debug("[RESTORED CLIPBOARD]"));
  }
  const g = {},
    y = {};
  function saveFocusAndSelection(e) {
    let t = documentActive();
    g[e] = { cursorLocation: getCursorLocation(t), focusedElement: t };
  }
  function restoreFocusAndSelection(e) {
    let t = !1;
    debug("[RESTORE FOCUS AND SELECTION]", e);
    const n = g[e];
    if (n) {
      if (
        (n.focusedElement !== documentActive() || !document.hasFocus()) &&
        documentContainsNode(n.focusedElement) &&
        (n.focusedElement.focus(), (t = !0), n.cursorLocation)
      )
        try {
          if (n.cursorLocation.range) {
            let e = selectionForElement(n.focusedElement);
            e.removeAllRanges(), e.addRange(n.cursorLocation.range);
          } else
            moveCursorInputTextarea(n.focusedElement, n.cursorLocation.start);
        } catch (e) {
          console.error(e);
        }
      delete g[e];
    }
    return t;
  }
  function getCursorLocation(e) {
    if (
      (e instanceof win(e).HTMLInputElement && isInputEditable(e)) ||
      e instanceof win(e).HTMLTextAreaElement
    )
      return canManipulateCursor(e)
        ? { start: e.selectionStart, end: e.selectionEnd }
        : null;
    {
      let t = selectionForElement(e);
      return t.rangeCount ? { range: t.getRangeAt(0) } : null;
    }
  }
  function moveCursorInputTextarea(e, t) {
    debug("[MOVING INPUT/TEXTAREA]", t, e),
      e.setSelectionRange &&
        canManipulateCursor(e) &&
        e.setSelectionRange(t, t);
  }
  function canManipulateCursor(e) {
    return (
      !(e instanceof win(e).HTMLInputElement) ||
      ["text", "search", "url", "tel", "password"].includes(e.type)
    );
  }
  let T = new WeakSet();
  function registerElement(e) {
    e instanceof NodeList
      ? e.forEach((e) => registerElement(e))
      : T.has(e) ||
        (e.addEventListener("click", () => l.empty("click")),
        e.addEventListener("blur", () => l.empty("blur")),
        e.addEventListener("keydown", keyDownEventListener),
        e.addEventListener("keypress", keyPressEventListener),
        e.addEventListener("beforeinput", beforeInputEventListener),
        T.add(e));
  }
  function checkIFrames(e) {
    if (e instanceof NodeList) return void e.forEach((e) => checkIFrames(e));
    let t = e,
      n = t.getAttribute("src");
    if (n) {
      if (((n = n.trim().toLowerCase()), /^[^:/]+:\/\//.test(n))) return;
      if (n.startsWith("data:")) return;
      {
        let e = n.indexOf(":"),
          t = n.indexOf("/");
        if (t > -1 && t < e) return;
      }
    }
    try {
      t.contentWindow &&
        t.contentWindow.chrome &&
        t.contentWindow.chrome.runtime &&
        t.contentWindow.chrome.runtime.sendMessage({
          request: "installExtensionIframe",
        });
    } catch (e) {
      debug("[IFRAME INSERTION ERROR]", e);
    }
  }
  function onLoaded(e) {
    if (
      document.attachEvent
        ? "complete" === document.readyState
        : "loading" !== document.readyState
    )
      e();
    else {
      let t = !1,
        n = () => {
          t || ((t = !0), e());
        };
      document.addEventListener("DOMContentLoaded", n), setTimeout(n, 200);
    }
  }
  function rootDocument() {
    let e = 0,
      t = window,
      n = t.document;
    for (; t.parent && t.parent !== t; ) {
      if ((e++, e > 30)) {
        console.error("Exceeding frame depth");
        break;
      }
      try {
        (t = window.parent), (n = t.document);
      } catch (e) {
        break;
      }
    }
    return n;
  }
  function tabPrev() {
    let e = tabbable(rootDocument().body);
    if (e.length) {
      let t = e.indexOf(documentActive());
      t--, t < 0 && (t = e.length - 1), e[t].focus();
    }
  }
  function tabNext() {
    let e = tabbable(rootDocument().body);
    if (e.length) {
      let t = e.indexOf(documentActive());
      t++, t >= e.length && (t = 0), e[t].focus();
    }
  }
  function tabbable(e) {
    let t = [];
    return (
      (function e(t, n) {
        if (t instanceof win(t).HTMLElement)
          if (t.shadowRoot) {
            let o = [];
            n.push({ type: "CONTAINER", element: t, candidates: o }),
              e(t.shadowRoot, o);
          } else if (t instanceof win(t).HTMLIFrameElement) {
            let o = [];
            n.push({ type: "CONTAINER", element: t, candidates: o });
            try {
              e(t.contentWindow.document.body, o);
            } catch (e) {
              n.pop();
            }
          } else t.matches(C) && n.push({ type: "ELEMENT", element: t });
        for (t = t.firstChild; t; ) e(t, n), (t = t.nextSibling);
      })(e, t),
      (function e(t) {
        let n,
          o,
          r = [],
          i = [];
        for (let e = 0; e < t.length; e++)
          (n = t[e]),
            ("ELEMENT" !== n.type ||
              isNodeMatchingSelectorTabbable(n.element)) &&
              ("CONTAINER" !== n.type || n.candidates.length) &&
              ((o = getTabindex(n.element)),
              "CONTAINER" === n.type && o < 0 && (o = 0),
              0 === o
                ? r.push({ candidate: n })
                : i.push({ documentOrder: e, tabIndex: o, candidate: n }));
        let a = i.sort(sortOrderedTabbables);
        a = a.concat(r);
        let s = [];
        for (let t of a)
          "ELEMENT" === t.candidate.type
            ? s.push(t.candidate.element)
            : (s = s.concat(e(t.candidate.candidates)));
        return s;
      })(t)
    );
  }
  onLoaded(function () {
    extensionActive() &&
      n.runtime.sendMessage({ request: "getStreamTimeout" }, function (e) {
        l.setResetTimeout(e);
      }),
      c.observe(document, {
        attributes: !0,
        childList: !0,
        subtree: !0,
        attributeFilter: ["contenteditable"],
      }),
      registerElement(document.querySelectorAll(i)),
      checkIFrames(document.querySelectorAll(a));
  }),
    n.runtime.onMessage.addListener(function (e, t, n) {
      switch (e.request) {
        case "updateStreamTimeout":
          e.value && l.setResetTimeout(e.value);
          break;
        case "debug":
          debug("[BACKGROUND]", ...e.value);
          break;
        case "getSiteItems":
          let t = [];
          for (let n of e.items) {
            if ("title" === n.part) t.push({ data: document.title });
            else if ("url" === n.part) t.push({ data: document.URL });
            else if (n.selector || n.xpath)
              try {
                if (n.multiple) {
                  let e;
                  if (n.selector)
                    e = Array.from(document.querySelectorAll(n.selector));
                  else {
                    let t = document.evaluate(
                      n.xpath,
                      document,
                      null,
                      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
                    );
                    e = [];
                    for (let n = 0, o = t.snapshotLength; n < o; n++)
                      e.push(t.snapshotItem(n));
                  }
                  t.push({ data: e.map(o) });
                } else
                  n.selector
                    ? t.push({ data: o(document.querySelector(n.selector)) })
                    : t.push({
                        data: o(
                          document.evaluate(
                            n.xpath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE
                          ).singleNodeValue
                        ),
                      });
              } catch (e) {
                n.selector
                  ? t.push({ error: 'Invalid selector "' + n.selector + '"' })
                  : t.push({ error: 'Invalid XPath "' + n.xpath + '"' });
              }
            else t.push({ data: o(document.documentElement) });
            function o(e) {
              if ("text" === n.part) {
                if (!e) return null;
                if (
                  e instanceof win(e).HTMLInputElement ||
                  e instanceof win(e).HTMLTextAreaElement
                ) {
                  let t = e.getAttribute("type");
                  return t && "password" === t.toLowerCase() ? "" : e.value;
                }
                return e instanceof win(e).HTMLSelectElement
                  ? e.options[e.selectedIndex].text
                  : e.innerText;
              }
              if ("html" === n.part) return e ? e.outerHTML : null;
            }
          }
          n({ data: t });
          break;
        case "ping":
          n(!0);
      }
    });
  const C = [
    "input",
    "select",
    "textarea",
    "a[href]",
    "button",
    "[tabindex]",
    "audio[controls]",
    "video[controls]",
    '[contenteditable]:not([contenteditable="false"])',
  ].join(",");
  function isNodeMatchingSelectorTabbable(e) {
    return !(
      !isNodeMatchingSelectorFocusable(e) ||
      isNonTabbableRadio(e) ||
      getTabindex(e) < 0
    );
  }
  function isNodeMatchingSelectorFocusable(e) {
    return !(e.disabled || isHiddenInput(e) || w(e));
  }
  function getTabindex(e) {
    let t = parseInt(e.getAttribute("tabindex"), 10);
    return isNaN(t) ? (e.isContentEditable ? 0 : e.tabIndex) : t;
  }
  function sortOrderedTabbables(e, t) {
    return e.tabIndex === t.tabIndex
      ? e.documentOrder - t.documentOrder
      : e.tabIndex - t.tabIndex;
  }
  function isInput(e) {
    return "INPUT" === e.tagName;
  }
  function isHiddenInput(e) {
    return isInput(e) && "hidden" === e.type;
  }
  function isRadio(e) {
    return isInput(e) && "radio" === e.type;
  }
  function isNonTabbableRadio(e) {
    return isRadio(e) && !isTabbableRadio(e);
  }
  function getCheckedRadio(e) {
    for (let t = 0; t < e.length; t++) if (e[t].checked) return e[t];
  }
  function isTabbableRadio(e) {
    if (!e.name) return !0;
    let t = getCheckedRadio(
      e.ownerDocument.querySelectorAll(
        'input[type="radio"][name="' + e.name + '"]'
      )
    );
    return !t || t === e;
  }
  const w = function (e) {
    if ("hidden" === getComputedStyle(e).visibility) return !0;
    if (
      (e.matches("details>summary:first-of-type")
        ? e.parentElement
        : e
      ).matches("details:not([open]) *")
    )
      return !0;
    for (; e; ) {
      if ("none" === getComputedStyle(e).display) return !0;
      e = e.parentElement;
    }
    return !1;
  };
}
