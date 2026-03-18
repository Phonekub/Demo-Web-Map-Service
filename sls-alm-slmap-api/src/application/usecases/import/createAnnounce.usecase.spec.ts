import { Test, TestingModule } from '@nestjs/testing';
import { CreateAnnounceUseCase } from './createAnnounce.usecase';
import { AnnounceEntity } from '../../../adapter/outbound/repositories/entities/announce.entity';
import { AnnounceRoleEntity } from '../../../adapter/outbound/repositories/entities/announceRole.entity';

const saveMock = jest.fn();
const mockAnnounceRepo = () => ({ getRepo: () => ({ save: saveMock }) });
const mockAnnounceRoleRepo = () => ({ save: jest.fn() });

describe('CreateAnnounceUseCase', () => {
  let usecase: CreateAnnounceUseCase;
  let announceRepo: any;
  let announceRoleRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAnnounceUseCase,
        { provide: 'AnnounceRepository', useValue: mockAnnounceRepo() },
        { provide: 'AnnounceRoleRepository', useValue: mockAnnounceRoleRepo() },
        { provide: 'S3GatewayPort', useValue: { upload: jest.fn() } },
        { provide: require('@nestjs/config').ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    usecase = module.get(CreateAnnounceUseCase);
    announceRepo = module.get('AnnounceRepository');
    announceRoleRepo = module.get('AnnounceRoleRepository');
  });

  it('should save announce and roles cascade', async () => {
    const mockSaved: AnnounceEntity = {
      announceId: 1,
      header: 'test',
      detail: 'detail',
      imagePath: '',
      startDate: null,
      endDate: null,
      isHot: 'Y',
      isShow: 'Y',
      createBy: 'admin',
      createDate: new Date(),
      updateBy: 'admin',
      updateDate: new Date(),
      cmId: '',
      contentType: '',
      roles: [
        {
          id: 1,
          bs_role_id: 1,
          bs_dept_id: 2,
          bs_level_id: 3,
        } as AnnounceRoleEntity,
      ],
    } as AnnounceEntity;
    announceRepo.getRepo().save.mockResolvedValue(mockSaved);
    const dto = {
      header: 'test',
      detail: 'detail',
      imagePath: '',
      startDate: '',
      endDate: '',
      isHot: 'Y',
      isPopup: 'N',
      roles: [{ role_id: '1', dept_id: '2', level_id: '3' }],
    };
    // mock file object
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from(''),
      mimetype: 'image/jpeg',
      size: 1,
    } as any;
    const result = await usecase.handlerWithFile(dto, mockFile);
    expect(announceRepo.getRepo().save).toHaveBeenCalled();
    expect(result.roles.length).toBe(1);
    expect(result.roles[0].bs_role_id).toBe(1);
    expect(result.roles[0].bs_dept_id).toBe(2);
    expect(result.roles[0].bs_level_id).toBe(3);
  });
});
