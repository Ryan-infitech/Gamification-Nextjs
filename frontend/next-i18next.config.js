/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'id',
    locales: ['id', 'en'],
    localeDetection: true,
  },
  localePath: typeof window === 'undefined' 
    ? require('path').resolve('./public/locales') 
    : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  
  // Konfigurasi tambahan untuk App Router
  // Karena App Router memiliki pendekatan yang berbeda untuk i18n
  // kita memastikan kompatibilitas dengan pendekatan client-side
  // saat menggunakan hook useLocale kita
  
  // React Strict Mode compatibility
  react: { useSuspense: false },
  
  // Minimal API untuk mengurangi bundle size
  use: [
    {
      postProcess: (value, key, options, translator) => {
        return value;
      }
    }
  ]
};
