import { get, postFile, put } from './httpBase.service';

export interface KnowledgeCreateDto {
  fileName: string;
  filepath?: string;
  uploadDate: string;
  createdDate: string;
  updateBy: string;
  createBy: string;
  startDate: string;
  endDate: string;
  fileRoles: Array<{
    department: string;
    level: string;
    role: string;
  }>;
}

export interface AnnounceCreateDto {
  header: string;
  detail?: string;
  imagePath?: string;
  startDate?: string;
  endDate?: string;
  isHot?: string;
  isShow?: string;
  cmId?: string;
  contentType?: string;
  roles?: Array<{
    role_id: string | number;
    dept_id: string | number;
    level_id: string | number;
  }>;
}

export interface StorePlanStandardCreateDto {
  filename: string;
  version: string;
  upload_date?: string;
  upload_by?: string;
  can_load?: string;
  filepath?: string;
}
export interface KnowledgeRow {
  file_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  start_date: string | null;
  end_date: string | null;
  create_by: string;
  create_date: string | null;
  update_by: string | null;
  update_date: string | null;
}

export interface StorePlanStandardRow {
  file_id: number;
  filename: string;
  version: string;
  upload_date: string;
  upload_by: string;
  can_load: string;
  filepath: string;
}

export interface AnnounceRow {
  announceId: number;
  header: string;
  imagePath: string | null;
  startDate: string | null;
  endDate: string | null;
  isHot: string;
  isShow: string;
  createBy: string;
  createDate: string | null;
  updateBy: string | null;
  updateDate: string | null;
  detail: string | null;
  cmId: string | null;
  contentType: string | null;
}

export interface DropdownOption {
  orgId: string | undefined;
  value: string;
  text: string;
}

export interface ImportConfigDetail {
  afsimportid: string;
  importName: string;
  exampleFilePath: string;
  exampleFileName: string;
}

export type StorePlanStandardCreateResponse = {
  success: boolean;
  form: StorePlanStandardRow & { is_deleted: string };
};

export type AnnounceCreateResponse = {
  success: boolean;
  error?: string;
};

export type KnowledgeCreateResponse = {
  success: boolean;
  error?: string;
};

export const fetchImportConfigs = async (): Promise<DropdownOption[]> => {
  const response = await get<{ data: DropdownOption[] }>('/master/import-configs');
  return response.data;
};

export const getImportConfigById = async (
  importId: string
): Promise<ImportConfigDetail> => {
  const response = await get<{ data: ImportConfigDetail[] }>(
    `/master/import-configs/${importId}`
  );
  return response.data[0];
};

export const getImportConfigFields = async (importId: string) => {
  const response = await get<{ data: ImportConfigDetail }>(
    `/master/import-configs/${importId}/fields`
  );

  const detail = response.data;

  // ✅ แปลง relative path เป็น absolute path
  if (detail.exampleFilePath) {
    detail.exampleFilePath = getAbsoluteFilePath(detail.exampleFilePath);
  }

  return detail;
};

const getAbsoluteFilePath = (filePath: string): string => {
  // ถ้า path เป็น relative path (เริ่มต้นด้วย ./ หรือ ./files/)
  if (filePath.startsWith('./')) {
    return `${import.meta.env.VITE_API_URL}/${filePath.replace(/^\.\//, '')}`;
  }

  // ถ้า path เป็น absolute path แล้ว ให้ใส่ domain
  if (!filePath.startsWith('http')) {
    return `${import.meta.env.VITE_API_URL}/${filePath}`;
  }

  return filePath;
};

