export interface ImportResponse {
  data: {
    success: boolean;
    recordsProcessed: number;
    importTable: string;
    importType: string;
    result?: unknown;
  };
}

export interface ImportFileDto {
  file: Express.Multer.File;
  importId: string;
}
