// Copyright 2025 The Casdoor Authors. All Rights Reserved.
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

package routers

import (
	"strings"

	"github.com/beego/beego/v2/server/web"
	"github.com/beego/beego/v2/server/web/context"
	"github.com/casdoor/casdoor/conf"
)

// SecureCookieFilter adds the "Secure" attribute to the session cookie when the
// deployment is configured to use HTTPS. This is determined by either the
// "cookieSecure" config option being set to true, or the "origin" config starting
// with "https://". This approach ensures the Secure flag is set even when Casdoor
// runs behind a TLS-terminating reverse proxy.
func SecureCookieFilter(ctx *context.Context) {
	if !conf.GetConfigBool("cookieSecure") && !strings.HasPrefix(conf.GetConfigString("origin"), "https://") {
		return
	}

	sessionCookieName := web.BConfig.WebConfig.Session.SessionName
	if sessionCookieName == "" {
		return
	}

	cookies := ctx.ResponseWriter.Header()["Set-Cookie"]
	for i, cookie := range cookies {
		if !strings.HasPrefix(cookie, sessionCookieName+"=") {
			continue
		}
		// Check if Secure is already present (case-insensitive, handles variants like ";Secure" and "; Secure")
		alreadySecure := false
		for _, part := range strings.Split(cookie, ";") {
			if strings.EqualFold(strings.TrimSpace(part), "secure") {
				alreadySecure = true
				break
			}
		}
		if !alreadySecure {
			cookies[i] = cookie + "; Secure"
		}
	}
}
