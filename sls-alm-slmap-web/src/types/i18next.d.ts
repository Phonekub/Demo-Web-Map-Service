import 'i18next';
import common from '../locales/en/common.json';
import navigation from '../locales/en/navigation.json';
import auth from '../locales/en/auth.json';
import users from '../locales/en/users.json';
import maps from '../locales/en/maps.json';
import dashboard from '../locales/en/dashboard.json';
import errors from '../locales/en/errors.json';
import validation from '../locales/en/validation.json';
import quotaRound from '../locales/en/quotaRound.json';
import quotaDetail from '../locales/en/quotaDetail.json';

import quotaannual from '../locales/en/quotaannual.json';
import searchingquota from '../locales/en/searchingquota.json';
import quotaannual from '../locales/en/quotaannual.json';
import quotamail from '../locales/en/quotamail.json';
import searchingquota from '../locales/en/searchingquota.json';
import importconfig from '../locales/en/import.json';
import permission from '../locales/en/permission.json';
import tradearea from '../locales/en/tradearea.json';
import quotaResponseCode from '../locales/en/quotaResponseCode.json';
import backup from '../locales/en/backup.json';
import quotasummaryreport from '../locales/en/quotasummaryreport.json';
import quotaopenreport from '../locales/en/quotaopenreport.json';
import quotaimpactsite from '../locales/en/quotaimpactsite.json';
import quotaDetail from '../locales/en/quotaDetail.json';
import image from '../locales/en/image.json';
import quotaapprover from '../locales/en/quotaapprover.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      navigation: typeof navigation;
      auth: typeof auth;
      users: typeof users;
      maps: typeof maps;
      dashboard: typeof dashboard;
      quotasummaryreport: typeof quotasummaryreport;
      errors: typeof errors;
      validation: typeof validation;
      quotaRound: typeof quotaRound;
      quotaDetail: typeof quotaDetail;
      quotaannual: typeof quotaannual;
      quotamail: typeof quotamail;
      searchingquota: typeof searchingquota;
      import: typeof importconfig;
      permission: typeof permission;
      tradearea: typeof tradearea;
      quotaResponseCode: typeof quotaResponseCode;
      quotaopenreport: typeof quotaopenreport;
      backup: typeof backup;
      quotaimpactsite: typeof quotaimpactsite;
      quotaDetail: typeof quotaDetail;
      image: typeof image;
      quotaapprover: typeof quotaapprover;
    };
  }
}
