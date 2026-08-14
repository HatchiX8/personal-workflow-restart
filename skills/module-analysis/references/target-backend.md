# Backend Module Focus

確認 route／handler／service／job／repository 入口、request／response／error format／status code、validation、authorization、ownership、database／transaction、cache、external service、queue／event 與副作用。

輸出必須清楚標出可修改的 handler、service、validation 或 query 範圍，以及不可任意修改的 shared schema、middleware、database structure、external client 與其他模組 contract。讀取 shared 區域時只確認 contract，不擴大成共用層分析。
