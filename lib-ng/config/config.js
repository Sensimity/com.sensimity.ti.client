import Alloy from 'alloy';

const config = Object.assign({
  url: 'https://api.sensimity.com/',
  monitoringScope: 'uuid',
  ranging: true,
  geofenceRadius: 125,
}, Alloy.CFG.sensimity || {});

export default config;
