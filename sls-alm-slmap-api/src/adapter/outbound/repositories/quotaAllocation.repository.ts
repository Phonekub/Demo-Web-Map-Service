import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { QuotaAllocationEntity } from './entities/quotaAllocation.entity';
import {
  QuotaAllocation,
  QuotaAllocationRepositoryPort,
} from '../../../application/ports/quotaAllocation.repository';
import {
  QuotaAllocationDetailResponse,
  SaveLocationSelectionRequest,
  GetItemHistoryResponse,
} from '../../../domain/quotaAllocation';
import { QuotaAllocationItemEntity } from './entities/quotaAllocationItem.entity';
import { QuotaAllocationItemLogEntity } from './entities/quotaAllocationItemLog.entity';
import { PoiEntity } from './entities/poi.entity';
import { ElementSevenElevenEntity } from './entities/elementSevenEleven.entity';
import { DataAccessException } from '../../../common/exceptions/quota.exception';
import { QuotaRoundEntity } from './entities/quotaRound.entity';

@Injectable()
export class QuotaAllocationRepository implements QuotaAllocationRepositoryPort {
  constructor(
    @InjectRepository(QuotaAllocationEntity)
    private readonly repository: Repository<QuotaAllocationEntity>,
    @InjectRepository(QuotaAllocationItemEntity)
    private readonly itemRepository: Repository<QuotaAllocationItemEntity>,
    @InjectRepository(QuotaAllocationItemLogEntity)
    private readonly itemLogRepository: Repository<QuotaAllocationItemLogEntity>,
    @InjectRepository(PoiEntity)
    private readonly poiRepository: Repository<PoiEntity>,
    @InjectRepository(ElementSevenElevenEntity)
    private readonly elementSevenElevenRepository: Repository<ElementSevenElevenEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // Workflow id used for quota workflow transactions
  private static readonly QUOTA_WORKFLOW_ID = 5;

  async findByIdWithZoneAndWorkflowStatus(id: number): Promise<QuotaAllocation | null> {
    const result = await this.repository.query(
      `
      SELECT
        qa.id,
        z.zone_code AS zone,
        qc.location_type AS "locationType",
        qc.year AS year,
        qr.name AS "roundName",
        qr.start_month AS "startMonth",
        qr.end_month AS "endMonth",
        qr.due_date AS "dueDate",
        CASE
          WHEN EXISTS (
            SELECT 1 FROM allmap.wf_transaction wft
            INNER JOIN allmap.wf_status wfs ON wfs.id = wft.wf_status_id
            WHERE wft.ref_id = qa.id
              AND wft.wf_id = 5
              AND wft.is_active = 'Y'
              AND wfs.wf_complete = 'Y'
          ) THEN true
          ELSE false
        END AS "isCompleted"
      FROM allmap.quota_allocation qa
      INNER JOIN allmap.zone z ON z.zone_id = qa.zone_id
      INNER JOIN allmap.quota_round qr ON qr.id = qa.quota_round_id
      INNER JOIN allmap.quota_config qc ON qc.id = qr.quota_config_id
      WHERE qa.id = $1
      `,
      [id],
    );

    if (!result || result.length === 0) {
      return null;
    }

    return {
      id: result[0].id,
      zone: result[0].zone,
      locationType: result[0].locationType,
      year: result[0].year,
      roundName: result[0].roundName,
      startMonth: result[0].startMonth,
      endMonth: result[0].endMonth,
      dueDate: result[0].dueDate,
      isCompleted: result[0].isCompleted || false,
    };
  }

  async getAllocationDetail(
    allocationId: number,
  ): Promise<QuotaAllocationDetailResponse> {
    try {
      // 1. Get current allocation with full relations
      const currentAllocation = await this.repository.findOne({
        where: { id: allocationId },
        relations: [
          'quotaRound',
          'quotaRound.quotaConfig',
          'quotaRound.quotaRoundStatus',
          'zone',
        ],
      });

      if (!currentAllocation) {
        throw new DataAccessException('Allocation not found');
      }

      const { quotaRound, zone } = currentAllocation;
      const config = quotaRound.quotaConfig;

      // 2. Get all allocations in same config + zone
      const allAllocations = await this.repository
        .createQueryBuilder('qa')
        .leftJoinAndSelect('qa.quotaRound', 'qr')
        .leftJoinAndSelect('qr.quotaConfig', 'qc')
        .leftJoinAndSelect('qa.quotaAllocationItems', 'item')
        .leftJoinAndSelect('item.poi', 'poi')
        .leftJoinAndSelect('poi.potentialStores', 'potentialStore')
        .leftJoinAndSelect('item.closedStorePoi', 'closedPoi')
        .leftJoinAndSelect('closedPoi.potentialStores', 'closedPotentialStore')
        .where('qc.id = :configId', { configId: config.id })
        .andWhere('qa.zone_id = :zoneId', { zoneId: zone.id })
        .andWhere('qr.quotaRoundStatusId IN (:...statusIds)', { statusIds: [2, 3] })
        .orderBy('qr.seq', 'ASC')
        .addOrderBy('item.type', 'DESC') // MAIN before RESERVE
        .addOrderBy('item.seq', 'ASC')
        .getMany();

      // 3. Build response
      const response: QuotaAllocationDetailResponse = {
        quota_allocation_id: allocationId,
        year: config.year,
        location_type: {
          value: config.locationType,
          name: '', // Will be filled by usecase with common code
        },
        quota_type: {
          value: config.quotaType,
          name: '', // Will be filled by usecase with common code
        },
        zone: {
          id: zone.id,
          code: zone.zoneCode,
          name: zone.zoneCode, // Assuming zone name = zone code
        },

        round_allocations: allAllocations.map((allocation) => ({
          quota_allocation_id: allocation.id,
          quota_round: {
            id: allocation.quotaRound.id,
            seq: allocation.quotaRound.seq,
            name: allocation.quotaRound.name,
            start_month: allocation.quotaRound.startMonth,
            end_month: allocation.quotaRound.endMonth,
            due_date: allocation.quotaRound.dueDate?.toISOString() ?? null,
            is_review_mode: allocation.quotaRound.isReview,
          },
          assigned_quota: allocation.assignedQuota,
          reserved_quota: allocation.reservedQuota,
          assigned_items: (allocation.quotaAllocationItems || [])
            .filter((item) => item.type === 'MAIN')
            .map((item) => ({
              id: item.id,
              seq: item.seq,
              poi: {
                id: item.poi.poiId,
                form_no: item.poi.potentialStores?.[0]?.formLocNumber || '',
                name: item.poi.name || '',
                zone_code: item.poi.zoneCode || '',
                sub_zone: item.poi.subzoneCode || '',
              },
              open_type: item.openType || '',
              open_month: item.openMonth || '',
              closed_store: item.closedStorePoi
                ? {
                    poi_id: item.closedStorePoi.poiId,
                    form_no:
                      item.closedStorePoi.potentialStores?.[0]?.formLocNumber || '',
                    name: item.closedStorePoi.name || '',
                  }
                : null,
            })),
          reserved_items: (allocation.quotaAllocationItems || [])
            .filter((item) => item.type === 'RESERVE')
            .map((item) => ({
              id: item.id,
              seq: item.seq,
              poi: {
                id: item.poi.poiId,
                form_no: item.poi.potentialStores?.[0]?.formLocNumber || '',
                name: item.poi.name || '',
                zone_code: item.poi.zoneCode || '',
                sub_zone: item.poi.subzoneCode || '',
              },
            })),
        })),
      };

      return response;
    } catch (error) {
      if (error instanceof DataAccessException) {
        throw error;
      }
      throw new DataAccessException(`Failed to get allocation detail: ${error.message}`);
    }
  }

  async getQuotaRoundIdByAllocationId(allocationId: number): Promise<number | null> {
    const raw = await this.repository
      .createQueryBuilder('qa')
      .select('qa.quotaRoundId', 'quotaRoundId')
      .where('qa.id = :id', { id: allocationId })
      .getRawOne();

    if (!raw) return null;
    return raw.quotaRoundId ?? null;
  }

  async getQuotaAllocationsForRoundStatusCheck(quotaRoundId: number): Promise<
    Array<{
      id: number;
      wfTransactionId: number | null;
      wfComplete: string | null;
      quotaAssign: number;
      annualTarget: number | null;
    }>
  > {
    const sql = `
      SELECT
        qa.id,
        t.id AS wf_transaction_id,
        wfs.wf_complete AS wf_complete,
        qa.assigned_quota AS quota_assign,
        qat.target AS annual_target
      FROM allmap.quota_allocation qa
      LEFT JOIN allmap.wf_transaction t
        ON t.ref_id = qa.id
        AND t.wf_id = $1
        AND t.is_active = 'Y'
      LEFT JOIN allmap.wf_status wfs ON wfs.id = t.wf_status_id
      LEFT JOIN allmap.quota_round qr ON qr.id = qa.quota_round_id
      LEFT JOIN allmap.quota_annual_target qat
        ON qat.quota_config_id = qr.quota_config_id
        AND qat.zone_id = qa.zone_id
      WHERE qa.quota_round_id = $2
    `;

    let rows: any[];
    try {
      rows = await this.dataSource.query(sql, [
        QuotaAllocationRepository.QUOTA_WORKFLOW_ID,
        quotaRoundId,
      ]);
    } catch (err: any) {
      throw new DataAccessException(
        `Failed to fetch quota allocations for round ${quotaRoundId}: ${err?.message || err}`,
      );
    }

    return (rows || []).map((r: any) => ({
      id: Number(r.id),
      wfTransactionId: r.wf_transaction_id ? Number(r.wf_transaction_id) : null,
      wfComplete: r.wf_complete ?? null,
      quotaAssign:
        r.quota_assign !== undefined && r.quota_assign !== null
          ? Number(r.quota_assign)
          : 0,
      annualTarget:
        r.annual_target !== undefined && r.annual_target !== null
          ? Number(r.annual_target)
          : null,
    }));
  }

  async updateQuotaRoundStatus(quotaRoundId: number, statusId: number): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .update(QuotaRoundEntity)
      .set({ quotaRoundStatusId: statusId })
      .where('id = :id', { id: quotaRoundId })
      .execute();
  }

