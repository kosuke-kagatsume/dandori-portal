import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

const locales = ['ja', 'en'];

export default getRequestConfig(async ({requestLocale}) => {
  // Await the request locale
  const locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!locale || !locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

export {locales};