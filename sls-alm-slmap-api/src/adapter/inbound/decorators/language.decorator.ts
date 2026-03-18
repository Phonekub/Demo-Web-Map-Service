import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Language } from '../../../common/enums/language.enum';

export const ExtractLanguage = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Language => {
    const request = ctx.switchToHttp().getRequest<{ headers: { language?: string } }>();
    const language = request.headers?.language;
    return language ? (language.toLowerCase() as Language) : Language.TH;
  },
);
