/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2019-2020 */

const { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

const { ExtensionAPI } = ExtensionCommon;

const { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");

function initScript(window, document) {
  Services.scriptloader.loadSubScript("chrome://quickmove/content/quickmove.js", window);
  window.quickmove.cleanup.push(() => {
    delete window.quickmove;
  });
}

function initCSS(window, document) {
  let link = document.createElement("link");

  link.setAttribute("id", "quickmove-styles");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("type", "text/css");
  link.setAttribute("href", "chrome://quickmove/content/quickmove.css");

  document.documentElement.appendChild(link);
  window.quickmove.cleanup.push(() => {
    document.getElementById("quickmove-styles").remove();
  });
}

function initKeys(window, document) {
  document.getElementById("mainPopupSet").appendChild(
    window.MozXULElement.parseXULToFragment(`
      <menupopup id="quickmove-move-menupopup"
             ignorekeys="true"
             onpopupshowing="quickmove.popupshowing(event, true)"
             onpopupshown="quickmove.popupshown(event)"
             onpopuphidden="quickmove.hide(event.target)"
             oncommand="quickmove.command(event, quickmove.executeMove)">
        <html:input class="quickmove-textbox"
                    onfocus="quickmove.focus(event)"
                    onkeypress="quickmove.keypress(event, quickmove.executeMove)"
                    oninput="quickmove.searchDelayed(event.target, true); event.stopPropagation();"/>
        <menuseparator class="quickmove-separator"/>
      </menupopup>
      <menupopup id="quickmove-goto-menupopup"
                 ignorekeys="true"
                 onpopupshowing="quickmove.popupshowing(event, true)"
                 onpopupshown="quickmove.popupshown(event)"
                 onpopuphidden="quickmove.hide(event.target)"
                 oncommand="quickmove.command(event, quickmove.executeGoto)">
        <html:input class="quickmove-textbox"
                    onfocus="quickmove.focus(event)"
                    onkeypress="quickmove.keypress(event, quickmove.executeGoto)"
                    oninput="quickmove.searchDelayed(event.target, true); event.stopPropagation();"/>
        <menuseparator id="quickmove-goto-separator" class="quickmove-separator"/>
      </menupopup>
      <menupopup id="quickmove-copy-menupopup"
                 ignorekeys="true"
                 onpopupshowing="quickmove.popupshowing(event, true)"
                 onpopupshown="quickmove.popupshown(event)"
                 onpopuphidden="quickmove.hide(event.target)"
                 oncommand="quickmove.command(event, quickmove.executeCopy)">
        <html:input class="quickmove-textbox"
                    onfocus="quickmove.focus(event)"
                    onkeypress="quickmove.keypress(event, quickmove.executeCopy)"
                    oninput="quickmove.searchDelayed(event.target, true); event.stopPropagation();"/>
        <menuseparator id="quickmove-copy-separator" class="quickmove-separator"/>
      </menupopup>
    `)
  );

  document.getElementById("mailKeys").appendChild(
    window.MozXULElement.parseXULToFragment(`
      <keyset id="quickmove-keyset">
        <key id="quickmove-file" key="M" modifiers="shift" oncommand="quickmove.openMove()"/>
        <key id="quickmove-goto" key="G" modifiers="shift" oncommand="quickmove.openGoto()"/>
        <key id="quickmove-copy" key="Y" modifiers="shift" oncommand="quickmove.openCopy()"/>
      </keyset>
    `)
  );

  window.quickmove.cleanup.push(() => {
    document.getElementById("quickmove-keyset").remove();
    document.getElementById("quickmove-move-menupopup").remove();
    document.getElementById("quickmove-copy-menupopup").remove();
    document.getElementById("quickmove-goto-menupopup").remove();
  });
}

function initContextMenus(window, document) {
  let tabmail = window.top.document.getElementById("tabmail");
  let doc = tabmail?.currentAbout3Pane?.document;
  if (!doc) {
    console.log("QFM: tabmail not initialised yet");
    return;
  }
  let moveMenu = doc.getElementById("mailContext-moveMenu");
  if (!moveMenu) {
    return;
  }
  let quickMoveFileHere = window.MozXULElement.parseXULToFragment(`
    <menupopup id="quickmove-context-menupopup"
               ignorekeys="true"
               onpopupshowing="top.quickmove.popupshowing(event)"
               onpopupshown="top.quickmove.popupshown(event)"
               onpopuphidden="top.quickmove.hide(event.target)"
               oncommand="top.quickmove.command(event, quickmove.executeMove, true)">
      <html:input class="quickmove-textbox"
                  onfocus="top.quickmove.focus(event)"
                  onkeypress="top.quickmove.keypress(event, quickmove.executeMove)"
                  oninput="top.quickmove.searchDelayed(event.target); event.stopPropagation();"/>
      <menuseparator class="quickmove-separator"/>
    </menupopup>
  `);

  let oldMovePopup = moveMenu.replaceChild(quickMoveFileHere, moveMenu.menupopup);

  let copyMenu = doc.getElementById("mailContext-copyMenu");
  if (!copyMenu) {
    return;
  }
  let quickMoveCopyHere = window.MozXULElement.parseXULToFragment(`
    <menupopup id="quickmove-context-copy-menupopup"
               ignorekeys="true"
               onpopupshowing="top.quickmove.popupshowing(event)"
               onpopupshown="top.quickmove.popupshown(event)"
               onpopuphidden="top.quickmove.hide(event.target)"
               oncommand="top.quickmove.command(event, quickmove.executeCopy, true)">
      <html:input class="quickmove-textbox"
                  onfocus="top.quickmove.focus(event)"
                  onkeypress="top.quickmove.keypress(event, quickmove.executeCopy)"
                  oninput="top.quickmove.searchDelayed(event.target); event.stopPropagation();"/>
      <menuseparator class="quickmove-separator"/>
    </menupopup>
  `);

  let oldCopyPopup = copyMenu.replaceChild(quickMoveCopyHere, copyMenu.menupopup);

  window.quickmove.cleanup.push(() => {
    quickMoveFileHere = doc.getElementById("quickmove-context-menupopup");
    quickMoveFileHere.parentNode.replaceChild(oldMovePopup, quickMoveFileHere);

    quickMoveCopyHere = doc.getElementById("quickmove-context-copy-menupopup");
    quickMoveCopyHere.parentNode.replaceChild(oldCopyPopup, quickMoveCopyHere);
  });
}

function initFolderLocation(window, document) {
  let quickmoveLocationPopup = window.MozXULElement.parseXULToFragment(`
    <menupopup id="toolbarFolderLocationPopup"
               ignorekeys="true"
               onpopupshowing="quickmove.popupshowing(event, true)"
               onpopupshown="quickmove.popupshown(event)"
               onpopuphidden="quickmove.hide(event.target)"
               oncommand="quickmove.command(event, quickmove.executeGoto)">
      <html:input class="quickmove-textbox"
                  onfocus="quickmove.focus(event)"
                  onkeypress="quickmove.keypress(event, quickmove.executeGoto)"
                  oninput="quickmove.searchDelayed(event.target, true); event.stopPropagation();"/>
      <menuseparator id="quickmove-location-separator" class="quickmove-separator"/>
    </menupopup>
  `);

  let folderLocationPopup =
    document.getElementById("toolbarFolderLocationPopup");
  if (!folderLocationPopup) {
    console.log("QFM: toolbarFolderLocationPopup not initialised yet");
    return;
  }
  folderLocationPopup.setAttribute("id", "toolbarFolderLocationPopup-retired");
  folderLocationPopup.parentNode.appendChild(quickmoveLocationPopup);

  window.quickmove.cleanup.push(() => {
    let folderLocationPopupRetired =
      document.getElementById("toolbarFolderLocationPopup-retired");
    if (folderLocationPopupRetired) {
      let folderLocationPopup =
        document.getElementById("toolbarFolderLocationPopup");
      if (folderLocationPopup) {
        folderLocationPopup.remove();
      }
      folderLocationPopupRetired.setAttribute("id", "toolbarFolderLocationPopup");
    }
  });
}

this.quickmove = class extends ExtensionAPI {
  onStartup() {
    let aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"].getService(
      Ci.amIAddonManagerStartup
    );
    let manifestURI = Services.io.newURI("manifest.json", null, this.extension.rootURI);

    this.chromeHandle = aomStartup.registerChrome(manifestURI, [
      ["content", "quickmove", "content/"],
    ]);

    ExtensionSupport.registerWindowListener("quickmove", {
      chromeURLs: [
        "chrome://messenger/content/messageWindow.xhtml",
        "chrome://messenger/content/messenger.xhtml",
      ],
      onLoadWindow: async function(window) {
        let document = window.document;

        initScript(window, document);
        initCSS(window, document);
        initKeys(window, document);

        // The following call needs tabmail setup, so it won't work straight away.
        // Hack it with a timeout for now. Maybe we can listen to some event instead.
        window.setTimeout(() => initContextMenus(window, document), 5000);

        if (window.location.href.startsWith("chrome://messenger/content/messageWindow.")) {
          document.getElementById("quickmove-goto").remove();
        } else if (window.location.href.startsWith("chrome://messenger/content/messenger.")) {
          window.setTimeout(() => initFolderLocation(window, document), 1000);
        }
      },
    });
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) {
      return;
    }

    this.chromeHandle.destruct();
    this.chromeHandle = null;

    ExtensionSupport.unregisterWindowListener("quickmove");

    for (let window of ExtensionSupport.openWindows) {
      if (window.quickmove && window.quickmove.cleanup) {
        for (let func of window.quickmove.cleanup.reverse()) {
          try {
            func();
          } catch (e) {
            Cu.reportError(e);
          }
        }
      }
    }

    // if (this.extension.addonData.temporarilyInstalled) {
    Services.obs.notifyObservers(null, "startupcache-invalidate");
    // }
  }

  getAPI(context) {
    return {
      quickmove: {},
    };
  }
};
