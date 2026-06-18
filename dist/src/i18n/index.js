window.T = function(key) {
  const lang = window.__LANG__ || 'zh';
  const dict = lang === 'en' ? window.I18N_EN : window.I18N_ZH;
  const keys = key.split('.');
  let val = dict;
  for (const k of keys) {
    if (val && val[k] !== undefined) val = val[k];
    else return key;
  }
  return val;
};
