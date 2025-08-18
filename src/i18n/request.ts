import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

const locales = ['ja', 'en'];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

export {locales};