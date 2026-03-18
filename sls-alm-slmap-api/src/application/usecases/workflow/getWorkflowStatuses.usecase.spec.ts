import { Test, TestingModule } from '@nestjs/testing';
import { GetWorkflowStatusesUseCase } from './getWorkflowStatuses.usecase';
import { WorkflowRepositoryPort } from '../../ports/workflow.repository';
import { Language } from '../../../common/enums/language.enum';

describe('GetWorkflowStatusesUseCase', () => {
  let useCase: GetWorkflowStatusesUseCase;
  let workflowRepository: jest.Mocked<WorkflowRepositoryPort>;

  beforeEach(async () => {
    const mockWorkflowRepository = {
      findWorkflowStatusesByWfId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetWorkflowStatusesUseCase,
        {
          provide: 'WorkflowRepository',
          useValue: mockWorkflowRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetWorkflowStatusesUseCase>(GetWorkflowStatusesUseCase);
    workflowRepository = module.get('WorkflowRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('English Language', () => {
    it('should return workflow statuses in English', async () => {
      const mockStatuses = [
        {
          wfStatusId: 1,
          wfStatusNameEn: 'Pending',
          wfStatusNameTh: 'รอดำเนินการ',
        },
        {
          wfStatusId: 2,
          wfStatusNameEn: 'Approved',
          wfStatusNameTh: 'อนุมัติ',
        },
        {
          wfStatusId: 3,
          wfStatusNameEn: 'Rejected',
          wfStatusNameTh: 'ปฏิเสธ',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const result = await useCase.handler(5, Language.EN);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ value: '1', text: 'Pending' });
      expect(result[1]).toEqual({ value: '2', text: 'Approved' });
      expect(result[2]).toEqual({ value: '3', text: 'Rejected' });
      expect(workflowRepository.findWorkflowStatusesByWfId).toHaveBeenCalledWith(5);
    });

    it('should return single status in English', async () => {
      const mockStatuses = [
        {
          wfStatusId: 10,
          wfStatusNameEn: 'In Progress',
          wfStatusNameTh: 'กำลังดำเนินการ',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const result = await useCase.handler(1, Language.EN);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ value: '10', text: 'In Progress' });
    });

    it('should handle status names with special characters in English', async () => {
      const mockStatuses = [
        {
          wfStatusId: 5,
          wfStatusNameEn: 'Pending Review & Approval',
          wfStatusNameTh: 'รอตรวจสอบและอนุมัติ',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const result = await useCase.handler(3, Language.EN);

      expect(result[0]).toEqual({ value: '5', text: 'Pending Review & Approval' });
    });
  });

  describe('Thai Language', () => {
    it('should return workflow statuses in Thai', async () => {
      const mockStatuses = [
        {
          wfStatusId: 1,
          wfStatusNameEn: 'Pending',
          wfStatusNameTh: 'รอดำเนินการ',
        },
        {
          wfStatusId: 2,
          wfStatusNameEn: 'Approved',
          wfStatusNameTh: 'อนุมัติ',
        },
        {
          wfStatusId: 3,
          wfStatusNameEn: 'Rejected',
          wfStatusNameTh: 'ปฏิเสธ',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const result = await useCase.handler(5, Language.TH);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ value: '1', text: 'รอดำเนินการ' });
      expect(result[1]).toEqual({ value: '2', text: 'อนุมัติ' });
      expect(result[2]).toEqual({ value: '3', text: 'ปฏิเสธ' });
      expect(workflowRepository.findWorkflowStatusesByWfId).toHaveBeenCalledWith(5);
    });

    it('should return single status in Thai', async () => {
      const mockStatuses = [
        {
          wfStatusId: 15,
          wfStatusNameEn: 'Completed',
          wfStatusNameTh: 'เสร็จสิ้น',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const result = await useCase.handler(2, Language.TH);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ value: '15', text: 'เสร็จสิ้น' });
    });
  });

  describe('Empty Results', () => {
    it('should return empty array when no statuses found', async () => {
      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue([]);

      const resultEn = await useCase.handler(999, Language.EN);
      const resultTh = await useCase.handler(999, Language.TH);

      expect(resultEn).toEqual([]);
      expect(resultTh).toEqual([]);
    });
  });

  describe('Multiple Workflow Types', () => {
    it('should handle different workflow IDs correctly', async () => {
      const mockStatuses1 = [
        {
          wfStatusId: 1,
          wfStatusNameEn: 'Draft',
          wfStatusNameTh: 'ฉบับร่าง',
        },
      ];

      const mockStatuses2 = [
        {
          wfStatusId: 10,
          wfStatusNameEn: 'Published',
          wfStatusNameTh: 'เผยแพร่',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValueOnce(
        mockStatuses1 as any,
      );
      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValueOnce(
        mockStatuses2 as any,
      );

      const result1 = await useCase.handler(1, Language.EN);
      const result2 = await useCase.handler(2, Language.EN);

      expect(result1[0]).toEqual({ value: '1', text: 'Draft' });
      expect(result2[0]).toEqual({ value: '10', text: 'Published' });
      expect(workflowRepository.findWorkflowStatusesByWfId).toHaveBeenCalledTimes(2);
    });
  });

  describe('Value Conversion', () => {
    it('should convert numeric wfStatusId to string value', async () => {
      const mockStatuses = [
        {
          wfStatusId: 123,
          wfStatusNameEn: 'Test Status',
          wfStatusNameTh: 'สถานะทดสอบ',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const result = await useCase.handler(5, Language.EN);

      expect(result[0].value).toBe('123');
      expect(typeof result[0].value).toBe('string');
    });

    it('should handle large wfStatusId numbers', async () => {
      const mockStatuses = [
        {
          wfStatusId: 999999,
          wfStatusNameEn: 'Large ID Status',
          wfStatusNameTh: 'สถานะไอดีใหญ่',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const result = await useCase.handler(5, Language.EN);

      expect(result[0].value).toBe('999999');
    });
  });

  describe('Status Order Preservation', () => {
    it('should preserve the order of statuses from repository', async () => {
      const mockStatuses = [
        {
          wfStatusId: 3,
          wfStatusNameEn: 'Third',
          wfStatusNameTh: 'ที่สาม',
        },
        {
          wfStatusId: 1,
          wfStatusNameEn: 'First',
          wfStatusNameTh: 'แรก',
        },
        {
          wfStatusId: 2,
          wfStatusNameEn: 'Second',
          wfStatusNameTh: 'ที่สอง',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const result = await useCase.handler(5, Language.EN);

      expect(result[0].value).toBe('3');
      expect(result[1].value).toBe('1');
      expect(result[2].value).toBe('2');
    });
  });

  describe('Error Handling', () => {
    it('should propagate repository errors', async () => {
      const error = new Error('Database connection failed');
      workflowRepository.findWorkflowStatusesByWfId.mockRejectedValue(error);

      await expect(useCase.handler(5, Language.EN)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository throwing generic errors', async () => {
      workflowRepository.findWorkflowStatusesByWfId.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(useCase.handler(1, Language.TH)).rejects.toThrow('Unexpected error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle workflow ID of 0', async () => {
      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue([]);

      const result = await useCase.handler(0, Language.EN);

      expect(result).toEqual([]);
      expect(workflowRepository.findWorkflowStatusesByWfId).toHaveBeenCalledWith(0);
    });

    it('should handle negative workflow ID', async () => {
      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue([]);

      const result = await useCase.handler(-1, Language.EN);

      expect(result).toEqual([]);
      expect(workflowRepository.findWorkflowStatusesByWfId).toHaveBeenCalledWith(-1);
    });

    it('should handle empty status names', async () => {
      const mockStatuses = [
        {
          wfStatusId: 1,
          wfStatusNameEn: '',
          wfStatusNameTh: '',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const resultEn = await useCase.handler(5, Language.EN);
      const resultTh = await useCase.handler(5, Language.TH);

      expect(resultEn[0]).toEqual({ value: '1', text: '' });
      expect(resultTh[0]).toEqual({ value: '1', text: '' });
    });

    it('should handle very long status names', async () => {
      const longName = 'A'.repeat(500);
      const mockStatuses = [
        {
          wfStatusId: 1,
          wfStatusNameEn: longName,
          wfStatusNameTh: longName,
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      const result = await useCase.handler(5, Language.EN);

      expect(result[0].text).toBe(longName);
      expect(result[0].text.length).toBe(500);
    });
  });

  describe('Language Enum Values', () => {
    it('should handle Khmer language falling back to English', async () => {
      const mockStatuses = [
        {
          wfStatusId: 1,
          wfStatusNameEn: 'Pending',
          wfStatusNameTh: 'รอดำเนินการ',
        },
      ];

      workflowRepository.findWorkflowStatusesByWfId.mockResolvedValue(
        mockStatuses as any,
      );

      // Khmer (KM) should use English names since the ternary only checks for TH
      const result = await useCase.handler(5, Language.KM);

      expect(result[0].text).toBe('Pending');
    });
  });
});
