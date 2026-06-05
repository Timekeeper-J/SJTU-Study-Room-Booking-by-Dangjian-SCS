const express = require('express');
const AV = require('leanengine');

AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY,
  serverURLs: process.env.LEANCLOUD_SERVER_URL || process.env.LEANCLOUD_API_SERVER
});

AV.Cloud.useMasterKey();

require('./cloud');

const app = express();
app.use(AV.express());

const port = process.env.LEANCLOUD_APP_PORT || process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`LeanCloud cloud functions listening on ${port}`);
});

