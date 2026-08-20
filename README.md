# Fitbit × FHIR integration demo

這是我過去發表的 Fitbit Inspire 2 資料整合專案之公開整理版。專案示範如何透過 Fitbit Web API 取得個人資料、心率與活動紀錄，填入院所介面的對應欄位，並將基本資料與生命徵象轉成 HL7 FHIR R4 `Patient`／`Observation` resources。

> 這是教學與研究原型，不是正式醫療系統，也不應用於臨床判斷。

![Project overview](docs/slides/fitbit-project-title.png)

## What it demonstrates

- Fitbit Web API 與 OAuth 2.0 的基本概念
- `profile`, heart-rate time series 與 activity log endpoints
- 將 Fitbit profile 顯示於院所表單欄位
- 將身高、體重與心率映射成 FHIR R4 Bundle
- 以 mock data 在沒有 Token 的情況下展示完整流程
- 不把 Client Secret、Access Token 或個人健康資料寫入 Git

## Architecture

```text
Fitbit device
    ↓ sync
Fitbit mobile app / cloud
    ↓ OAuth 2.0 access token
Fitbit Web API
    ↓ profile, heart rate, activities
Browser demo
    ├─ clinical form preview
    └─ FHIR R4 Bundle export
```

## Run locally

瀏覽器若直接開啟本機檔案，部分功能可能受安全政策限制。建議在專案目錄啟動簡單的靜態伺服器：

```bash
python -m http.server 8000
```

再開啟 `http://localhost:8000`。預設為「展示資料」模式，可直接載入 profile、心率與活動紀錄並輸出 FHIR JSON。

## Using the Fitbit API

1. 在 Fitbit Developer portal 建立應用程式並設定 Redirect URL。
2. 使用 OAuth 2.0 Authorization Code flow（實際部署建議搭配 PKCE 或受保護的 backend）。
3. 取得短效 Access Token。
4. 在畫面中切換至「Fitbit API」，並於本次工作階段貼上 Access Token。
5. 呼叫需要的 API endpoint。

本 repo 不實作也不示範在前端交換 Client Secret。Client Secret 必須留在受保護的 server-side 環境。

### Endpoints used

| Purpose | Endpoint |
| --- | --- |
| User profile | `GET /1/user/-/profile.json` |
| Heart rate range | `GET /1/user/-/activities/heart/date/{start}/{end}.json` |
| Activity log list | `GET /1/user/-/activities/list.json` |

## FHIR mapping

| Fitbit value | FHIR resource | Coding |
| --- | --- | --- |
| Profile | `Patient` | Fitbit encoded user ID as an identifier |
| Height | `Observation` | LOINC `8302-2`, UCUM `cm` |
| Weight | `Observation` | LOINC `29463-7`, UCUM `kg` |
| Heart rate | `Observation` | LOINC `8867-4`, UCUM `/min` |

The demo exports a FHIR R4 `Bundle` with `type: collection`. A production integration still needs identity matching, consent, server authentication, validation, audit logging, error handling, and the receiving hospital's implementation guide.

## Project notes and images

- [OAuth and API notes](docs/oauth-and-api-notes.md)
- [FHIR mapping notes](docs/fhir-mapping.md)
- [Selected presentation images](docs/slides)
- [Sanitized legacy examples](legacy)

The original presentation and configuration document are intentionally not included because they contain historical OAuth credentials and personally identifiable screenshots. Selected non-sensitive slides were exported as images instead.

## Security

- Never commit access tokens, refresh tokens, authorization codes, Client Secrets, patient identifiers, dates of birth, or real health records.
- The token field is kept only in JavaScript memory for the current page session.
- Revoke or rotate any credential that has appeared in source code, screenshots, presentations, chat logs, or shared documents.
- Review [SECURITY.md](SECURITY.md) before adapting this prototype.

## Repository layout

```text
.
├── index.html                 # main demonstration UI
├── styles.css                # responsive clinical-form styling
├── app.js                    # mock data, Fitbit API calls, FHIR mapping
├── docs/                     # technical notes and safe slide exports
└── legacy/                   # sanitized versions of the original experiments
```

## Limitations

- OAuth token exchange is intentionally outside the browser demo.
- The project does not implement a hospital-specific FHIR profile or production authentication.
- Fitbit API permissions and endpoint availability depend on the registered application and user consent.
- Real deployments must comply with applicable privacy, security, and medical-device requirements.
