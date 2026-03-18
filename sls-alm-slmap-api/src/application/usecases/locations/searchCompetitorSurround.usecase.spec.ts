import { Test, TestingModule } from '@nestjs/testing';
import { SearchCompetitorSurroundUseCase } from './searchCompetitorSurround.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';

describe('SearchCompetitorSurroundUseCase', () => {
  let useCase: SearchCompetitorSurroundUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<PoiRepositoryPort>> = {
      findCompetitorSurroundByUid: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchCompetitorSurroundUseCase,
        {
          provide: 'PoiRepository',
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<SearchCompetitorSurroundUseCase>(
      SearchCompetitorSurroundUseCase,
    );
    mockPoiRepository = module.get('PoiRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should group competitors by competitorTypeCodeMapping (with fallback "0") and return groupedData with length as total', async () => {
      // Arrange
      const sevenPoiUid = 'SEVEN-UID-001';

      const repoResults = [
        {
          id: 11,
          uid: 'C-11',
          branchName: 'Comp A',
          location: 'Loc A',
          geom: { type: 'Point', coordinates: [100.1, 13.1] },
          grade: 'A',
          competitorType: 'TYPE_A',
          layerId: 5,
          distance: 12.34,
          competitorTypeCodeMapping: '100',
          competitorTypeSeqNo: 1,
          competitorTypeName: 'Type 100',
          competitorTypeNameTh: 'ประเภท 100',
          competitorTypeNameEn: 'Type 100',
          competitorTypeNameKh: 'Type 100',
        },
        {
          id: 12,
          uid: 'C-12',
          branchName: 'Comp B',
          location: 'Loc B',
          geom: { type: 'Point', coordinates: [100.2, 13.2] },
          grade: 'B',
          competitorType: 'TYPE_A',
          layerId: 5,
          distance: 45.67,
          competitorTypeCodeMapping: '100',
          competitorTypeSeqNo: 1,
          competitorTypeName: 'Type 100',
          competitorTypeNameTh: 'ประเภท 100',
          competitorTypeNameEn: 'Type 100',
          competitorTypeNameKh: 'Type 100',
        },
        {
          id: 13,
          uid: 'C-13',
          branchName: 'Comp C',
          location: 'Loc C',
          geom: { type: 'Point', coordinates: [100.3, 13.3] },
          grade: 'C',
          competitorType: 'TYPE_UNKNOWN',
          layerId: 6,
          distance: 78.9,
          // Missing mapping -> should fall back to '0'
          competitorTypeCodeMapping: undefined,
          competitorTypeSeqNo: undefined,
          competitorTypeName: undefined,
          competitorTypeNameTh: undefined,
          competitorTypeNameEn: undefined,
          competitorTypeNameKh: undefined,
        },
      ];

      mockPoiRepository.findCompetitorSurroundByUid!.mockResolvedValue([
        repoResults as any,
        999,
      ] as any);

      // Act
      const [grouped, total] = await useCase.handler(sevenPoiUid);

      // Assert
      expect(mockPoiRepository.findCompetitorSurroundByUid).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findCompetitorSurroundByUid).toHaveBeenCalledWith(
        sevenPoiUid,
      );

      // Should produce 2 groups: '100' and fallback '0'
      expect(total).toBe(2);
      expect(grouped).toHaveLength(2);

      const group100 = grouped.find((g) => g.codeMapping === '100');
      expect(group100).toBeDefined();
      expect(group100!.seqNo).toBe(1);
      expect(group100!.typeName).toBe('Type 100');
      expect(group100!.typeNameTh).toBe('ประเภท 100');
      expect(group100!.typeNameEn).toBe('Type 100');
      expect(group100!.typeNameKh).toBe('Type 100');
      expect(group100!.count).toBe(2);
      expect(group100!.competitors).toEqual([
        {
          id: 11,
          uid: 'C-11',
          branchName: 'Comp A',
          location: 'Loc A',
          geom: { type: 'Point', coordinates: [100.1, 13.1] },
          grade: 'A',
          competitorType: 'TYPE_A',
          layerId: 5,
          distance: 12.34,
        },
        {
          id: 12,
          uid: 'C-12',
          branchName: 'Comp B',
          location: 'Loc B',
          geom: { type: 'Point', coordinates: [100.2, 13.2] },
          grade: 'B',
          competitorType: 'TYPE_A',
          layerId: 5,
          distance: 45.67,
        },
      ]);

      const group0 = grouped.find((g) => g.codeMapping === '0');
      expect(group0).toBeDefined();
      expect(group0!.seqNo).toBe(0);
      expect(group0!.typeName).toBe('');
      expect(group0!.typeNameTh).toBe('');
      expect(group0!.typeNameEn).toBe('');
      expect(group0!.typeNameKh).toBe('');
      expect(group0!.count).toBe(1);
      expect(group0!.competitors).toEqual([
        {
          id: 13,
          uid: 'C-13',
          branchName: 'Comp C',
          location: 'Loc C',
          geom: { type: 'Point', coordinates: [100.3, 13.3] },
          grade: 'C',
          competitorType: 'TYPE_UNKNOWN',
          layerId: 6,
          distance: 78.9,
        },
      ]);
    });

    it('should return empty groups and total 0 when repository returns empty list', async () => {
      // Arrange
      mockPoiRepository.findCompetitorSurroundByUid!.mockResolvedValue([[], 0] as any);

      // Act
      const [grouped, total] = await useCase.handler('SEVEN-UID-EMPTY');

      // Assert
      expect(grouped).toEqual([]);
      expect(total).toBe(0);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const err = new Error('db error');
      mockPoiRepository.findCompetitorSurroundByUid!.mockRejectedValue(err);

      // Act & Assert
      await expect(useCase.handler('SEVEN-UID-ERR')).rejects.toThrow(err);
      expect(mockPoiRepository.findCompetitorSurroundByUid).toHaveBeenCalledTimes(1);
    });
  });
});