export const downloadTemplateFile = (filePath: string, fileName: string) => {
  const link = document.createElement('a');
  link.setAttribute('href', filePath);
  link.setAttribute('download', fileName);
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const uploadImportFile = async (importId: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    return await postFile(`import/upload/${importId}`, formData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error('Upload failed');
  }
};

export const getImportTable = async (): Promise<StorePlanStandardRow[]> => {
  const response = await get<StorePlanStandardRow[]>('/import/store-plan-standard');
  return response;
};

export const getAnnounceList = async (): Promise<AnnounceRow[]> => {
  const response = await get<AnnounceRow[]>('/import/announce');
  return response;
};

export const getKnowledgeList = async (): Promise<KnowledgeRow[]> => {
  const response = await get<KnowledgeRow[]>('/import/knowledge');
  return response;
};

export const getKnowledgeByRoleId = async (
  roleId: string | number
): Promise<KnowledgeRow[]> => {
  const response = await get<KnowledgeRow[]>(`/import/knowledge/role/${roleId}`);
  return response;
};

export const updateCanLoadStorePlanStandard = async (
  file_id: number,
  can_load: string
) => {
  return put<{ success: boolean; updated: any; error?: any }>(
    `import/store-plan-standard/${file_id}/can-load`,
    { can_load }
  );
};

export const updateAnnounceIsShow = async (
  announceId: number,
  is_show: string,
  updateBy: string
) => {
  return put<{ success: boolean; updated?: any; error?: any }>(
    `import/announce/${announceId}/is-show`,
    { is_show, updateBy }
  );
};

export const deleteBasicForm = async (file_id: number) => {
  return put<{ success: boolean; error?: any }>(
    `import/store-plan-standard/${file_id}/delete`,
    {}
  );
};

export const createAnnounce = async (
  data: AnnounceCreateDto & { image?: File }
): Promise<AnnounceCreateResponse> => {
  const formData = new FormData();
  // ถ้ามีไฟล์ image ให้ append
  if ((data as any).image) {
    formData.append('file', (data as any).image);
  }
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'image' && value !== undefined && value !== null) {
      // roles: array
      if (key === 'roles' && Array.isArray(value)) {
        value.forEach((role, idx) => {
          Object.entries(role).forEach(([rk, rv]) => {
            formData.append(
              `roles[${idx}][${rk}]`,
              typeof rv === 'string' ? rv : String(rv)
            );
          });
        });
      } else {
        formData.append(key, typeof value === 'string' ? value : String(value));
      }
    }
  });

  try {
    return await postFile<AnnounceCreateResponse>('import/announce', formData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error('Upload failed');
  }
};

export const deleteKnowledge = async (file_id: number) => {
  return put<{ success: boolean; error?: any }>(`import/knowledge/${file_id}/delete`, {});
};

export const deleteAnnounce = async (file_id: number) => {
  return put<{ success: boolean; error?: any }>(`import/announce/${file_id}/delete`, {});
};

export const uploadBasicFormWithFile = async (
  data: StorePlanStandardCreateDto,
  file: File
) => {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value as string);
    }
  });

  try {
    return await postFile<StorePlanStandardCreateResponse>(
      'import/store-plan-standard',
      formData
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error('Upload failed');
  }
};

// import knowledge form with file
export const ImportKnowledgeForm = async (
  data: KnowledgeCreateDto
): Promise<KnowledgeCreateResponse> => {
  const formData = new FormData();

  if ((data as any).file) {
    const files = Array.isArray((data as any).file)
      ? (data as any).file
      : [(data as any).file];
    files.forEach((file: File) => formData.append('file', file));
  }
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'file' && value !== undefined && value !== null) {
      // fileRoles: array
      if (key === 'fileRoles' && Array.isArray(value)) {
        value.forEach((role, idx) => {
          Object.entries(role).forEach(([rk, rv]) => {
            formData.append(
              `fileRoles[${idx}][${rk}]`,
              typeof rv === 'string' ? rv : String(rv)
            );
          });
        });
      } else {
        formData.append(key, typeof value === 'string' ? value : String(value));
      }
    }
  });
  try {
    return await postFile<KnowledgeCreateResponse>('import/knowledge', formData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error('Upload failed');
  }
};

export const getDownloadUrl = async (
  type: 'store-plan-standard' | 'knowledge',
  id: number | string
): Promise<string> => {
  const data = await get<{ url: string }>(`/import/${id}/download?type=${type}`);
  return data.url;
};
