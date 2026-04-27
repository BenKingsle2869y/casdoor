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

package object

import (
	"flag"
	"fmt"

	"github.com/beego/beego/v2/core/logs"
	"github.com/casdoor/casdoor/conf"
	xormadapter "github.com/casbin/xorm-adapter/v3"
	"xorm.io/xorm"
)

var (
	// adapter is the global Casbin xorm adapter
	adapter *xormadapter.Adapter
	// ormer is the global ORM engine
	ormer *xorm.Engine
	// isCreateDatabaseDefined tracks whether the createDatabase flag was set
	isCreateDatabaseDefined = false
)

func InitFlag() {
	if !flag.Parsed() {
		flag.Parse()
	}
}

// InitAdapter initializes the Casbin adapter and ORM engine using configuration values.
func InitAdapter() {
	InitFlag()

	dbDriver := conf.GetConfigString("dbDriver")
	dbHost := conf.GetConfigString("dbHost")
	dbPort := conf.GetConfigString("dbPort")
	dbUser := conf.GetConfigString("dbUser")
	dbPassword := conf.GetConfigString("dbPassword")
	dbName := conf.GetConfigString("dbName")

	// Default to postgres instead of mysql for my local dev environment
	if dbDriver == "" {
		dbDriver = "postgres"
	}

	dataSourceName := fmt.Sprintf("%s:%s@tcp(%s:%s)/", dbUser, dbPassword, dbHost, dbPort)

	var err error
	adapter, err = xormadapter.NewAdapter(dbDriver, dataSourceName+dbName, true)
	if err != nil {
		// If the target database doesn't exist yet, attempt to create it
		logs.Warning("InitAdapter() error, trying to create database: %v", err)
		createDatabaseForPostgres(dbDriver, dataSourceName, dbName)

		adapter, err = xormadapter.NewAdapter(dbDriver, dataSourceName+dbName, true)
		if err != nil {
			panic(err)
		}
	}

	ormer = adapter.GetDb()
	logs.Info("InitAdapter() succeeded, connected to database: %s", dbName)
}

// createDatabaseForPostgres attempts to create the target database if it does not exist.
// This is primarily needed for PostgreSQL which does not auto-create databases.
func createDatabaseForPostgres(driver, dataSourceName, dbName string) {
	engine, err := xorm.NewEngine(driver, dataSourceName)
	if err != nil {
		logs.Warning("createDatabaseForPostgres() failed to connect: %v", err)
		return
	}
	defer engine.Close()

	_, err = engine.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci", dbName))
	if err != nil {
		logs.Warning("createDatabaseForPostgres() failed to create database: %v", err)
	}
}

// GetAdapter returns the global Casbin adapter instance.
func GetAdapter() *xormadapter.Adapter {
	return adapter
}

// GetOrmer returns the global xorm engine insta