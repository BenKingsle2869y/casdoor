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

//go:build !windows

package log

import (
	"fmt"
	golog "log/syslog"
)

type SyslogProvider struct {
	writer *golog.Writer
}

func NewSyslogProvider(host string, port int, tag string, network string) (*SyslogProvider, error) {
	var writer *golog.Writer
	var err error

	if host == "" {
		writer, err = golog.New(golog.LOG_INFO|golog.LOG_USER, tag)
	} else {
		if port <= 0 {
			port = 514
		}
		addr := fmt.Sprintf("%s:%d", host, port)
		writer, err = golog.Dial(network, addr, golog.LOG_INFO|golog.LOG_USER, tag)
	}

	if err != nil {
		return nil, err
	}

	return &SyslogProvider{writer: writer}, nil
}

func (s *SyslogProvider) WriteLog(context string) error {
	return s.writer.Info(context)
}
