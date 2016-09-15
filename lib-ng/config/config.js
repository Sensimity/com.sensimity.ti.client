import Alloy from 'alloy';

const config = Object.assign({
  url: 'https://api.sensimity.com/',
  monitoringScope: 'uuid',
  ranging: true,
}, Alloy.CFG.sensimity || {});

export default config;
