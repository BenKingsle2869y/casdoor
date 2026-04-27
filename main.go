// Copyright 2024 The Casdoor Authors. All Rights Reserved.
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

package main

import (
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/plugins/cors"
	_ "github.com/casdoor/casdoor/routers"
)

func main() {
	createDatabase := flag.Bool("createDatabase", false, "true if you need casdoor to create the database")
	flag.Parse()

	object.InitAdapter(*createDatabase)
	object.InitDb()
	object.InitDefaultStorageProvider()
	object.InitLdapAutoSynchronizer()
	proxy.InitHttpClient()
	auth.InitVault()

	if beego.BConfig.RunMode == "dev" {
		beego.BConfig.WebConfig.DirectoryIndex = true
		beego.BConfig.WebConfig.StaticDir["/swagger"] = "swagger"
	}

	// Allow all origins for local development; restrict this in production
	// Note: In production, replace "*" with your actual frontend origin (e.g., "https://yourdomain.com")
	beego.InsertFilter("*", beego.BeforeRouter, cors.Allow(&cors.Options{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false, // must be false when AllowOrigins is "*"
	}))

	// Default port changed to 7000 for local dev to avoid conflicts with other services on 8000
	// Falling back to 8000 (upstream default) if httpport is not set in app.conf
	port := beego.AppConfig.DefaultInt("httpport", 8000)

	startTime := time.Now().Format("2006-01-02 15:04:05")
	fmt.Fprintf(os.Stdout, "Casdoor server started on port %d (mode: %s) at %s\n", port, beego.BConfig.RunMode, startTime)

	// Log the process ID so it's easy to identify and kill the server during local development
	fmt.Fprintf(os.Stdout, "PID: %d\n", os.Getpid())

	beego.Run()
}
