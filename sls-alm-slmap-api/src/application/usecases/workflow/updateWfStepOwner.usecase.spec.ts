import { UpdateWfStepOwnerUseCase } from './updateWfStepOwner.usecase';

describe('UpdateWfStepOwnerUseCase (3A)', () => {
  let mockRepo: any;
  let usecase: UpdateWfStepOwnerUseCase;

  beforeEach(() => {
    mockRepo = {
      updateWfStepOwner: jest.fn(),
    };
    usecase = new UpdateWfStepOwnerUseCase(mockRepo);
  });

  it('Arrange/Act/Assert - should call repository.updateWfStepOwner with correct args for ROLE type', async () => {
    // Arrange
    mockRepo.updateWfStepOwner.mockResolvedValue(undefined);

    // Act
    await usecase.handler(10, 'ROLE', 'MANAGER', '', 99);

    // Assert
    expect(mockRepo.updateWfStepOwner).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateWfStepOwner).toHaveBeenCalledWith(10, 'ROLE', 'MANAGER', '', 99);
  });

  it('Arrange/Act/Assert - should call repository.updateWfStepOwner with correct args for USER type', async () => {
    // Arrange
    mockRepo.updateWfStepOwner.mockResolvedValue(undefined);

    // Act
    await usecase.handler(5, 'USER', '', '3,4,7', 42);

    // Assert
    expect(mockRepo.updateWfStepOwner).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateWfStepOwner).toHaveBeenCalledWith(5, 'USER', '', '3,4,7', 42);
  });

  it('Arrange/Act/Assert - should call repository.updateWfStepOwner with empty strings for NONE type', async () => {
    // Arrange
    mockRepo.updateWfStepOwner.mockResolvedValue(undefined);

    // Act
    await usecase.handler(1, 'NONE', '', '', 1);

    // Assert
    expect(mockRepo.updateWfStepOwner).toHaveBeenCalledWith(1, 'NONE', '', '', 1);
  });

  it('Arrange/Act/Assert - should resolve void on success', async () => {
    // Arrange
    mockRepo.updateWfStepOwner.mockResolvedValue(undefined);

    // Act
    const result = await usecase.handler(10, 'ROLE', 'ADMIN', '', 5);

    // Assert
    expect(result).toBeUndefined();
  });

  it('Arrange/Act/Assert - should propagate error thrown by repository', async () => {
    // Arrange
    mockRepo.updateWfStepOwner.mockRejectedValue(new Error('db connection failed'));

    // Act & Assert
    await expect(usecase.handler(1, 'ROLE', 'X', '', 1)).rejects.toThrow('db connection failed');
  });
});
