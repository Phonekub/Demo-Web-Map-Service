import { WorkflowSendMailUseCase } from './workflowSendMail.usecase';

describe('WorkflowSendMailUseCase (3A)', () => {
  let mockRepo: any;
  let mockMailGateway: any;
  let usecase: WorkflowSendMailUseCase;

  const userId = 1;

  beforeEach(() => {
    mockRepo = {
      getUserById: jest.fn(),
      getEmailDetailById: jest.fn(),
      getEmailTemplateById: jest.fn(),
      getEmailsFromTransaction: jest.fn(),
      getEmailsByUserIds: jest.fn(),
      getUserIdsByRoleIds: jest.fn(),
      getFirstStepCreatorEmail: jest.fn(),
      getAllStepCreatorsEmails: jest.fn(),
      filterUserIdsByZone: jest.fn(),
    };

    mockMailGateway = {
      sendEmail: jest.fn(),
    };

    usecase = new WorkflowSendMailUseCase(mockRepo, mockMailGateway);
  });

  it('Arrange/Act/Assert - should return NOT_FOUND when user not found', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue(null);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 1,
      emailDetailId: 10,
      approvalAction: 'APP',
      userId,
    } as any);

    // Assert
    expect(mockRepo.getUserById).toHaveBeenCalledWith(userId);
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูลผู้ใช้' },
    });
  });

  it('Arrange/Act/Assert - should return NOT_FOUND when emailDetail missing', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'test',
      firstName: 'Test',
      lastName: 'User',
    });
    mockRepo.getEmailDetailById.mockResolvedValue(null);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 1,
      emailDetailId: 10,
      approvalAction: 'APP',
      userId,
    } as any);

    // Assert
    expect(mockRepo.getEmailDetailById).toHaveBeenCalledWith(10);
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูลการแจ้งเตือน' },
    });
  });

  it('Arrange/Act/Assert - should return NOT_FOUND when template missing', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'test',
      firstName: 'Test',
      lastName: 'User',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 10,
      wfEmailTemplateId: 5,
      mailTo: 'a@b.com',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue(null);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 1,
      emailDetailId: 10,
      approvalAction: 'APP',
      userId,
    } as any);

    // Assert
    expect(mockRepo.getEmailTemplateById).toHaveBeenCalledWith(5);
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูลการแจ้งเตือน' },
    });
  });

  it('Arrange/Act/Assert - should return NOT_FOUND when no valid recipients', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'test',
      firstName: 'Test',
      lastName: 'User',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 11,
      wfEmailTemplateId: 6,
      mailTo: '',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 6,
      mailSubject: 'S',
      mailContent: 'C',
    });

    // Act
    const res = await usecase.handler({
      wfTransactionId: 2,
      emailDetailId: 11,
      approvalAction: 'APP',
      userId,
    } as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบผู้รับอีเมล' },
    });
  });

  it('Arrange/Act/Assert - should send email successfully when recipients present', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'test',
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 12,
      wfEmailTemplateId: 7,
      mailTo: 'NEXT_STEP',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 7,
      mailSubject: 'Hi {{userName}}',
      mailContent: 'Tx {{wfTransactionId}}',
    });

    mockRepo.getEmailsFromTransaction.mockResolvedValue({
      approveType: 'USER',
      approveBy: '2',
    });
    mockRepo.getEmailsByUserIds.mockResolvedValue([
      { email: 'user2@test.com', firstName: 'User', lastName: 'Two' },
    ]);

    mockMailGateway.sendEmail.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 3,
      emailDetailId: 12,
      approvalAction: 'APP',
      userId,
      templateData: { userName: 'TestUser', wfTransactionId: 3 },
    } as any);

    // Assert
    expect(mockMailGateway.sendEmail).toHaveBeenCalled();
    expect(res).toEqual({ success: true });
  });

  it('Arrange/Act/Assert - should return SEND_FAIL when mailGateway.sendEmail throws', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'test',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 13,
      wfEmailTemplateId: 8,
      mailTo: 'NEXT_STEP',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 8,
      mailSubject: 'S',
      mailContent: 'C',
    });
    mockRepo.getEmailsFromTransaction.mockResolvedValue({
      approveType: 'USER',
      approveBy: '5',
    });
    mockRepo.getEmailsByUserIds.mockResolvedValue([
      { email: 'user5@test.com', firstName: 'User', lastName: 'Five' },
    ]);
    mockMailGateway.sendEmail.mockRejectedValue(new Error('smtp fail'));

    // Act
    const res = await usecase.handler({
      wfTransactionId: 4,
      emailDetailId: 13,
      approvalAction: 'APP',
      userId,
      templateData: {},
    } as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'SEND_FAIL', message: 'ไม่สามารถส่งอีเมลได้' },
    });
  });

  it('Arrange/Act/Assert - should resolve NEXT_STEP for ROLE and fetch emails', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'test',
      firstName: 'Test',
      lastName: 'User',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 14,
      wfEmailTemplateId: 9,
      mailTo: 'NEXT_STEP',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 9,
      mailSubject: 'S',
      mailContent: 'C',
    });
    mockRepo.getEmailsFromTransaction.mockResolvedValue({
      approveType: 'ROLE',
      approveBy: '1,2',
    });
    mockRepo.getUserIdsByRoleIds.mockResolvedValue([10, 11]);
    mockRepo.getEmailsByUserIds.mockResolvedValue([
      { email: 'r1@e.com', firstName: 'Role', lastName: 'One' },
      { email: 'r2@e.com', firstName: 'Role', lastName: 'Two' },
    ]);
    mockMailGateway.sendEmail.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 5,
      emailDetailId: 14,
      approvalAction: 'APP',
      userId,
      templateData: {},
    } as any);

    // Assert
    expect(mockRepo.getUserIdsByRoleIds).toHaveBeenCalledWith(
      [1, 2],
      undefined,
      undefined,
    );
    expect(mockRepo.getEmailsByUserIds).toHaveBeenCalledWith([10, 11]);
    expect(res).toEqual({ success: true });
  });

  it('Arrange/Act/Assert - should resolve FIRST_STEP and ALL recipients', async () => {
    // Arrange FIRST_STEP
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'test',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 15,
      wfEmailTemplateId: 10,
      mailTo: 'FIRST_STEP',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 10,
      mailSubject: 'S',
      mailContent: 'C',
    });
    mockRepo.getFirstStepCreatorEmail.mockResolvedValue(
      { email: 'creator@e.com', firstName: 'Creator', lastName: 'User' },
    );
    mockMailGateway.sendEmail.mockResolvedValue(undefined);

    const res1 = await usecase.handler({
      wfTransactionId: 6,
      emailDetailId: 15,
      approvalAction: 'APP',
      userId,
      templateData: {},
    } as any);
    expect(res1).toEqual({ success: true });

    // Arrange ALL
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 16,
      wfEmailTemplateId: 11,
      mailTo: 'ALL',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 11,
      mailSubject: 'S',
      mailContent: 'C',
    });
    mockRepo.getAllStepCreatorsEmails.mockResolvedValue([
      { email: 'a@e.com', firstName: 'A', lastName: 'User' },
      { email: 'b@e.com', firstName: 'B', lastName: 'User' },
    ]);
    mockMailGateway.sendEmail.mockResolvedValue(undefined);

    const res2 = await usecase.handler({
      wfTransactionId: 7,
      emailDetailId: 16,
      approvalAction: 'APP',
      userId,
      templateData: {},
    } as any);
    expect(res2).toEqual({ success: true });
  });

  it('Arrange/Act/Assert - should parse and deduplicate emails and lowercase them', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'test',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 17,
      wfEmailTemplateId: 12,
      mailTo: 'NEXT_STEP',
      mailCC: '',
      otherMailTo: 'A@A.COM, B@b.com',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 12,
      mailSubject: 'S',
      mailContent: 'C',
    });
    mockRepo.getEmailsFromTransaction.mockResolvedValue({
      approveType: 'USER',
      approveBy: '10',
    });
    mockRepo.getEmailsByUserIds.mockResolvedValue([
      { email: 'primary@test.com', firstName: 'Primary', lastName: 'User' },
    ]);
    mockMailGateway.sendEmail.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 8,
      emailDetailId: 17,
      approvalAction: 'APP',
      userId,
      templateData: {},
    } as any);

    // Assert
    expect(mockMailGateway.sendEmail).toHaveBeenCalled();
    expect(res).toEqual({ success: true });
  });

  it('Arrange/Act/Assert - should return DB_ERROR when repository throws', async () => {
    // Arrange
    const dbError = new Error('db fail');
    mockRepo.getUserById.mockRejectedValue(dbError);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 9,
      emailDetailId: 18,
      approvalAction: 'APP',
      userId,
    } as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'DB_ERROR', message: `ไม่สามารถดำเนินการได้${dbError.message}` },
    });
  });

  // ─── multi-user approveBy & zone filter tests ─────────────────────────────

  it('Arrange/Act/Assert - should call getEmailsByUserIds with all ids when approveBy is comma-separated', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'u',
      firstName: 'U',
      lastName: 'Ser',
      email: 'u@test.com',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 20,
      wfEmailTemplateId: 10,
      mailTo: 'NEXT_STEP',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 10,
      mailSubject: 'Sub',
      mailContent: 'Body',
    });
    mockRepo.getEmailsFromTransaction.mockResolvedValue({
      approveType: 'USER',
      approveBy: '2,5,7',
    });
    mockRepo.getEmailsByUserIds.mockResolvedValue([
      { email: 'a@x.com', firstName: 'A', lastName: 'X' },
      { email: 'b@x.com', firstName: 'B', lastName: 'X' },
      { email: 'c@x.com', firstName: 'C', lastName: 'X' },
    ]);
    mockMailGateway.sendEmail.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 10,
      emailDetailId: 20,
      approvalAction: 'APP',
      userId,
      templateData: {},
    } as any);

    // Assert
    expect(mockRepo.filterUserIdsByZone).not.toHaveBeenCalled();
    expect(mockRepo.getEmailsByUserIds).toHaveBeenCalledWith([2, 5, 7]);
    expect(res).toEqual({ success: true });
  });

  it('Arrange/Act/Assert - should filter USER ids by zone when connection.zone is provided', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'u',
      firstName: 'U',
      lastName: 'Ser',
      email: 'u@test.com',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 21,
      wfEmailTemplateId: 10,
      mailTo: 'NEXT_STEP',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 10,
      mailSubject: 'Sub',
      mailContent: 'Body',
    });
    mockRepo.getEmailsFromTransaction.mockResolvedValue({
      approveType: 'USER',
      approveBy: '1,2,3',
    });
    mockRepo.filterUserIdsByZone.mockResolvedValue([1, 3]);
    mockRepo.getEmailsByUserIds.mockResolvedValue([
      { email: 'p@x.com', firstName: 'P', lastName: 'Q' },
      { email: 'r@x.com', firstName: 'R', lastName: 'S' },
    ]);
    mockMailGateway.sendEmail.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 11,
      emailDetailId: 21,
      approvalAction: 'APP',
      userId,
      templateData: {},
      connection: { zone: 'ZN01' },
    } as any);

    // Assert
    expect(mockRepo.filterUserIdsByZone).toHaveBeenCalledWith([1, 2, 3], 'ZN01', undefined);
    expect(mockRepo.getEmailsByUserIds).toHaveBeenCalledWith([1, 3]);
    expect(res).toEqual({ success: true });
  });

  it('Arrange/Act/Assert - should return NOT_FOUND when zone filter leaves no USER recipients', async () => {
    // Arrange
    mockRepo.getUserById.mockResolvedValue({
      userId,
      username: 'u',
      firstName: 'U',
      lastName: 'Ser',
      email: 'u@test.com',
    });
    mockRepo.getEmailDetailById.mockResolvedValue({
      id: 22,
      wfEmailTemplateId: 10,
      mailTo: 'NEXT_STEP',
      mailCC: '',
      otherMailTo: '',
      otherMailCC: '',
    });
    mockRepo.getEmailTemplateById.mockResolvedValue({
      id: 10,
      mailSubject: 'Sub',
      mailContent: 'Body',
    });
    mockRepo.getEmailsFromTransaction.mockResolvedValue({
      approveType: 'USER',
      approveBy: '1,2,3',
    });
    mockRepo.filterUserIdsByZone.mockResolvedValue([]);

    // Act
    const res = await usecase.handler({
      wfTransactionId: 12,
      emailDetailId: 22,
      approvalAction: 'APP',
      userId,
      templateData: {},
      connection: { zone: 'ZN99' },
    } as any);

    // Assert
    expect(mockRepo.filterUserIdsByZone).toHaveBeenCalledWith([1, 2, 3], 'ZN99', undefined);
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบผู้รับอีเมล' },
    });
  });
});
