import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DynamicFormRepositoryPort } from '../../../application/ports/dynamicForm.repository';
import { DformEntity } from './entities/dform.entity';
import { DformVersionEntity } from './entities/dformVersion.entity';
import { DformFieldEntity } from './entities/dformField.entity';
import { DformValueEntity } from './entities/dformValue.entity';
import { DformConfigEntity } from './entities/dformConfig.entity';

@Injectable()
export class DynamicFormRepository implements DynamicFormRepositoryPort {
  constructor(
    @InjectRepository(DformEntity)
    private readonly dformModel: Repository<DformEntity>,

    @InjectRepository(DformVersionEntity)
    private readonly dformVersionModel: Repository<DformVersionEntity>,

    @InjectRepository(DformFieldEntity)
    private readonly dformFieldModel: Repository<DformFieldEntity>,

    @InjectRepository(DformValueEntity)
    private readonly dformValueModel: Repository<DformValueEntity>,

    @InjectRepository(DformConfigEntity)
    private readonly dformConfigModel: Repository<DformConfigEntity>,

    private dataSource: DataSource,
  ) {}

  async getDynamicForm(formId: number): Promise<any> {
    const query = `
      SELECT
        f.form_id as "FORM_ID",
        cfg.form_name as "FORM_NAME",
        cfg.form_title as "FORM_TITLE",
        f.form_version_id as "FORM_VERSION_ID",
        f.reference_obj as "REFERENCE_OBJ",
        f.reference_key as "REFERENCE_KEY",
        f.created_date as "CREATED_DATE",
        f.created_user as "CREATED_USER",
        f.last_edited_date as "LAST_EDITED_DATE",
        f.last_edited_user as "LAST_EDITED_USER",
        json_agg( 
          json_build_object( 
            'FIELD_ID', fld.field_id, 
            'FIELD_NAME', fld.field_name, 
            'TITLE', fld.title, 
            'DATA_TYPE', fld.data_type, 
            'VALUE_FORMAT', fld.value_format, 
            'INPUT_TYPE', fld.input_type, 
            'LIST_VALUE', fld.list_value, 
            'SEQ', fld.seq, 
            'PARENT_FIELD_ID', fld.parent_field_id, 
            'SHOW_IF_PARENT_VALUE', fld.show_if_parent_value, 
            'ENABLED_IF_PARENT_VALUE', fld.enabled_if_parent_value, 
            'IS_LOCKED', fld.is_locked, 
            'FIELD_GROUP', fld.field_group, 
            'IS_REQUIRED', fld.is_required, 
            'VALIDATE_MIN', fld.validate_min, 
            'VALIDATE_MAX', fld.validate_max, 
            'VALIDATE_REGEX', fld.validate_regex, 
            'HAS_OTHER', fld.has_other, 
            'IS_SHOW_PERCENT', fld.is_show_percent, 
            'IS_SHOW_TOTAL', fld.is_show_total, 
            'TOTAL_TITLE', fld.total_title, 
            'VALIDATE_TOTAL_MIN', fld.validate_total_min, 
            'VALIDATE_TOTAL_MAX', fld.validate_total_max, 
            'FORMULA', fld.formula, 
            'VALUE', val.value, 
            'VALUE_TEXT', txt.value_text, 
            'VALUE_JSONB', json.value_jsonb 
          ) 
        ) as fields
      FROM allmap.dform f
      JOIN allmap.dform_version v ON f.form_version_id = v.form_version_id
      JOIN allmap.dform_config cfg ON v.form_config_id = cfg.form_config_id
      JOIN allmap.dform_field fld ON v.form_version_id = fld.form_version_id
      LEFT JOIN allmap.dform_value val ON val.form_id = f.form_id AND val.field_id = fld.field_id
      LEFT JOIN allmap.dform_text txt ON txt.value_id = val.value_id
      LEFT JOIN allmap.dform_jsonb json ON json.value_id = val.value_id AND json.field_id = fld.field_id
      WHERE f.form_id = $1
      GROUP BY
        f.form_id,
        cfg.form_name,
        cfg.form_title,
        f.form_version_id,
        f.reference_obj,
        f.reference_key,
        f.created_date,
        f.created_user,
        f.last_edited_date,
        f.last_edited_user
    `;

    const result = await this.dataSource.query(query, [formId]);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0];
  }

  async getDynamicFormByReference(
    referenceObj: string,
    referenceKey: number,
  ): Promise<any> {
    const query = `
      SELECT
        f.form_id as "FORM_ID",
        cfg.form_name as "FORM_NAME",
        cfg.form_title as "FORM_TITLE",
        f.form_version_id as "FORM_VERSION_ID",
        f.reference_obj as "REFERENCE_OBJ",
        f.reference_key as "REFERENCE_KEY",
        f.created_date as "CREATED_DATE",
        f.created_user as "CREATED_USER",
        f.last_edited_date as "LAST_EDITED_DATE",
        f.last_edited_user as "LAST_EDITED_USER",
        json_agg( 
          json_build_object( 
            'FIELD_ID', fld.field_id, 
            'FIELD_NAME', fld.field_name, 
            'TITLE', fld.title, 
            'DATA_TYPE', fld.data_type, 
            'VALUE_FORMAT', fld.value_format, 
            'INPUT_TYPE', fld.input_type, 
            'LIST_VALUE', fld.list_value, 
            'SEQ', fld.seq, 
            'PARENT_FIELD_ID', fld.parent_field_id, 
            'SHOW_IF_PARENT_VALUE', fld.show_if_parent_value, 
            'ENABLED_IF_PARENT_VALUE', fld.enabled_if_parent_value, 
            'IS_LOCKED', fld.is_locked, 
            'FIELD_GROUP', fld.field_group, 
            'IS_REQUIRED', fld.is_required, 
            'VALIDATE_MIN', fld.validate_min, 
            'VALIDATE_MAX', fld.validate_max, 
            'VALIDATE_REGEX', fld.validate_regex, 
            'HAS_OTHER', fld.has_other, 
            'IS_SHOW_PERCENT', fld.is_show_percent, 
            'IS_SHOW_TOTAL', fld.is_show_total, 
            'TOTAL_TITLE', fld.total_title, 
            'VALIDATE_TOTAL_MIN', fld.validate_total_min, 
            'VALIDATE_TOTAL_MAX', fld.validate_total_max, 
            'FORMULA', fld.formula, 
            'VALUE', val.value, 
            'VALUE_TEXT', txt.value_text, 
            'VALUE_JSONB', json.value_jsonb 
          ) 
        ) as fields
      FROM allmap.dform f
      JOIN allmap.dform_version v ON f.form_version_id = v.form_version_id
      JOIN allmap.dform_config cfg ON v.form_config_id = cfg.form_config_id
      JOIN allmap.dform_field fld ON v.form_version_id = fld.form_version_id
      LEFT JOIN allmap.dform_value val ON val.form_id = f.form_id AND val.field_id = fld.field_id
      LEFT JOIN allmap.dform_text txt ON txt.value_id = val.value_id
      LEFT JOIN allmap.dform_jsonb json ON json.value_id = val.value_id AND json.field_id = fld.field_id
      WHERE f.reference_obj = $1 AND f.reference_key = $2
      GROUP BY
        f.form_id,
        cfg.form_name,
        cfg.form_title,
        f.form_version_id,
        f.reference_obj,
        f.reference_key,
        f.created_date,
        f.created_user,
        f.last_edited_date,
        f.last_edited_user
    `;

    const result = await this.dataSource.query(query, [referenceObj, referenceKey]);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0];
  }

  async getBlankForm(formConfigId: number, formVersionId: number): Promise<any> {
    const query = `
      SELECT json_build_object( 
        'FORM_ID', '', 
        'FORM_NAME', cfg.form_name, 
        'FORM_TITLE', cfg.form_title, 
        'FORM_VERSION_ID', v.form_version_id, 
        'REFERENCE_OBJ', '', 
        'REFERENCE_KEY', '', 
        'CREATED_DATE', NOW(), 
        'CREATED_USER', '', 
        'LAST_EDITED_DATE', NOW(), 
        'LAST_EDITED_USER', '', 
        'fields', json_agg( 
          json_build_object( 
            'FIELD_ID', fld.field_id, 
            'FIELD_NAME', fld.field_name, 
            'TITLE', fld.title, 
            'DATA_TYPE', fld.data_type, 
            'VALUE_FORMAT', fld.value_format, 
            'INPUT_TYPE', fld.input_type, 
            'LIST_VALUE', fld.list_value, 
            'SEQ', fld.seq, 
            'PARENT_FIELD_ID', fld.parent_field_id, 
            'SHOW_IF_PARENT_VALUE', fld.show_if_parent_value, 
            'ENABLED_IF_PARENT_VALUE', fld.enabled_if_parent_value, 
            'IS_LOCKED', fld.is_locked, 
            'FIELD_GROUP', fld.field_group, 
            'IS_REQUIRED', fld.is_required, 
            'VALIDATE_MIN', fld.validate_min, 
            'VALIDATE_MAX', fld.validate_max, 
            'VALIDATE_REGEX', fld.validate_regex, 
            'HAS_OTHER', fld.has_other, 
            'IS_SHOW_PERCENT', fld.is_show_percent, 
            'IS_SHOW_TOTAL', fld.is_show_total, 
            'TOTAL_TITLE', fld.total_title, 
            'VALIDATE_TOTAL_MIN', fld.validate_total_min, 
            'VALIDATE_TOTAL_MAX', fld.validate_total_max, 
            'FORMULA', fld.formula, 
            'VALUE', '', 
            'VALUE_TEXT', '', 
            'VALUE_JSONB', '' 
          ) 
        ) 
      ) AS form_json 
      FROM allmap.dform_config cfg 
      JOIN allmap.dform_version v ON cfg.form_config_id = v.form_config_id 
      JOIN allmap.dform_field fld ON v.form_version_id = fld.form_version_id 
      WHERE cfg.form_config_id = $1 
        AND v.form_version_id = $2 
      GROUP BY cfg.form_name, cfg.form_title, v.form_version_id
    `;

    const result = await this.dataSource.query(query, [formConfigId, formVersionId]);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0].form_json;
  }

  async generateFormId(): Promise<number | null> {
    const query = `
      SELECT 
        CASE 
          WHEN next_num > 99999 THEN NULL   
          ELSE (year * 100000 + next_num)::int 
        END AS next_id 
      FROM ( 
        SELECT 
          EXTRACT(YEAR FROM CURRENT_DATE)::int AS year, 
          COALESCE(MAX(form_id % 100000), 0) + 1 AS next_num 
        FROM allmap.dform 
        WHERE form_id / 100000 = EXTRACT(YEAR FROM CURRENT_DATE)::int 
      ) sub
    `;

    const result = await this.dataSource.query(query);

    if (!result || result.length === 0 || result[0].next_id === null) {
      return null;
    }

    return result[0].next_id;
  }

  async findByFormId(formId: number): Promise<DformEntity | null> {
    return await this.dformModel
      .createQueryBuilder('df')
      .where('df.form_id = :formId', { formId })
      .getOne();
  }

  async findByReferenceKey(
    referenceObj: string,
    referenceKey: string,
  ): Promise<DformEntity | null> {
    return await this.dformModel
      .createQueryBuilder('df')
      .where('df.reference_obj = :referenceObj', { referenceObj })
      .andWhere('df.reference_key = :referenceKey', { referenceKey })
      .getOne();
  }

  async getFormConfigIdBySubcode(subCode: string): Promise<number | null> {
    const query = `
      SELECT pscat.form_config_id
      FROM allmap.profile_sub_code psc
      JOIN allmap.profile_sub_categories pscat ON psc.profile_sub_cagetory_id = pscat.id
      WHERE psc.sub_code = $1
      LIMIT 1
    `;

    const result = await this.dataSource.query(query, [subCode]);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0].form_config_id;
  }

  async createDynamicFormWithValues(data: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Insert DFORM
      await queryRunner.query(
        `
        INSERT INTO allmap.dform (
          form_id,
          form_version_id,
          reference_obj,
          reference_key,
          created_date,
          created_user,
          last_edited_date,
          last_edited_user
        ) VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), $6)
      `,
        [
          data.formId,
          data.formVersionId,
          data.referenceObj,
          data.referenceKey,
          data.createdUser,
          data.lastEditedUser,
        ],
      );

      // 2. Get next value_id sequence
      let valueIdCounter = 1;
      const valueIdResult = await queryRunner.query(
        `SELECT COALESCE(MAX(value_id), 0) + 1 as next_id FROM allmap.dform_value`,
      );
      valueIdCounter = valueIdResult[0].next_id;

      // 3. Loop through fields and insert values
      for (const field of data.fields) {
        const valueId = valueIdCounter++;
        let formattedValue = field.VALUE;

        // Format data based on DATA_TYPE
        if (
          field.DATA_TYPE === 'NUMBER' &&
          formattedValue !== null &&
          formattedValue !== ''
        ) {
          if (Array.isArray(formattedValue)) {
            // If array, format each element and keep as array
            formattedValue = JSON.stringify(
              formattedValue.map((val) => parseFloat(val).toFixed(2)),
            );
          } else if (
            typeof formattedValue === 'string' &&
            formattedValue.startsWith('{')
          ) {
            // If PostgreSQL array format like {"1","11","1"}, parse and format
            const arrayMatch = formattedValue.match(/\{([^}]+)\}/);
            if (arrayMatch) {
              const values = arrayMatch[1]
                .split(',')
                .map((v) => v.replace(/"/g, '').trim());
              formattedValue = JSON.stringify(
                values.map((val) => parseFloat(val).toFixed(2)),
              );
            }
          } else {
            // If single value, format as before
            formattedValue = parseFloat(formattedValue).toFixed(2);
          }
        } else if (
          field.DATA_TYPE === 'DATE' &&
          formattedValue !== null &&
          formattedValue !== ''
        ) {
          const date = new Date(formattedValue);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          formattedValue = `${day}/${month}/${year}`;
        }

        // Insert based on DATA_TYPE
        if (field.DATA_TYPE === 'TEXT') {
          // Insert NULL to DFORM_VALUE
          await queryRunner.query(
            `
            INSERT INTO allmap.dform_value (value_id, form_id, field_id, value)
            VALUES ($1, $2, $3, NULL)
          `,
            [valueId, data.formId, field.FIELD_ID],
          );

          // Insert to DFORM_TEXT
          if (field.VALUE_TEXT) {
            await queryRunner.query(
              `
              INSERT INTO allmap.dform_text (value_id, value_text)
              VALUES ($1, $2)
            `,
              [valueId, field.VALUE_TEXT],
            );
          }
        } else if (field.DATA_TYPE === 'JSON') {
          // Insert NULL to DFORM_VALUE
          await queryRunner.query(
            `
            INSERT INTO allmap.dform_value (value_id, form_id, field_id, value)
            VALUES ($1, $2, $3, NULL)
          `,
            [valueId, data.formId, field.FIELD_ID],
          );

          // Insert to DFORM_JSONB
          if (field.VALUE_JSONB) {
            await queryRunner.query(
              `
              INSERT INTO allmap.dform_jsonb (value_id, field_id, value_jsonb)
              VALUES ($1, $2, $3)
            `,
              [valueId, field.FIELD_ID, JSON.stringify(field.VALUE_JSONB)],
            );
          }
        } else {
          // STRING, NUMBER, DATE - Insert to DFORM_VALUE
          await queryRunner.query(
            `
            INSERT INTO allmap.dform_value (value_id, form_id, field_id, value)
            VALUES ($1, $2, $3, $4)
          `,
            [valueId, data.formId, field.FIELD_ID, formattedValue],
          );
        }
      }

      await queryRunner.commitTransaction();

      return {
        formId: data.formId,
        message: 'Dynamic form created successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateDynamicFormWithValues(formId: number, data: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update DFORM
      await queryRunner.query(
        `
        UPDATE allmap.dform
        SET 
          form_version_id = COALESCE($1, form_version_id),
          reference_obj = COALESCE($2, reference_obj),
          reference_key = COALESCE($3, reference_key),
          last_edited_date = NOW(),
          last_edited_user = $4
        WHERE form_id = $5
      `,
        [
          data.formVersionId,
          data.referenceObj,
          data.referenceKey,
          data.lastEditedUser,
          formId,
        ],
      );

      // 2. Delete existing values
      // Delete from DFORM_TEXT first
      await queryRunner.query(
        `
        DELETE FROM allmap.dform_text
        WHERE value_id IN (
          SELECT value_id FROM allmap.dform_value WHERE form_id = $1
        )
      `,
        [formId],
      );

      // Delete from DFORM_JSONB
      await queryRunner.query(
        `
        DELETE FROM allmap.dform_jsonb
        WHERE value_id IN (
          SELECT value_id FROM allmap.dform_value WHERE form_id = $1
        )
      `,
        [formId],
      );

      // Delete from DFORM_VALUE
      await queryRunner.query(
        `
        DELETE FROM allmap.dform_value
        WHERE form_id = $1
      `,
        [formId],
      );

      // 3. Get next value_id sequence
      let valueIdCounter = 1;
      const valueIdResult = await queryRunner.query(
        `SELECT COALESCE(MAX(value_id), 0) + 1 as next_id FROM allmap.dform_value`,
      );
      valueIdCounter = valueIdResult[0].next_id;

      // 4. Loop through fields and insert new values (same logic as create)
      for (const field of data.fields) {
        const valueId = valueIdCounter++;
        let formattedValue = field.VALUE;

        // Format data based on DATA_TYPE
        if (
          field.DATA_TYPE === 'NUMBER' &&
          formattedValue !== null &&
          formattedValue !== ''
        ) {
          if (Array.isArray(formattedValue)) {
            // If JS array, format each element and convert to PostgreSQL array format
            const formattedArray = formattedValue.map(
              (val) => `"${parseFloat(val).toFixed(2)}"`,
            );
            formattedValue = `{${formattedArray.join(',')}}`;
          } else if (
            typeof formattedValue === 'string' &&
            formattedValue.startsWith('{')
          ) {
            // If PostgreSQL array format like {"1","11","1"}, keep the same format
            const arrayMatch = formattedValue.match(/\{([^}]+)\}/);
            if (arrayMatch) {
              const values = arrayMatch[1]
                .split(',')
                .map((v) => v.replace(/"/g, '').trim());
              const formattedArray = values.map(
                (val) => `"${parseFloat(val).toFixed(2)}"`,
              );
              formattedValue = `{${formattedArray.join(',')}}`;
            }
          } else {
            // If single value, format as before
            formattedValue = parseFloat(formattedValue).toFixed(2);
          }
        } else if (
          field.DATA_TYPE === 'DATE' &&
          formattedValue !== null &&
          formattedValue !== ''
        ) {
          const date = new Date(formattedValue);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          formattedValue = `${day}/${month}/${year}`;
        }

        // Insert based on DATA_TYPE
        if (field.DATA_TYPE === 'TEXT') {
          // Insert NULL to DFORM_VALUE
          await queryRunner.query(
            `
            INSERT INTO allmap.dform_value (value_id, form_id, field_id, value)
            VALUES ($1, $2, $3, NULL)
          `,
            [valueId, formId, field.FIELD_ID],
          );

          // Insert to DFORM_TEXT
          if (field.VALUE_TEXT) {
            await queryRunner.query(
              `
              INSERT INTO allmap.dform_text (value_id, value_text)
              VALUES ($1, $2)
            `,
              [valueId, field.VALUE_TEXT],
            );
          }
        } else if (field.DATA_TYPE === 'JSON') {
          // Insert NULL to DFORM_VALUE
          await queryRunner.query(
            `
            INSERT INTO allmap.dform_value (value_id, form_id, field_id, value)
            VALUES ($1, $2, $3, NULL)
          `,
            [valueId, formId, field.FIELD_ID],
          );

          // Insert to DFORM_JSONB
          if (field.VALUE_JSONB) {
            await queryRunner.query(
              `
              INSERT INTO allmap.dform_jsonb (value_id, field_id, value_jsonb)
              VALUES ($1, $2, $3)
            `,
              [valueId, field.FIELD_ID, JSON.stringify(field.VALUE_JSONB)],
            );
          }
        } else {
          // STRING, NUMBER, DATE - Insert to DFORM_VALUE
          await queryRunner.query(
            `
            INSERT INTO allmap.dform_value (value_id, form_id, field_id, value)
            VALUES ($1, $2, $3, $4)
          `,
            [valueId, formId, field.FIELD_ID, formattedValue],
          );
        }
      }

      await queryRunner.commitTransaction();

      return {
        formId: formId,
        message: 'Dynamic form updated successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getActiveFormVersion(formConfigId: number): Promise<DformVersionEntity | null> {
    return await this.dformVersionModel
      .createQueryBuilder('fv')
      .where('fv.form_config_id = :formConfigId', { formConfigId })
      .andWhere('fv.is_active = :isActive', { isActive: 'Y' })
      .orderBy('fv.effective_date', 'DESC')
      .getOne();
  }

  async getActiveFormVersionByConfig(formConfigId: number): Promise<any> {
    const query = `
      SELECT form_version_id as "formVersionId" 
      FROM allmap.dform_version 
      WHERE form_config_id = $1 
        AND is_active = 'Y' 
        AND effective_date <= CURRENT_DATE 
      ORDER BY effective_date DESC 
      LIMIT 1
    `;

    const result = await this.dataSource.query(query, [formConfigId]);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0];
  }

  async getFormFields(formVersionId: number): Promise<DformFieldEntity[]> {
    return await this.dformFieldModel
      .createQueryBuilder('field')
      .where('field.form_version_id = :formVersionId', { formVersionId })
      .orderBy('field.seq', 'ASC')
      .getMany();
  }
}
