// Copyright 2026 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * CasdoorModal - A lightweight SDK for embedding Casdoor login as a modal popup.
 *
 * Usage:
 *   <script src="https://your-casdoor-server/CasdoorModal.js"></script>
 *   <script>
 *     CasdoorModal.show({
 *       serverUrl: "https://your-casdoor-server",
 *       clientId: "your-client-id",
 *       redirectUri: "https://your-app.com/callback",
 *       scope: "read",
 *       onSuccess: function(data) {
 *         // data.code, data.state
 *         console.log("Logged in:", data);
 *       },
 *       onClose: function() {
 *         console.log("Modal closed");
 *       }
 *     });
 *   </script>
 */

(function(window) {
  "use strict";

  var overlayId = "casdoor-modal-overlay";

  function generateState() {
    var arr = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(arr);
    } else {
      for (var i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(arr).map(function(b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function buildLoginUrl(options) {
    var serverUrl = (options.serverUrl || "").replace(/\/$/, "");
    var params = [
      "response_type=code",
      "client_id=" + encodeURIComponent(options.clientId || ""),
      "redirect_uri=" + encodeURIComponent(options.redirectUri || window.location.origin),
      "scope=" + encodeURIComponent(options.scope || "read"),
      "state=" + encodeURIComponent(options.state || generateState()),
      "popup=2",
    ];
    return serverUrl + "/login/oauth/authorize?" + params.join("&");
  }

  function createStyles() {
    var styleId = "casdoor-modal-styles";
    if (document.getElementById(styleId)) {
      return;
    }
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent = [
      "#" + overlayId + " {",
      "  position: fixed;",
      "  top: 0;",
      "  left: 0;",
      "  width: 100%;",
      "  height: 100%;",
      "  background: rgba(0, 0, 0, 0.5);",
      "  display: flex;",
      "  flex-direction: column;",
      "  align-items: center;",
      "  justify-content: center;",
      "  z-index: 2147483647;",
      "  box-sizing: border-box;",
      "  padding: 16px;",
      "}",
      "#" + overlayId + " .casdoor-modal-container {",
      "  background: #fff;",
      "  border-radius: 8px;",
      "  overflow: hidden;",
      "  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);",
      "  width: 420px;",
      "  max-width: 100%;",
      "  max-height: 85vh;",
      "  overflow-y: auto;",
      "}",
      "#" + overlayId + " .casdoor-modal-iframe {",
      "  width: 100%;",
      "  height: 600px;",
      "  border: none;",
      "  display: block;",
      "}",
      "#" + overlayId + " .casdoor-modal-close-btn {",
      "  margin-top: 16px;",
      "  padding: 8px 20px;",
      "  background: #fff;",
      "  border: 1px solid #d9d9d9;",
      "  border-radius: 20px;",
      "  cursor: pointer;",
      "  font-size: 14px;",
      "  color: #555;",
      "  font-family: sans-serif;",
      "  line-height: 1.5;",
      "  transition: background 0.2s, border-color 0.2s;",
      "  flex-shrink: 0;",
      "}",
      "#" + overlayId + " .casdoor-modal-close-btn:hover {",
      "  background: #f5f5f5;",
      "  border-color: #aaa;",
      "}",
    ].join("\n");
    document.head.appendChild(style);
  }

  var CasdoorModal = {
    _overlay: null,
    _iframe: null,
    _onSuccess: null,
    _onClose: null,
    _serverOrigin: null,
    _messageHandler: null,

    /**
     * Show the Casdoor login modal.
     *
     * @param {Object} options
     * @param {string} options.serverUrl       - Base URL of the Casdoor server (e.g. "https://door.casdoor.com").
     * @param {string} options.clientId        - OAuth client_id of your application.
     * @param {string} [options.redirectUri]   - OAuth redirect_uri. Defaults to window.location.origin.
     * @param {string} [options.scope]         - OAuth scope. Defaults to "read".
     * @param {string} [options.state]         - OAuth state. Auto-generated if omitted.
     * @param {Function} [options.onSuccess]   - Callback invoked on successful login with {code, state}.
     * @param {Function} [options.onClose]     - Callback invoked when the modal is closed without login.
     */
    show: function(options) {
      if (!options || !options.serverUrl || !options.clientId) {
        throw new Error("CasdoorModal.show: options.serverUrl and options.clientId are required.");
      }

      // Close any existing modal first
      if (this._overlay) {
        this._removeModal(false);
      }

      this._onSuccess = options.onSuccess || null;
      this._onClose = options.onClose || null;

      try {
        this._serverOrigin = new URL(options.serverUrl).origin;
      } catch (e) {
        this._serverOrigin = null;
      }

      createStyles();

      var loginUrl = buildLoginUrl(options);
      this._createModal(loginUrl);
      this._addMessageListener();
    },

    /**
     * Programmatically close the modal (triggers onClose callback).
     */
    close: function() {
      if (this._overlay) {
        this._removeModal(true);
      }
    },

    _createModal: function(loginUrl) {
      var self = this;

      var overlay = document.createElement("div");
      overlay.id = overlayId;

      var container = document.createElement("div");
      container.className = "casdoor-modal-container";

      var iframe = document.createElement("iframe");
      iframe.src = loginUrl;
      iframe.className = "casdoor-modal-iframe";
      iframe.allow = "publickey-credentials-get *";
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation");

      container.appendChild(iframe);
      overlay.appendChild(container);

      var closeBtn = document.createElement("button");
      closeBtn.className = "casdoor-modal-close-btn";
      closeBtn.innerHTML = "&#x2715;&nbsp;Close";
      closeBtn.onclick = function() {
        self.close();
      };
      overlay.appendChild(closeBtn);

      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) {
          self.close();
        }
      });

      document.body.appendChild(overlay);
      this._overlay = overlay;
      this._iframe = iframe;
    },

    _removeModal: function(fireCloseCallback) {
      this._removeMessageListener();
      if (this._overlay && this._overlay.parentNode) {
        this._overlay.parentNode.removeChild(this._overlay);
      }
      this._overlay = null;
      this._iframe = null;
      if (fireCloseCallback && this._onClose) {
        var cb = this._onClose;
        this._onClose = null;
        cb();
      } else {
        this._onClose = null;
      }
      this._onSuccess = null;
    },

    _addMessageListener: function() {
      var self = this;
      this._messageHandler = function(event) {
        // Validate origin against the configured server URL
        if (self._serverOrigin && event.origin !== self._serverOrigin) {
          return;
        }

        var data = event.data;
        if (!data || typeof data !== "object") {
          return;
        }

        if (data.type === "loginSuccess") {
          var successCb = self._onSuccess;
          self._removeModal(false);
          if (successCb) {
            successCb(data.data);
          }
        } else if (data.type === "windowClosed") {
          self._removeModal(true);
        }
      };
      window.addEventListener("message", this._messageHandler);
    },

    _removeMessageListener: function() {
      if (this._messageHandler) {
        window.removeEventListener("message", this._messageHandler);
        this._messageHandler = null;
      }
    },
  };

  window.CasdoorModal = CasdoorModal;
})(window);
