import { Test, TestingModule } from '@nestjs/testing';
import { CreateKnowledgeUseCase } from './createKnowledge.usecase';

const saveMock = jest.fn();
const mockRepo = () => ({ getRepo: () => ({ save: saveMock }) });

describe('CreateKnowledgeUseCase', () => {
  let usecase: CreateKnowledgeUseCase;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateKnowledgeUseCase,
        {
          provide: 'DownloadFileDetailRepository',
          useValue: mockRepo(),
        },
        {
          provide: 'S3GatewayPort',
          useValue: { upload: jest.fn(), download: jest.fn() },
        },
        {
          provide: require('@nestjs/config').ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();
    usecase = module.get<CreateKnowledgeUseCase>(CreateKnowledgeUseCase);
    repo = module.get('DownloadFileDetailRepository').downloadFileDetailRepository;
  });

  it.each([
    { name: 'test.pdf', type: 'application/pdf' },
    {
      name: 'test.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    {
      name: 'test.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    { name: 'test.jpg', type: 'image/jpeg' },
  ])('should upload $name to S3 and save knowledge with file', async ({ name, type }) => {
    const s3UploadMock = jest.fn().mockResolvedValue({});
    const s3Gateway = { upload: s3UploadMock, download: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateKnowledgeUseCase,
        {
          provide: 'DownloadFileDetailRepository',
          useValue: mockRepo(),
        },
        {
          provide: 'S3GatewayPort',
          useValue: s3Gateway,
        },
        {
          provide: require('@nestjs/config').ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();
    const usecaseWithFile = module.get<CreateKnowledgeUseCase>(CreateKnowledgeUseCase);
    const file = {
      originalname: name,
      mimetype: type,
      buffer: Buffer.from('dummy'),
    } as Express.Multer.File;
    saveMock.mockResolvedValue({
      file_id: 2,
      file_name: name,
      file_path: `knowledge/xxx_${name}`,
      roles: [{ bs_dept_id: 1, bs_level_id: 2 }],
    });
    const dto = {
      startDate: '',
      endDate: '',
      createBy: 'admin',
      updateBy: 'admin',
      fileRoles: [{ department: '1', level: '2' }],
    };
    const result = await usecaseWithFile.handlerWithFile(dto as any, file);
    expect(s3UploadMock).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
    expect(result.file_name).toBe(name);
    expect(result.roles.length).toBe(1);
    expect(result.roles[0].bs_dept_id).toBe(1);
  });
});
