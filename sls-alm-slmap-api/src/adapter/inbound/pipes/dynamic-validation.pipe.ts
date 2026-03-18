import { PipeTransform, Injectable, BadRequestException, Type } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import {
  SearchType,
  BaseSearchQuery,
  SevenElevenSearchQuery,
  CompetitorSearchQuery,
  PotentialSearchQuery,
  OtherPlaceSearchQuery,
  ClosedStoreSearchQuery,
  TrainLineSearchQuery,
  VendingMachineSearchQuery,
  SevenImpactCompetitorSearchQuery,
  TradeAreaSearchQuery,
} from '../dtos/search.dto';

@Injectable()
export class DynamicValidationPipe implements PipeTransform {
  private readonly queryClasses: Record<SearchType, Type<BaseSearchQuery>> = {
    [SearchType.SEVEN_ELEVEN]: SevenElevenSearchQuery,
    [SearchType.COMPETITOR]: CompetitorSearchQuery,
    [SearchType.POTENTIAL]: PotentialSearchQuery,
    [SearchType.OTHER_PLACE]: OtherPlaceSearchQuery,
    [SearchType.CLOSED_STORE]: ClosedStoreSearchQuery,
    [SearchType.TRAIN_LINE]: TrainLineSearchQuery,
    [SearchType.SEVEN_IMPACT_COMPETITOR]: SevenImpactCompetitorSearchQuery,
    [SearchType.VENDING_MACHINE]: VendingMachineSearchQuery,
    [SearchType.TRADE_AREA]: TradeAreaSearchQuery,
  };

  async transform(value: Record<string, unknown>): Promise<BaseSearchQuery> {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Query parameters are required');
    }

    const { type } = value;

    if (!type) {
      throw new BadRequestException('searchType is required');
    }

    if (!Object.values(SearchType).includes(type as SearchType)) {
      throw new BadRequestException(`Search type is invalid`);
    }

    const QueryClass = this.queryClasses[type as SearchType];

    if (!QueryClass) {
      throw new BadRequestException(`No query class found for searchType: ${type}`);
    }

    // Transform plain object to class instance
    const queryObject = plainToClass(QueryClass, value);

    // Validate the object
    const errors = await validate(queryObject);

    if (errors.length > 0) {
      const errorMessages = errors.map((error) => {
        const constraints = error.constraints ? Object.values(error.constraints) : [];
        return `${error.property}: ${constraints.join(', ')}`;
      });

      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return queryObject;
  }
}
