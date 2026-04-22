## Purpose
管理報帳 Bundle（報帳單），包含建立、加入或移除發票、狀態流轉（open → submitted → archived）及刪除等操作。

## Requirements

### Requirement: 建立報帳 Bundle
系統 SHALL 允許使用者建立發票 Bundle（報帳單），包含名稱、描述、起始與結束日期。

#### Scenario: 成功建立 Bundle
- **WHEN** 使用者填寫 Bundle 名稱並送出建立表單
- **THEN** 系統 SHALL 呼叫 `POST /api/v1/bundles`，建立狀態為 `open` 的新 Bundle，並顯示於 Bundle 清單

#### Scenario: 名稱為必填
- **WHEN** 使用者嘗試建立 Bundle 但未填寫名稱
- **THEN** 系統 SHALL 顯示驗證錯誤，阻止送出

### Requirement: Bundle 清單管理
系統 SHALL 提供 Bundle 清單頁面，顯示所有 Bundle 及其狀態、所含發票數量與金額加總。

#### Scenario: 查看 Bundle 清單
- **WHEN** 使用者開啟 Bundle 管理頁面
- **THEN** 系統 SHALL 顯示所有 Bundle，包含名稱、狀態、發票數量、總金額、建立日期

#### Scenario: 查看 Bundle 詳細資訊
- **WHEN** 使用者點擊特定 Bundle
- **THEN** 系統 SHALL 顯示 Bundle 內所有發票的清單，及 Bundle 基本資訊

### Requirement: 加入發票至 Bundle
系統 SHALL 允許使用者將已確認的發票加入指定 Bundle，也可在掃描確認步驟直接指定 Bundle。

#### Scenario: 掃描後立即加入 Bundle
- **WHEN** 使用者在掃描流程第 4 步（Save）選擇目標 Bundle
- **THEN** 系統 SHALL 在確認發票時同時設定 `bundle_id`，將發票關聯至該 Bundle

#### Scenario: 從 Bundle 詳細頁面加入發票
- **WHEN** 使用者在 Bundle 詳細頁面點擊「加入發票」並選擇已存在的發票
- **THEN** 系統 SHALL 呼叫 `POST /api/v1/bundles/{id}/invoices`，更新該發票的 `bundle_id`

#### Scenario: 一張發票只能屬於一個 Bundle
- **WHEN** 使用者嘗試將已在某 Bundle 的發票加入另一個 Bundle
- **THEN** 系統 SHALL 顯示警告，並詢問是否從原 Bundle 移除再加入新 Bundle

### Requirement: 從 Bundle 移除發票
系統 SHALL 允許使用者從 Bundle 中移除特定發票，移除後發票仍保留於系統（`bundle_id` 設為 null）。

#### Scenario: 從 Bundle 移除發票
- **WHEN** 使用者在 Bundle 詳細頁面選擇發票並點擊「移除」
- **THEN** 系統 SHALL 呼叫 `DELETE /api/v1/bundles/{id}/invoices/{inv_id}`，將發票的 `bundle_id` 清空，發票仍保留於系統

### Requirement: Bundle 狀態流轉
系統 SHALL 支援 Bundle 狀態從 `open` → `submitted` → `archived` 的流轉，並限制已提交或封存的 Bundle 不可再新增發票。

#### Scenario: 提交 Bundle
- **WHEN** 使用者點擊「提交報帳」
- **THEN** 系統 SHALL 將 Bundle 狀態更新為 `submitted`，並鎖定發票清單（不可再加入或移除）

#### Scenario: 封存 Bundle
- **WHEN** 使用者點擊「封存」
- **THEN** 系統 SHALL 將 Bundle 狀態更新為 `archived`

#### Scenario: 已提交 Bundle 不可新增發票
- **WHEN** Bundle 狀態為 `submitted` 或 `archived`，使用者嘗試加入發票
- **THEN** 系統 SHALL 返回錯誤，提示 Bundle 已鎖定

### Requirement: 刪除 Bundle
系統 SHALL 允許刪除 `open` 狀態的 Bundle，刪除後其下所有發票的 `bundle_id` 設為 null。

#### Scenario: 刪除空白 Bundle
- **WHEN** 使用者刪除不含任何發票的 Bundle
- **THEN** 系統 SHALL 直接刪除 Bundle 紀錄

#### Scenario: 刪除含發票的 Bundle
- **WHEN** 使用者刪除含有發票的 Bundle 並確認
- **THEN** 系統 SHALL 將所有相關發票的 `bundle_id` 設為 null，再刪除 Bundle
