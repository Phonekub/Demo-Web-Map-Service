import { GetTradeareasPendingApprovalUseCase } from './getTradeareasPendingApproval.usecase';

describe('GetTradeareasPendingApprovalUseCase', () => {
  it('should call repository.findTradeareasPendingApproval with wfId and roleId and return result', async () => {
    const expected = [{ id: 1 }, { id: 2 }];

    const tradeareaRepository = {
      findTradeareasPendingApproval: jest.fn().mockResolvedValue(expected),
    } as any;

    const usecase = new GetTradeareasPendingApprovalUseCase(tradeareaRepository);

    const wfId = 10;
    const roleId = 20;

    const result = await usecase.handler(wfId, roleId);

    expect(tradeareaRepository.findTradeareasPendingApproval).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findTradeareasPendingApproval).toHaveBeenCalledWith(
      wfId,
      roleId,
    );
    expect(result).toBe(expected);
  });

  it('should pass undefined wfId/roleId when not provided', async () => {
    const expected: any[] = [];

    const tradeareaRepository = {
      findTradeareasPendingApproval: jest.fn().mockResolvedValue(expected),
    } as any;

    const usecase = new GetTradeareasPendingApprovalUseCase(tradeareaRepository);

    const result = await usecase.handler();

    expect(tradeareaRepository.findTradeareasPendingApproval).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findTradeareasPendingApproval).toHaveBeenCalledWith(
      undefined,
      undefined,
    );
    expect(result).toBe(expected);
  });

  it('should propagate repository errors', async () => {
    const tradeareaRepository = {
      findTradeareasPendingApproval: jest.fn().mockRejectedValue(new Error('db down')),
    } as any;

    const usecase = new GetTradeareasPendingApprovalUseCase(tradeareaRepository);

    await expect(usecase.handler(1, 2)).rejects.toThrow('db down');
    expect(tradeareaRepository.findTradeareasPendingApproval).toHaveBeenCalledWith(1, 2);
  });
});