  async saveLocationSelection(
    request: SaveLocationSelectionRequest,
    userId: number,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const logsToInsert: Partial<QuotaAllocationItemLogEntity>[] = [];
      const impactTypeUpdates = new Map<number, number>(); // potentialStoreId -> impactTypeSite

      // Collect all POI IDs and item IDs that need to be fetched
      const allPoiIds = new Set<number>();
      const itemIdsToFetch = new Set<number>();

      // Collect POI IDs and item IDs from all operations
      for (const allocation of request.allocations) {
        const { main } = allocation;

        if (main.to_add) {
          main.to_add.forEach((item) => {
            allPoiIds.add(item.poi_id);
          });
        }
        if (main.to_update) {
          main.to_update.forEach((item) => {
            allPoiIds.add(item.poi_id);
          });
        }
        if (main.to_replace) {
          main.to_replace.forEach((item) => {
            allPoiIds.add(item.poi_id);
            itemIdsToFetch.add(item.item_id);
          });
        }
      }

      // Batch load old items for to_replace operations and collect old POI IDs
      const oldItemsMap = new Map<number, number>(); // item_id -> old_poi_id
      if (itemIdsToFetch.size > 0) {
        const oldItems = await queryRunner.manager.find(QuotaAllocationItemEntity, {
          where: { id: In([...itemIdsToFetch]) },
          select: ['id', 'poiId'],
        });

        oldItems.forEach((item) => {
          oldItemsMap.set(item.id, item.poiId);
          // Add old POI IDs to fetch their details for logs
          allPoiIds.add(item.poiId);
        });
      }

      // Batch load all POI details and potential_store_ids at once
      const poiDetailsMap = new Map<
        number,
        { formNo: string; name: string; potentialStoreId: number | null }
      >();
      if (allPoiIds.size > 0) {
        const pois = await queryRunner.manager.find(PoiEntity, {
          where: { poiId: In([...allPoiIds]) },
          relations: ['potentialStores'],
        });

        pois.forEach((poi) => {
          poiDetailsMap.set(poi.poiId, {
            formNo: poi.potentialStores?.[0]?.formLocNumber || '',
            name: poi.name || '',
            potentialStoreId: poi.potentialStores?.[0]?.id || null,
          });
        });
      }

      // Process each allocation
      for (const allocation of request.allocations) {
        const { allocation_id, main } = allocation;

        // Process main locations - to_add
        if (main.to_add && main.to_add.length > 0) {
          for (const item of main.to_add) {
            // If item_id exists, it means it was moved from reserve
            // Change type from RESERVE to MAIN and update other fields
            if (item.item_id) {
              await queryRunner.manager.update(
                QuotaAllocationItemEntity,
                { id: item.item_id },
                {
                  type: 'MAIN',
                  seq: item.seq,
                  poiId: item.poi_id,
                  openType: item.open_type,
                  openMonth: item.open_month,
                  closedStorePoiId: item.closed_store_poi_id,
                  updateBy: userId,
                  updateDate: now,
                },
              );

              // Prepare log
              const poiDetails = poiDetailsMap.get(item.poi_id) || {
                formNo: '',
                name: '',
              };
              const detail = `เลือกทำเล ${poiDetails.formNo} ${poiDetails.name}`;
              logsToInsert.push({
                quotaAllocationItemId: item.item_id,
                detail,
                oldPoiId: null,
                newPoiId: item.poi_id,
                createBy: userId,
                createDate: now,
                updateBy: userId,
                updateDate: now,
              });

              // Collect impact_type_site update
              if (item.open_type) {
                const poiInfo = poiDetailsMap.get(item.poi_id);
                if (poiInfo?.potentialStoreId) {
                  impactTypeUpdates.set(
                    poiInfo.potentialStoreId,
                    parseInt(item.open_type, 10),
                  );
                }
              }
            } else {
              // New item
              const newItem = queryRunner.manager.create(QuotaAllocationItemEntity, {
                quotaAllocationId: allocation_id,
                seq: item.seq,
                type: 'MAIN',
                poiId: item.poi_id,
                openType: item.open_type,
                openMonth: item.open_month,
                closedStorePoiId: item.closed_store_poi_id,
                createBy: userId,
                createDate: now,
                updateBy: userId,
                updateDate: now,
              });
              const savedItem = await queryRunner.manager.save(newItem);

              // Prepare log
              const poiDetails = poiDetailsMap.get(item.poi_id) || {
                formNo: '',
                name: '',
              };
              const detail = `เลือกทำเล ${poiDetails.formNo} ${poiDetails.name}`;
              logsToInsert.push({
                quotaAllocationItemId: savedItem.id,
                detail,
                oldPoiId: null,
                newPoiId: item.poi_id,
                createBy: userId,
                createDate: now,
                updateBy: userId,
                updateDate: now,
              });

              // Collect impact_type_site update
              if (item.open_type) {
                const poiInfo = poiDetailsMap.get(item.poi_id);
                if (poiInfo?.potentialStoreId) {
                  impactTypeUpdates.set(
                    poiInfo.potentialStoreId,
                    parseInt(item.open_type, 10),
                  );
                }
              }
            }
          }
        }

        // Process main locations - to_update
        if (main.to_update && main.to_update.length > 0) {
          for (const item of main.to_update) {
            await queryRunner.manager.update(
              QuotaAllocationItemEntity,
              { id: item.item_id },
              {
                seq: item.seq,
                poiId: item.poi_id,
                openType: item.open_type,
                openMonth: item.open_month,
                closedStorePoiId: item.closed_store_poi_id,
                updateBy: userId,
                updateDate: now,
              },
            );

            // Prepare log
            logsToInsert.push({
              quotaAllocationItemId: item.item_id,
              detail: 'แก้ไขข้อมูล',
              oldPoiId: null,
              newPoiId: null,
              createBy: userId,
              createDate: now,
              updateBy: userId,
              updateDate: now,
            });

            // Collect impact_type_site update
            if (item.open_type) {
              const poiInfo = poiDetailsMap.get(item.poi_id);
              if (poiInfo?.potentialStoreId) {
                impactTypeUpdates.set(
                  poiInfo.potentialStoreId,
                  parseInt(item.open_type, 10),
                );
              }
            }
          }
        }

        // Process main locations - to_replace
        if (main.to_replace && main.to_replace.length > 0) {
          for (const item of main.to_replace) {
            // Get old POI ID from pre-loaded map
            const oldPoiId = oldItemsMap.get(item.item_id);

            // Update the item
            await queryRunner.manager.update(
              QuotaAllocationItemEntity,
              { id: item.item_id },
              {
                seq: item.seq,
                poiId: item.poi_id,
                openType: item.open_type,
                openMonth: item.open_month,
                closedStorePoiId: item.closed_store_poi_id,
                updateBy: userId,
                updateDate: now,
                type: 'MAIN',
                quotaAllocationId: allocation.allocation_id,
              },
            );

            // Prepare log
            if (oldPoiId) {
              const oldPoiDetails = poiDetailsMap.get(oldPoiId) || {
                formNo: '',
                name: '',
              };
              const newPoiDetails = poiDetailsMap.get(item.poi_id) || {
                formNo: '',
                name: '',
              };
              const detail = `เปลี่ยนทำเลจาก ${oldPoiDetails.formNo} ${oldPoiDetails.name} เป็น ${newPoiDetails.formNo} ${newPoiDetails.name}`;
              logsToInsert.push({
                quotaAllocationItemId: item.item_id,
                detail,
                oldPoiId,
                newPoiId: item.poi_id,
                createBy: userId,
                createDate: now,
                updateBy: userId,
                updateDate: now,
              });
            }

            // Collect impact_type_site update
            if (item.open_type) {
              const poiInfo = poiDetailsMap.get(item.poi_id);
              if (poiInfo?.potentialStoreId) {
                impactTypeUpdates.set(
                  poiInfo.potentialStoreId,
                  parseInt(item.open_type, 10),
                );
              }
            }
          }
        }

        // Process main locations - to_delete
        if (main.to_delete && main.to_delete.length > 0) {
          await queryRunner.manager.delete(QuotaAllocationItemEntity, {
            id: In(main.to_delete),
          });
        }
      }

      // Process reserve locations if present
      if (request.reserve) {
        const { reserve } = request;

        // Get first allocation to determine allocation_id for reserve items
        const firstAllocationId = request.allocations[0]?.allocation_id;
        if (!firstAllocationId) {
          throw new DataAccessException('No allocation ID found for reserve items');
        }

        // Process reserve - to_add (batch insert)
        if (reserve.to_add && reserve.to_add.length > 0) {
          const newReserveItems = reserve.to_add.map((item) =>
            queryRunner.manager.create(QuotaAllocationItemEntity, {
              quotaAllocationId: firstAllocationId,
              seq: item.seq,
              type: 'RESERVE',
              poiId: item.poi_id,
              openType: null,
              openMonth: null,
              closedStorePoiId: null,
              createBy: userId,
              createDate: now,
              updateBy: userId,
              updateDate: now,
            }),
          );
          await queryRunner.manager.save(newReserveItems);
        }

        // Process reserve - to_replace (batch update)
        if (reserve.to_replace && reserve.to_replace.length > 0) {
          for (const item of reserve.to_replace) {
            await queryRunner.manager.update(
              QuotaAllocationItemEntity,
              { id: item.item_id },
              {
                seq: item.seq,
                poiId: item.poi_id,
                updateBy: userId,
                updateDate: now,
              },
            );
          }
        }

        // Process reserve - to_delete
        if (reserve.to_delete && reserve.to_delete.length > 0) {
          await queryRunner.manager.delete(QuotaAllocationItemEntity, {
            id: In(reserve.to_delete),
          });
        }
      }

      // Batch insert all logs at once
      if (logsToInsert.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(QuotaAllocationItemLogEntity)
          .values(logsToInsert)
          .execute();
      }

      // Batch update impact_type_site in element_seven_eleven
      if (impactTypeUpdates.size > 0) {
        for (const [potentialStoreId, impactTypeSite] of impactTypeUpdates) {
          await queryRunner.manager.update(
            ElementSevenElevenEntity,
            { potentialStoreId },
            {
              impactTypeSite,
              updatedDate: now,
            },
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new DataAccessException(
        `Failed to save location selection: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getItemHistory(itemId: number): Promise<GetItemHistoryResponse> {
    try {
      // Check if item exists
      const item = await this.itemRepository.findOne({
        where: { id: itemId },
      });

      if (!item) {
        throw new DataAccessException(`Item ${itemId} not found`);
      }

      // Get all history logs for this item with user info
      const logs = await this.itemLogRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.createdByUser', 'user')
        .where('log.quota_allocation_item_id = :itemId', { itemId })
        .orderBy('log.create_date', 'DESC')
        .getMany();

      // Map the response
      const response: GetItemHistoryResponse = {
        history: logs.map((log) => ({
          detail: log.detail,
          remark: log.remark,
          created_by_name: log.createdByUser
            ? `${log.createdByUser.firstName || ''} ${log.createdByUser.lastName || ''}`.trim()
            : 'Unknown',
          created_date: log.createDate,
        })),
      };

      return response;
    } catch (error) {
      if (error instanceof DataAccessException) {
        throw error;
      }
      throw new DataAccessException(`Failed to get item history: ${error.message}`);
    }
  }

  async isLocationUsedInHistory(poiId: number): Promise<boolean> {
    const result = await this.itemRepository
      .createQueryBuilder('qai')
      .select('qai.id')
      .where('qai.poiId = :poiId', { poiId })
      .getRawOne();

    return !!result;
  }
}
