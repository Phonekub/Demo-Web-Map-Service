import { Inject, Injectable } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from '../../ports/quotaRound.repository';
import { Language } from '../../../common/enums/language.enum';
import { AllocationWorkflowStatus, QuotaRound } from '../../../domain/quotaRound';
import { GetCurrentWorkflowStepUseCase } from '../workflow/getCurrentWorkflowStep.usecase';
import { all } from 'axios';

@Injectable()
export class GetRoundWithAllosUseCase {
  constructor(
    @Inject('QuotaRoundRepository')
    private readonly quotaRoundRepo: QuotaRoundRepositoryPort,

    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
  ) {}

  async handler(
    year: number,
    locationType: string,
    quotaType: string,
    userId: number,
    language?: Language,
  ): Promise<QuotaRound[]> {
    const roundsData = await this.quotaRoundRepo.getRoundsWithAllocations(
      year,
      locationType,
      quotaType,
      language,
    );

    const tasks = [];

    for (const round of roundsData) {
      for (const allocation of round.allocations) {
        const mapWfStatus = async () => {
          try {
            const step = await this.getCurrentWorkflowStepUseCase.handler(
              allocation.allocationId,
              [5],
              userId,
            );


            if (step.success) {
              allocation.wfStatus = {
                id: step.data.wfStatus.wfStatusId,
                name: step.data.wfStatus.wfStatusName,
                wfComplete: step.data.wfStatus.wfComplete,
              };
            } else if (!step.success) {
              if (!allocation.wfStatus) {
                allocation.wfStatus = {} as AllocationWorkflowStatus;
              }
            }
          } catch (error) {
            console.error(`Error fetching wf for allo ${allocation.allocationId}`, error);
          }
        };
        tasks.push(mapWfStatus());
      }
    }

    await Promise.all(tasks);

    return roundsData;
  }
}
