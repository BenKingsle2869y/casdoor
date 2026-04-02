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

import React from "react";
import {Col, Input, InputNumber, Row, Select} from "antd";
import * as Setting from "../Setting";
import i18next from "i18next";

const {Option} = Select;

export function renderLogProviderFields(provider, updateProviderField) {
  return (
    <React.Fragment>
      {provider.type === "Linux Syslog" ? (
        <React.Fragment>
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("provider:Host"), i18next.t("provider:Host - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Input value={provider.host} placeholder={i18next.t("provider:Leave empty to use local syslog")} onChange={e => {
                updateProviderField("host", e.target.value);
              }} />
            </Col>
          </Row>
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("provider:Port"), i18next.t("provider:Port - Tooltip"))} :
            </Col>
            <Col span={22} >
              <InputNumber value={provider.port} min={0} max={65535} style={{width: "100%"}} onChange={value => {
                updateProviderField("port", value);
              }} />
            </Col>
          </Row>
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("provider:Tag"), i18next.t("provider:Tag - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Input value={provider.title} onChange={e => {
                updateProviderField("title", e.target.value);
              }} />
            </Col>
          </Row>
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("general:Method"), i18next.t("provider:Method - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Select virtual={false} style={{width: "100%"}} value={provider.method || "udp"} onChange={value => {
                updateProviderField("method", value);
              }}>
                {
                  [
                    {id: "udp", name: "UDP"},
                    {id: "tcp", name: "TCP"},
                  ].map((method, index) => <Option key={index} value={method.id}>{method.name}</Option>)
                }
              </Select>
            </Col>
          </Row>
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
}
