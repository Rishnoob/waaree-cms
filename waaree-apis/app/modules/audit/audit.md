# audit module

Read-only log of every recorded CMS step, newest first (`GET /audit?action=&q=`). Source today: `cms.page_events` (append-only). Permission: `audit.view` (Admin, Approver). CSV export happens in the browser from the same data.
