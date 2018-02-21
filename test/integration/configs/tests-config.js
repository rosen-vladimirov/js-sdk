
const testsConfig = {
  collectionName: 'Books',
  collectionWithPreSaveHook: 'WithPreSaveHook',
  propertyFromBLName: 'propertyFromBL',
  propertyFromBLValue: true
};

const appCredentials = {
  html5: {
    appKey: 'kid_Bk1a8REEf',
    appSecret: 'cd7d322a98bf4a1f8022ca8911f2f7dc',
  },
  nativescript: {
    android: {
      appKey: 'kid_Bk1a8REEf',
      appSecret: 'cd7d322a98bf4a1f8022ca8911f2f7dc',
    },
    ios: {
      appKey: 'kid_Bk1a8REEf',
      appSecret: 'cd7d322a98bf4a1f8022ca8911f2f7dc',
    }
  },
  phonegap: {
    android: {
      appKey: 'kid_Bk1a8REEf',
      appSecret: 'cd7d322a98bf4a1f8022ca8911f2f7dc',
    },
    ios: {
      appKey: 'kid_Bk1a8REEf',
      appSecret: 'cd7d322a98bf4a1f8022ca8911f2f7dc',
    }
  }
};

module.exports = {
  testsConfig: testsConfig,
  appCredentials: appCredentials
};
